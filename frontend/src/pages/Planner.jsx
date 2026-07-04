import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { Flame, Send, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ClarifyingCards, answersSummary } from "@/components/utsav/ClarifyingCards";
import { API } from "@/lib/utsav";

function uuid() {
  return (crypto.randomUUID && crypto.randomUUID()) || `s-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const ASSEMBLY_STEPS = [
  "Setting the mandap…",
  "Calling the best vendors…",
  "Balancing the budget in ₹…",
  "Writing your invite…",
  "Lighting the diyas…",
];

export default function Planner() {
  const navigate = useNavigate();
  const location = useLocation();
  const sessionId = useRef(uuid());
  const [messages, setMessages] = useState([]);
  const [cards, setCards] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [assembling, setAssembling] = useState(false);
  const [assemblyStep, setAssemblyStep] = useState(0);
  const [composer, setComposer] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const startedRef = useRef(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const initialMessage = useMemo(
    () => location.state?.initialMessage || sessionStorage.getItem("utsav_initial") || "",
    [location.state]
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, cards, loading]);

  useEffect(() => {
    if (initialMessage && !startedRef.current) {
      startedRef.current = true;
      sessionStorage.removeItem("utsav_initial");
      sendTurn({ message: initialMessage }, initialMessage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMessage]);

  useEffect(() => {
    if (!assembling) return;
    const iv = setInterval(() => setAssemblyStep((s) => Math.min(s + 1, ASSEMBLY_STEPS.length - 1)), 500);
    return () => clearInterval(iv);
  }, [assembling]);

  async function sendTurn(payload, userBubbleText) {
    if (userBubbleText) {
      setMessages((m) => [...m, { role: "user", text: userBubbleText }]);
    }
    setCards([]);
    setAnswers({});
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/chat`, { sessionId: sessionId.current, ...payload }, { timeout: 90000 });
      setMessages((m) => [...m, { role: "assistant", text: data.assistantMessage }]);
      if (data.phase === "complete" && data.eventSlug) {
        setAssembling(true);
        setTimeout(() => navigate(`/e/${data.eventSlug}`, { state: { justCreated: true } }), 2600);
      } else {
        setCards(data.clarifyingCards || []);
      }
    } catch (e) {
      const detail = e?.response?.data?.detail || "Utsav AI could not respond. Please try again.";
      toast.error(detail);
      setMessages((m) => [...m, { role: "assistant", text: "Oops, thoda network hiccup! Try sending that again." }]);
    } finally {
      setLoading(false);
    }
  }

  const answeredCount = cards.filter((c) => {
    const v = answers[c.id];
    return v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0);
  }).length;
  const allAnswered = cards.length > 0 && answeredCount === cards.length;

  function submitAnswers(partial = false) {
    const payload = {};
    cards.forEach((c) => {
      const v = answers[c.id];
      if (v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0)) {
        payload[c.id] = v;
      } else if (partial) {
        payload[c.id] = "no preference";
      }
    });
    const summary = answersSummary(cards, answers);
    sendTurn({ tappedAnswers: payload }, summary || "Done, aage badho!");
  }

  function sendComposer() {
    const t = composer.trim();
    if (!t) return;
    setComposer("");
    sendTurn({ message: t }, t);
  }

  if (assembling) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background bg-[radial-gradient(1000px_circle_at_50%_0%,hsl(var(--primary)/0.1),transparent_60%)] px-6" data-testid="planner-assembling">
        <div className="anim-rise flex h-20 w-20 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-[var(--shadow-md)]">
          <Flame size={34} />
        </div>
        <h2 className="anim-rise font-display mt-6 text-2xl sm:text-3xl font-bold text-center">Your Utsav page is assembling…</h2>
        <div className="mt-4 h-6 overflow-hidden">
          <p key={assemblyStep} className="anim-rise text-sm text-muted-foreground text-center">
            {ASSEMBLY_STEPS[assemblyStep]}
          </p>
        </div>
        <div className="mt-8 flex w-full max-w-sm flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="anim-rise h-14 rounded-xl bg-white shadow-[var(--shadow-sm)] poster-shimmer"
              style={{ animationDelay: `${300 + i * 300}ms` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background bg-[radial-gradient(800px_circle_at_50%_-10%,hsl(var(--primary)/0.08),transparent_55%)]">
      {/* Header */}
      <header className={`sticky top-0 z-20 bg-[hsl(var(--background))]/90 backdrop-blur transition-shadow ${scrolled ? "shadow-[var(--shadow-sm)]" : ""}`}>
        <div className="mx-auto flex w-full max-w-[760px] items-center gap-3 px-4 py-3">
          <button data-testid="planner-back-button" aria-label="Back to home" onClick={() => navigate("/")} className="flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary">
            <ArrowLeft size={16} />
          </button>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">
            <Flame size={15} />
          </span>
          <div>
            <p className="font-display text-lg font-bold leading-none">Utsav Planner</p>
            <p className="text-xs text-muted-foreground mt-0.5">Tap to answer. No forms, no typing details</p>
          </div>
        </div>
      </header>

      {/* Chat area */}
      <main className="mx-auto w-full max-w-[760px] flex-1 px-4 pb-44 pt-6">
        <div className="flex flex-col gap-4" aria-live="polite">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`anim-rise ${m.role === "user" ? "self-end max-w-[85%]" : "self-start max-w-[85%]"}`}
            >
              <div
                data-testid={m.role === "user" ? "planner-user-bubble" : "planner-ai-bubble"}
                className={
                  m.role === "user"
                    ? "rounded-2xl rounded-br-md bg-secondary px-4 py-3 text-sm sm:text-base"
                    : "rounded-2xl rounded-bl-md bg-white px-4 py-3 text-sm sm:text-base shadow-[var(--shadow-sm)]"
                }
              >
                {m.role === "assistant" && (
                  <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.08em] text-[hsl(var(--primary-text))]">
                    Utsav
                  </span>
                )}
                {m.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="self-start rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-[var(--shadow-sm)]" data-testid="planner-thinking">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.08em] text-[hsl(var(--primary-text))]">
                Utsav soch raha hai
              </span>
              <span className="flex gap-1 pt-1">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="utsav-dot inline-block h-2 w-2 rounded-full bg-primary" />
                ))}
              </span>
            </div>
          )}

          {/* Clarifying cards */}
          {!loading && cards.length > 0 && (
            <ClarifyingCards cards={cards} answers={answers} onChange={(id, v) => setAnswers((a) => ({ ...a, [id]: v }))} />
          )}
          <div ref={bottomRef} />
        </div>
      </main>

      {/* Bottom bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 bg-[hsl(var(--background))]/95 shadow-[var(--shadow-sm)] backdrop-blur">
        <div className="mx-auto w-full max-w-[760px] px-4 py-3">
          {cards.length > 0 && !loading ? (
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-3">
                <Progress value={(answeredCount / cards.length) * 100} className="h-1.5 flex-1 bg-primary/15" />
                <span className="shrink-0 text-xs font-medium text-muted-foreground">
                  {answeredCount}/{cards.length}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {!allAnswered && answeredCount > 0 && (
                  <Button data-testid="planner-skip-button" variant="ghost" onClick={() => submitAnswers(true)} className="text-muted-foreground">
                    Skip rest
                  </Button>
                )}
                <Button
                  data-testid="planner-continue-button"
                  disabled={!allAnswered && answeredCount === 0}
                  onClick={() => submitAnswers(!allAnswered)}
                  className="flex-1 rounded-xl bg-primary px-6 text-primary-foreground shadow-[var(--shadow-md)] hover:bg-primary/90"
                >
                  Continue
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-end gap-2">
              <Textarea
                data-testid="planner-composer-input"
                value={composer}
                onChange={(e) => setComposer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendComposer();
                  }
                }}
                placeholder={messages.length === 0 ? "Describe your event…" : "Add more details (optional)…"}
                className="min-h-[46px] max-h-28 flex-1 resize-none rounded-xl bg-white text-sm"
                disabled={loading}
              />
              <Button
                data-testid="planner-send-button"
                onClick={sendComposer}
                disabled={loading || !composer.trim()}
                className="h-[46px] rounded-xl bg-[hsl(var(--primary))] px-4 text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/90"
              >
                <Send size={16} />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
