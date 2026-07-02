{
  "product": {
    "name": "Utsav",
    "tagline": "Bolo idea. Utsav banaye mehfil.",
    "design_personality": [
      "premium",
      "festive-yet-clean",
      "warm + welcoming (Hinglish-friendly)",
      "mobile-first",
      "tactile + tappable",
      "high-whitespace, not cluttered",
      "Indian wedding/pooja cues without being kitschy"
    ],
    "success_moments": [
      "Landing: user instantly understands ‘type one message’ + sees quick-start chips",
      "Planner: AI clarifying cards animate in and feel irresistibly tappable",
      "Event page: looks like a premium invite microsite; WhatsApp share is obvious",
      "Seeded demo event looks alive on first load"
    ]
  },

  "layout_strategy": {
    "global": {
      "mobile_first_rules": [
        "Primary layout width: max-w-[1100px] on desktop; on mobile use full width with px-4",
        "Use generous vertical rhythm: section py-10 to py-16; cards gap-3/4 on mobile",
        "Avoid centered paragraphs; align text left; center only hero headline if needed",
        "Sticky actions on mobile: bottom share bar on /e/:slug"
      ],
      "grid": {
        "base": "grid grid-cols-12 gap-4",
        "cards": "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4",
        "vendor_grid": "grid grid-cols-1 sm:grid-cols-2 gap-4",
        "timeline": "flex flex-col gap-3"
      },
      "page_shell": {
        "container": "mx-auto w-full max-w-[1100px] px-4 sm:px-6",
        "top_padding": "pt-6 sm:pt-10",
        "bottom_padding": "pb-24 sm:pb-10 (extra for sticky share bar on mobile)"
      }
    },

    "routes": {
      "/": {
        "sections": [
          "Hero (short, premium)",
          "Describe input (dominant)",
          "Quick-start event chips (horizontal scroll)",
          "Seeded demo event preview card (one gorgeous example)",
          "Tiny trust row (no logos needed): ‘No signup • Share on WhatsApp • RSVP in one tap’"
        ],
        "hero_layout": "Z-pattern: left headline + right decorative motif (subtle), then input full width"
      },
      "/plan": {
        "sections": [
          "Chat transcript (user + AI)",
          "Clarifying cards area (dynamic JSON renderer)",
          "Continue bar (sticky above keyboard on mobile)",
          "‘Building your event page’ animation state"
        ],
        "chat_layout": "Single column; messages max-w-[85%]; clarifying cards full width"
      },
      "/e/:slug": {
        "sections": [
          "Event hero (title/date/muhurat/location)",
          "Poster module (generate + download)",
          "Timeline module",
          "Vendors module",
          "Guest RSVP module",
          "Budget module",
          "Food module",
          "Checklist module",
          "Reminders module",
          "Sticky share bar (WhatsApp primary)"
        ],
        "event_page_layout": "Bento-ish card stack: each module is a Card with strong header + compact body"
      }
    }
  },

  "typography": {
    "google_fonts": {
      "display": {
        "family": "Bodoni Moda",
        "fallback": "serif",
        "usage": "Hero H1, event title, key module headings",
        "why": "Luxury editorial vibe that pairs well with festive palette"
      },
      "body": {
        "family": "Figtree",
        "fallback": "system-ui",
        "usage": "Body, UI labels, chips, helper text",
        "why": "Modern, friendly, highly readable on mobile"
      }
    },
    "tailwind_text_hierarchy": {
      "h1": "text-4xl sm:text-5xl lg:text-6xl font-[650] tracking-[-0.02em]",
      "h2": "text-base md:text-lg font-medium text-muted-foreground",
      "h3_module": "text-lg font-semibold tracking-[-0.01em]",
      "body": "text-sm sm:text-base leading-6",
      "small": "text-xs text-muted-foreground"
    },
    "copy_tone": {
      "voice": "Warm Hinglish, respectful, lightly playful",
      "examples": [
        "‘Batao, kis type ka event hai?’",
        "‘Budget ka rough idea? Don’t worry, estimate nikaal denge.’",
        "‘Guest list ready? Bas naam daalo, RSVP link share kar do.’"
      ]
    }
  },

  "color_system": {
    "notes": [
      "Festive palette: saffron/marigold + deep maroon + antique gold accents.",
      "Keep backgrounds mostly solid off-white; gradients only as subtle section backdrops (<=20% viewport).",
      "No purple. No dark saturated gradients."
    ],
    "tokens_css": {
      "where": "/app/frontend/src/index.css :root",
      "css": ":root {\n  /* Utsav — Warm Festive Clean */\n  --background: 36 33% 98%; /* warm off-white */\n  --foreground: 20 18% 12%; /* deep ink brown */\n\n  --card: 0 0% 100%;\n  --card-foreground: 20 18% 12%;\n\n  --popover: 0 0% 100%;\n  --popover-foreground: 20 18% 12%;\n\n  /* Primary = deep maroon */\n  --primary: 354 55% 28%;\n  --primary-foreground: 36 33% 98%;\n\n  /* Secondary = warm sand */\n  --secondary: 34 45% 92%;\n  --secondary-foreground: 20 18% 12%;\n\n  /* Muted = parchment */\n  --muted: 34 30% 94%;\n  --muted-foreground: 20 10% 40%;\n\n  /* Accent = marigold */\n  --accent: 38 92% 55%;\n  --accent-foreground: 20 18% 12%;\n\n  --destructive: 0 72% 52%;\n  --destructive-foreground: 0 0% 98%;\n\n  --border: 28 22% 86%;\n  --input: 28 22% 86%;\n  --ring: 38 92% 55%;\n\n  /* Extra brand tokens */\n  --utsav-gold: 43 74% 52%;\n  --utsav-maroon: 354 55% 28%;\n  --utsav-saffron: 38 92% 55%;\n  --utsav-rose: 8 70% 92%;\n\n  --radius: 0.9rem;\n\n  /* Shadows (soft, premium) */\n  --shadow-sm: 0 1px 2px hsl(20 18% 12% / 0.06);\n  --shadow-md: 0 10px 30px hsl(20 18% 12% / 0.10);\n  --shadow-card: 0 10px 24px hsl(20 18% 12% / 0.08);\n}\n"
    },
    "allowed_gradients": {
      "rule": "Gradients only for hero/section backgrounds and decorative overlays; never on small elements; never exceed 20% viewport.",
      "examples_tailwind": [
        "bg-[radial-gradient(1200px_circle_at_20%_0%,hsl(38_92%_55%/0.18),transparent_55%),radial-gradient(900px_circle_at_90%_10%,hsl(354_55%_28%/0.10),transparent_50%)]",
        "bg-[linear-gradient(135deg,hsl(38_92%_55%/0.14),hsl(43_74%_52%/0.10),transparent_60%)]"
      ]
    },
    "state_colors": {
      "success": "hsl(142 52% 36%)",
      "warning": "hsl(38 92% 55%)",
      "info": "hsl(200 70% 40%)",
      "focus_ring": "ring-2 ring-[hsl(var(--ring))] ring-offset-2 ring-offset-[hsl(var(--background))]"
    }
  },

  "texture_and_background": {
    "approach": [
      "Use subtle noise overlay on hero + planner background to avoid flatness.",
      "No transparent backgrounds; use warm off-white base."
    ],
    "css_snippet": {
      "where": "/app/frontend/src/index.css",
      "snippet": "/* Subtle noise overlay utility */\n.noise-overlay {\n  position: relative;\n}\n.noise-overlay::before {\n  content: \"\";\n  position: absolute;\n  inset: 0;\n  pointer-events: none;\n  opacity: 0.06;\n  mix-blend-mode: multiply;\n  background-image: url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"160\" height=\"160\"><filter id=\"n\"><feTurbulence type=\"fractalNoise\" baseFrequency=\"0.9\" numOctaves=\"3\" stitchTiles=\"stitch\"/></filter><rect width=\"160\" height=\"160\" filter=\"url(%23n)\" opacity=\"0.35\"/></svg>');\n}\n"
    }
  },

  "components": {
    "shadcn_component_paths": {
      "button": "/app/frontend/src/components/ui/button.jsx",
      "card": "/app/frontend/src/components/ui/card.jsx",
      "badge": "/app/frontend/src/components/ui/badge.jsx",
      "input": "/app/frontend/src/components/ui/input.jsx",
      "textarea": "/app/frontend/src/components/ui/textarea.jsx",
      "tabs": "/app/frontend/src/components/ui/tabs.jsx",
      "toggle_group": "/app/frontend/src/components/ui/toggle-group.jsx",
      "switch": "/app/frontend/src/components/ui/switch.jsx",
      "slider": "/app/frontend/src/components/ui/slider.jsx",
      "calendar": "/app/frontend/src/components/ui/calendar.jsx",
      "popover": "/app/frontend/src/components/ui/popover.jsx",
      "dialog": "/app/frontend/src/components/ui/dialog.jsx",
      "progress": "/app/frontend/src/components/ui/progress.jsx",
      "scroll_area": "/app/frontend/src/components/ui/scroll-area.jsx",
      "separator": "/app/frontend/src/components/ui/separator.jsx",
      "sonner_toast": "/app/frontend/src/components/ui/sonner.jsx"
    },

    "custom_components_to_create": [
      {
        "name": "EventTypeChips",
        "purpose": "Horizontal scroll quick-start chips on landing",
        "notes": "Use ToggleGroup (type=single) + overflow-x-auto + snap-x"
      },
      {
        "name": "ChatComposer",
        "purpose": "Large ‘Describe your event…’ input with send button; supports Enter to send",
        "notes": "Use Textarea + Button; sticky on /plan"
      },
      {
        "name": "ChatBubble",
        "purpose": "User/AI message bubbles with subtle tails",
        "notes": "Use Card-like bubble with rounded-2xl; max-w-[85%]"
      },
      {
        "name": "ClarifyingCardRenderer",
        "purpose": "Render dynamic JSON widgets: chips, multi-select pills, slider, date/time pickers, toggles",
        "notes": "This is the signature interaction; animate in with Framer Motion stagger"
      },
      {
        "name": "BudgetRupeeSlider",
        "purpose": "Budget slider with ₹ + lakh/crore formatting",
        "notes": "Use shadcn Slider; show tick labels: 25k, 50k, 1L, 2L, 5L, 10L, 25L, 1Cr"
      },
      {
        "name": "StickyShareBar",
        "purpose": "Bottom sticky CTA bar on event page",
        "notes": "WhatsApp primary; Maps + Calendar + Copy link secondary"
      },
      {
        "name": "VendorCard",
        "purpose": "Vendor shortlist cards with rating + price range + shortlist toggle",
        "notes": "Use Card + Badge + Toggle; micro-interaction on shortlist"
      },
      {
        "name": "Timeline",
        "purpose": "Vertical schedule with muhurat highlight",
        "notes": "Use left border accent + time chips"
      },
      {
        "name": "PosterGenerator",
        "purpose": "Poster preview with Generate + Download",
        "notes": "Use AspectRatio + Skeleton while generating"
      }
    ],

    "component_styles": {
      "cards": {
        "base": "rounded-[var(--radius)] bg-card text-card-foreground shadow-[var(--shadow-card)] border border-border",
        "header": "flex items-start justify-between gap-3",
        "title": "font-[600] tracking-[-0.01em]",
        "subtext": "text-sm text-muted-foreground"
      },
      "chips": {
        "single": "inline-flex items-center justify-center rounded-full border border-border bg-white px-3 py-2 text-sm font-medium shadow-[var(--shadow-sm)] active:scale-[0.98]",
        "selected": "border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]",
        "multi_selected": "border-[hsl(var(--accent))] bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]"
      },
      "primary_cta": {
        "button": "rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-[var(--shadow-md)] hover:bg-[hsl(var(--primary))]/95",
        "focus": "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2"
      },
      "secondary_cta": {
        "button": "rounded-xl border border-border bg-white hover:bg-[hsl(var(--secondary))]",
        "focus": "focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2"
      }
    }
  },

  "dynamic_json_ui_contract": {
    "principles": [
      "Every AI clarifying question returns a JSON schema describing widgets.",
      "Renderer must be deterministic and resilient: unknown widget types render as a safe fallback card.",
      "Each widget must include stable ids used for data-testid and state keys.",
      "All widgets must be thumb-friendly (min-h-[44px])."
    ],
    "example_schema": {
      "question_id": "q_budget",
      "prompt": "Budget ka rough idea?",
      "widgets": [
        {
          "type": "slider",
          "id": "budget_inr",
          "label": "Total budget (₹)",
          "min": 25000,
          "max": 2500000,
          "step": 5000,
          "format": "inr-indian"
        },
        {
          "type": "multi_select",
          "id": "food_prefs",
          "label": "Food preference",
          "options": ["Veg", "Non-veg", "Jain"]
        }
      ]
    },
    "fallback_ui": "If widget type unknown: render Card with prompt + ‘Unsupported input’ Badge and allow ‘Skip’"
  },

  "motion_and_microinteractions": {
    "library": "Framer Motion",
    "rules": [
      "No universal transition: never transition-all.",
      "Use spring for cards; easeOut for opacity.",
      "Prefer subtle scale (1.01–1.03) and y (2–6px) shifts.",
      "Stagger clarifying cards: this is the hero moment."
    ],
    "presets": {
      "card_in": {
        "initial": "{ opacity: 0, y: 10, scale: 0.98 }",
        "animate": "{ opacity: 1, y: 0, scale: 1 }",
        "transition": "{ type: 'spring', stiffness: 320, damping: 26 }"
      },
      "stagger": "{ animate: { transition: { staggerChildren: 0.06 } } }",
      "tap": "whileTap={{ scale: 0.98 }}",
      "hover": "whileHover={{ y: -2 }}"
    },
    "planner_special": [
      "When AI message arrives: typewriter-like reveal for 1–2 lines max (don’t slow demo).",
      "Clarifying cards appear with stagger + slight ‘float’.",
      "On Continue: cards collapse into a compact ‘Answer summary’ chip row (AnimatePresence)."
    ],
    "event_page_assembly": "After planning: show 2.2s assembly animation: skeleton modules slide in, then fill content."
  },

  "accessibility": {
    "requirements": [
      "WCAG AA contrast for text on backgrounds.",
      "Focus visible rings on all interactive elements.",
      "Touch targets >= 44px.",
      "Use aria-live=polite for new AI messages and new clarifying card groups.",
      "Keyboard: chips navigable with arrow keys; Enter selects; Esc closes dialogs/popovers."
    ]
  },

  "data_testid_convention": {
    "rule": "All interactive and key informational elements MUST include data-testid in kebab-case describing role.",
    "examples": [
      "data-testid=\"landing-describe-input\"",
      "data-testid=\"landing-event-type-chip-shaadi\"",
      "data-testid=\"planner-continue-button\"",
      "data-testid=\"clarifying-card-budget-slider\"",
      "data-testid=\"event-share-whatsapp-button\"",
      "data-testid=\"event-rsvp-going-button\"",
      "data-testid=\"event-budget-total\""
    ]
  },

  "images": {
    "image_urls": [
      {
        "category": "event_page_demo_hero",
        "description": "Seeded demo wedding hero background (use as subtle blurred header image behind title; keep opacity low)",
        "url": "https://images.unsplash.com/photo-1640744537094-0d5b8da84b01?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjB3ZWRkaW5nJTIwZGVjb3IlMjBtb2Rlcm58ZW58MHx8fHJlZHwxNzgzMDI2NzI5fDA&ixlib=rb-4.1.0&q=85"
      },
      {
        "category": "texture_saffron",
        "description": "Saffron fabric texture for decorative overlay blocks (very subtle, 6–10% opacity)",
        "url": "https://images.unsplash.com/photo-1639654764155-d1fc1fbb6e0d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA0MTJ8MHwxfHNlYXJjaHwzfHxzYWZmcm9uJTIwZmFicmljJTIwdGV4dHVyZXxlbnwwfHx8b3JhbmdlfDE3ODMwMjY3NDR8MA&ixlib=rb-4.1.0&q=85"
      },
      {
        "category": "landing_flatlay",
        "description": "Minimal flatlay for landing secondary visual (optional; keep small, not dominant)",
        "url": "https://images.unsplash.com/photo-1617611313649-fbddfaa37b52?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzN8MHwxfHNlYXJjaHwxfHxtaW5pbWFsJTIwaW5kaWFuJTIwd2VkZGluZyUyMGludml0YXRpb24lMjBmbGF0bGF5fGVufDB8fHx3aGl0ZXwxNzgzMDI2NzQ5fDA&ixlib=rb-4.1.0&q=85"
      }
    ]
  },

  "libraries_and_integrations": {
    "framer_motion": {
      "why": "Signature staggered clarifying cards + event page assembly animation",
      "install": "npm i framer-motion",
      "usage_notes": [
        "Use motion.div wrappers around Card/Badge/Buttons",
        "Use AnimatePresence for card groups and summary collapse",
        "Respect prefers-reduced-motion"
      ]
    },
    "recharts": {
      "why": "Budget estimator mini chart (optional): donut for category split",
      "install": "npm i recharts",
      "usage_notes": [
        "Keep charts minimal; use solid fills (no gradients)",
        "Provide empty state when no items"
      ]
    },
    "indian_number_format": {
      "why": "₹ formatting in lakhs/crores",
      "implementation": "Use Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })"
    }
  },

  "page_level_ui_specs": {
    "landing": {
      "hero": {
        "background": "warm off-white + subtle radial accents + noise overlay",
        "headline": "Bodoni Moda H1; keep line length ~18–22 chars",
        "input": "Textarea-like single field with big padding; send button attached",
        "chips": "Horizontal scroll row; selected chip becomes maroon"
      },
      "seeded_demo_card": {
        "content": "‘Riya × Arjun — Shaadi’ with date, city, muhurat chip, and a ‘View demo’ button",
        "motion": "Card floats in on load (y: 8 -> 0)"
      }
    },
    "planner": {
      "chat": {
        "ai_bubble": "bg-white border border-border shadow-sm",
        "user_bubble": "bg-[hsl(var(--secondary))] border border-border",
        "timestamp": "text-xs text-muted-foreground"
      },
      "clarifying_cards": {
        "layout": "grid grid-cols-1 gap-3",
        "widgets": {
          "chips_single": "ToggleGroup single; pill style",
          "chips_multi": "ToggleGroup multiple; selected uses accent marigold",
          "slider": "shadcn Slider + value label chip",
          "date_picker": "shadcn Calendar inside Popover; trigger is a pill button",
          "time_picker": "Use Select for hour/min + AM/PM (no native select); or build a simple grid of time chips",
          "toggle": "shadcn Switch with label"
        }
      },
      "continue_bar": {
        "sticky": "sticky bottom-0 bg-[hsl(var(--background))] border-t border-border",
        "button": "Primary CTA; disabled until required answers present"
      }
    },
    "event_page": {
      "hero": {
        "structure": "Title + date + muhurat + location; optional blurred image behind",
        "cta": "Sticky share bar is primary conversion"
      },
      "modules": {
        "timeline": "Vertical list with time chips; muhurat highlighted with gold border",
        "vendors": "Tabs by category; vendor cards with shortlist toggle",
        "rsvp": "Three pill buttons (Going/Maybe/Can't) + live counts; name input",
        "budget": "Itemized rows + total; optional donut chart",
        "food": "Diet toggles + menu suggestion chips",
        "checklist": "Checkbox list + progress bar",
        "reminders": "List + add reminder dialog"
      },
      "sticky_share_bar": {
        "mobile": "fixed bottom-0 left-0 right-0 px-4 py-3",
        "desktop": "becomes a right-side floating card or stays bottom with max-w",
        "buttons": [
          "WhatsApp (primary)",
          "Directions (secondary)",
          "Add to Calendar (secondary)",
          "Copy link (ghost)"
        ]
      }
    }
  },

  "instructions_to_main_agent": [
    "Remove CRA default App.css centering/header styles; do not center the whole app container.",
    "Update /app/frontend/src/index.css :root tokens to Utsav palette; keep shadcn structure.",
    "Implement Google Fonts import for Bodoni Moda + Figtree in index.html or CSS.",
    "Build dynamic JSON renderer for clarifying cards using shadcn components only (ToggleGroup, Slider, Calendar+Popover, Switch, Tabs, Input/Textarea).",
    "Every interactive element must include data-testid (kebab-case).",
    "Use Framer Motion for staggered card entrance and event page assembly; respect prefers-reduced-motion.",
    "Ensure Indian currency formatting everywhere (₹, lakhs/crores).",
    "Keep gradients minimal and only in hero/section backgrounds (<=20% viewport)."
  ]
}


<General UI UX Design Guidelines>  
    - You must **not** apply universal transition. Eg: `transition: all`. This results in breaking transforms. Always add transitions for specific interactive elements like button, input excluding transforms
    - You must **not** center align the app container, ie do not add `.App { text-align: center; }` in the css file. This disrupts the human natural reading flow of text
   - NEVER: use AI assistant Emoji characters like`🤖🧠💭💡🔮🎯📚🎭🎬🎪🎉🎊🎁🎀🎂🍰🎈🎨🎰💰💵💳🏦💎🪙💸🤑📊📈📉💹🔢🏆🥇 etc for icons. Always use **FontAwesome cdn** or **lucid-react** library already installed in the package.json

 **GRADIENT RESTRICTION RULE**
NEVER use dark/saturated gradient combos (e.g., purple/pink) on any UI element.  Prohibited gradients: blue-500 to purple 600, purple 500 to pink-500, green-500 to blue-500, red to pink etc
NEVER use dark gradients for logo, testimonial, footer etc
NEVER let gradients cover more than 20% of the viewport.
NEVER apply gradients to text-heavy content or reading areas.
NEVER use gradients on small UI elements (<100px width).
NEVER stack multiple gradient layers in the same viewport.

**ENFORCEMENT RULE:**
    • Id gradient area exceeds 20% of viewport OR affects readability, **THEN** use solid colors

**How and where to use:**
   • Section backgrounds (not content backgrounds)
   • Hero section header content. Eg: dark to light to dark color
   • Decorative overlays and accent elements only
   • Hero section with 2-3 mild color
   • Gradients creation can be done for any angle say horizontal, vertical or diagonal

- For AI chat, voice application, **do not use purple color. Use color like light green, ocean blue, peach orange etc**

</Font Guidelines>

- Every interaction needs micro-animations - hover states, transitions, parallax effects, and entrance animations. Static = dead. 
   
- Use 2-3x more spacing than feels comfortable. Cramped designs look cheap.

- Subtle grain textures, noise overlays, custom cursors, selection states, and loading animations: separates good from extraordinary.
   
- Before generating UI, infer the visual style from the problem statement (palette, contrast, mood, motion) and immediately instantiate it by setting global design tokens (primary, secondary/accent, background, foreground, ring, state colors), rather than relying on any library defaults. Don't make the background dark as a default step, always understand problem first and define colors accordingly
    Eg: - if it implies playful/energetic, choose a colorful scheme
           - if it implies monochrome/minimal, choose a black–white/neutral scheme

**Component Reuse:**
	- Prioritize using pre-existing components from src/components/ui when applicable
	- Create new components that match the style and conventions of existing components when needed
	- Examine existing components to understand the project's component patterns before creating new ones

**IMPORTANT**: Do not use HTML based component like dropdown, calendar, toast etc. You **MUST** always use `/app/frontend/src/components/ui/ ` only as a primary components as these are modern and stylish component

**Best Practices:**
	- Use Shadcn/UI as the primary component library for consistency and accessibility
	- Import path: ./components/[component-name]

**Export Conventions:**
	- Components MUST use named exports (export const ComponentName = ...)
	- Pages MUST use default exports (export default function PageName() {...})

**Toasts:**
  - Use `sonner` for toasts"
  - Sonner component are located in `/app/src/components/ui/sonner.tsx`

Use 2–4 color gradients, subtle textures/noise overlays, or CSS-based noise to avoid flat visuals.
</General UI UX Design Guidelines>
