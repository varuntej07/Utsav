"""Utsav Backend API Test Suite — comprehensive endpoint testing with AI timeouts"""
import requests
import sys
import time
from datetime import datetime

class UtsavAPITester:
    def __init__(self, base_url="https://clever-panini-6.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.session_id = f"test-{int(time.time())}"
        self.event_slug = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, timeout=30):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n{'='*60}")
        print(f"🔍 Test {self.tests_run}: {name}")
        print(f"{'='*60}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=timeout)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers, timeout=timeout)

            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                print(f"✅ PASSED - Status: {response.status_code}")
                try:
                    resp_json = response.json()
                    print(f"📦 Response preview: {str(resp_json)[:200]}...")
                    return True, resp_json
                except:
                    return True, {}
            else:
                print(f"❌ FAILED - Expected {expected_status}, got {response.status_code}")
                print(f"Response: {response.text[:300]}")
                self.failed_tests.append({
                    "test": name,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "endpoint": endpoint
                })
                return False, {}

        except requests.Timeout:
            print(f"❌ FAILED - Request timeout after {timeout}s")
            self.failed_tests.append({"test": name, "error": "timeout", "endpoint": endpoint})
            return False, {}
        except Exception as e:
            print(f"❌ FAILED - Error: {str(e)}")
            self.failed_tests.append({"test": name, "error": str(e), "endpoint": endpoint})
            return False, {}

    def test_demo_event(self):
        """Test GET /api/demo - should return seeded demo wedding"""
        success, data = self.run_test(
            "GET /api/demo - Seeded demo wedding",
            "GET",
            "demo",
            200
        )
        if success:
            assert 'plan' in data, "Demo event missing 'plan'"
            assert 'posterUrl' in data, "Demo event missing 'posterUrl'"
            assert 'rsvpSummary' in data, "Demo event missing 'rsvpSummary'"
            assert data.get('slug') == 'simran-weds-arjun', f"Demo slug should be 'simran-weds-arjun', got {data.get('slug')}"
            print(f"✓ Demo event title: {data['plan'].get('title')}")
            print(f"✓ Demo RSVP summary: {data['rsvpSummary']}")
        return success

    def test_chat_first_turn(self):
        """Test POST /api/chat - first turn with event description"""
        print("\n⏳ This test calls Gemini AI - may take 10-60 seconds...")
        success, data = self.run_test(
            "POST /api/chat - First turn (clarifying phase)",
            "POST",
            "chat",
            200,
            data={
                "sessionId": self.session_id,
                "message": "Planning a naamkaran ceremony for my baby in Mumbai"
            },
            timeout=90
        )
        if success:
            assert data.get('phase') == 'clarifying', f"Expected phase='clarifying', got {data.get('phase')}"
            assert 'eventType' in data, "Missing eventType"
            assert 'clarifyingCards' in data, "Missing clarifyingCards"
            cards = data.get('clarifyingCards', [])
            assert 3 <= len(cards) <= 5, f"Expected 3-5 clarifying cards, got {len(cards)}"
            print(f"✓ Phase: {data.get('phase')}")
            print(f"✓ Event type: {data.get('eventType')}")
            print(f"✓ Clarifying cards count: {len(cards)}")
            for i, card in enumerate(cards[:3]):
                print(f"  Card {i+1}: {card.get('question')} (type: {card.get('inputType')})")
            return cards
        return None

    def test_chat_second_turn(self, cards):
        """Test POST /api/chat - second turn with tapped answers"""
        if not cards:
            print("⚠️  Skipping second turn - no cards from first turn")
            return False
        
        # Build tapped answers from cards
        tapped_answers = {}
        for card in cards:
            card_id = card.get('id')
            input_type = card.get('inputType')
            options = card.get('options', [])
            
            if input_type == 'date':
                tapped_answers[card_id] = "2026-08-15"
            elif input_type == 'chips' and options:
                tapped_answers[card_id] = options[0].get('value')
            elif input_type == 'multiselect' and options:
                tapped_answers[card_id] = [options[0].get('value')]
            elif input_type == 'toggle' and options:
                tapped_answers[card_id] = options[0].get('value')
            elif input_type == 'slider':
                tapped_answers[card_id] = "50"
            elif input_type == 'budget':
                if options:
                    tapped_answers[card_id] = options[0].get('value')
                else:
                    tapped_answers[card_id] = "100000"
        
        print("\n⏳ Second AI turn - may take 10-90 seconds (max 2 rounds enforced)...")
        success, data = self.run_test(
            "POST /api/chat - Second turn with tapped answers",
            "POST",
            "chat",
            200,
            data={
                "sessionId": self.session_id,
                "tappedAnswers": tapped_answers
            },
            timeout=120
        )
        
        if success:
            phase = data.get('phase')
            print(f"✓ Phase: {phase}")
            
            if phase == 'complete':
                assert 'eventPlan' in data, "Missing eventPlan in complete phase"
                assert 'eventSlug' in data, "Missing eventSlug in complete phase"
                self.event_slug = data.get('eventSlug')
                plan = data.get('eventPlan', {})
                print(f"✓ Event created with slug: {self.event_slug}")
                print(f"✓ Event title: {plan.get('title')}")
                print(f"✓ Modules: {plan.get('modules')}")
                return True
            elif phase == 'clarifying':
                # Another round of clarifying - answer again
                print("⚠️  Another clarifying round - answering to force completion...")
                new_cards = data.get('clarifyingCards', [])
                new_answers = {}
                for card in new_cards:
                    card_id = card.get('id')
                    options = card.get('options', [])
                    if options:
                        new_answers[card_id] = options[0].get('value')
                
                # Third turn (should force complete)
                success3, data3 = self.run_test(
                    "POST /api/chat - Third turn (force complete)",
                    "POST",
                    "chat",
                    200,
                    data={
                        "sessionId": self.session_id,
                        "tappedAnswers": new_answers
                    },
                    timeout=120
                )
                
                if success3 and data3.get('phase') == 'complete':
                    self.event_slug = data3.get('eventSlug')
                    print(f"✓ Event created with slug: {self.event_slug}")
                    return True
        
        return success

    def test_get_event(self):
        """Test GET /api/events/{slug}"""
        if not self.event_slug:
            print("⚠️  Using demo event slug for testing")
            self.event_slug = "simran-weds-arjun"
        
        success, data = self.run_test(
            f"GET /api/events/{self.event_slug}",
            "GET",
            f"events/{self.event_slug}",
            200
        )
        if success:
            assert 'plan' in data, "Event missing 'plan'"
            assert 'rsvpSummary' in data, "Event missing 'rsvpSummary'"
            print(f"✓ Event title: {data['plan'].get('title')}")
        return success

    def test_get_nonexistent_event(self):
        """Test GET /api/events/nonexistent-slug - should return 404"""
        success, _ = self.run_test(
            "GET /api/events/nonexistent-slug - 404 test",
            "GET",
            "events/nonexistent-slug-12345",
            404
        )
        return success

    def test_rsvp_flow(self):
        """Test RSVP creation and listing"""
        slug = self.event_slug or "simran-weds-arjun"
        
        # Create RSVP
        success1, data1 = self.run_test(
            f"POST /api/events/{slug}/rsvp",
            "POST",
            f"events/{slug}/rsvp",
            200,
            data={
                "name": "Test Guest",
                "status": "going",
                "headcount": 2
            }
        )
        
        if success1:
            assert 'rsvp' in data1, "Missing 'rsvp' in response"
            assert 'summary' in data1, "Missing 'summary' in response"
            summary = data1.get('summary', {})
            print(f"✓ RSVP created: {data1['rsvp'].get('name')}")
            print(f"✓ Updated summary: going={summary.get('going')}, goingHeadcount={summary.get('goingHeadcount')}")
        
        # List RSVPs
        success2, data2 = self.run_test(
            f"GET /api/events/{slug}/rsvps",
            "GET",
            f"events/{slug}/rsvps",
            200
        )
        
        if success2:
            assert 'rsvps' in data2, "Missing 'rsvps' in response"
            assert 'summary' in data2, "Missing 'summary' in response"
            print(f"✓ Total RSVPs: {len(data2.get('rsvps', []))}")
        
        return success1 and success2

    def test_vendors_flow(self):
        """Test vendor search and shortlisting"""
        slug = self.event_slug or "simran-weds-arjun"
        
        # Get vendors (default category)
        success1, data1 = self.run_test(
            f"GET /api/events/{slug}/vendors",
            "GET",
            f"events/{slug}/vendors",
            200,
            timeout=15
        )
        
        if success1:
            assert 'vendors' in data1, "Missing 'vendors' in response"
            assert 'categories' in data1, "Missing 'categories' in response"
            vendors = data1.get('vendors', [])
            print(f"✓ Vendors found: {len(vendors)}")
            print(f"✓ Categories: {[c['key'] for c in data1.get('categories', [])]}")
            if vendors:
                print(f"✓ First vendor: {vendors[0].get('name')} (source: {vendors[0].get('source')})")
        
        # Get vendors with specific category
        success2, data2 = self.run_test(
            f"GET /api/events/{slug}/vendors?category=caterer",
            "GET",
            f"events/{slug}/vendors?category=caterer",
            200,
            timeout=15
        )
        
        if success2:
            print(f"✓ Caterer vendors: {len(data2.get('vendors', []))}")
        
        # Shortlist a vendor
        if success1 and data1.get('vendors'):
            vendor = data1['vendors'][0]
            success3, data3 = self.run_test(
                f"POST /api/events/{slug}/vendors/shortlist",
                "POST",
                f"events/{slug}/vendors/shortlist",
                200,
                data={
                    "vendor": vendor,
                    "shortlisted": True
                }
            )
            
            if success3:
                assert 'shortlistedVendors' in data3, "Missing 'shortlistedVendors' in response"
                print(f"✓ Shortlisted vendors: {len(data3.get('shortlistedVendors', []))}")
            
            return success1 and success2 and success3
        
        return success1 and success2

    def test_checklist_patch(self):
        """Test PATCH /api/events/{slug}/checklist"""
        slug = self.event_slug or "simran-weds-arjun"
        
        success, data = self.run_test(
            f"PATCH /api/events/{slug}/checklist",
            "PATCH",
            f"events/{slug}/checklist",
            200,
            data={"index": 0, "done": True}
        )
        
        if success:
            assert 'checklist' in data, "Missing 'checklist' in response"
            print(f"✓ Checklist updated: {len(data.get('checklist', []))} items")
        
        return success

    def test_budget_patch(self):
        """Test PATCH /api/events/{slug}/budget"""
        slug = self.event_slug or "simran-weds-arjun"
        
        success, data = self.run_test(
            f"PATCH /api/events/{slug}/budget",
            "PATCH",
            f"events/{slug}/budget",
            200,
            data={"index": 0, "amountINR": 1250000}
        )
        
        if success:
            assert 'budgetItems' in data, "Missing 'budgetItems' in response"
            assert 'budgetINR' in data, "Missing 'budgetINR' in response"
            print(f"✓ Budget updated: Total ₹{data.get('budgetINR')}")
        
        return success

    def test_food_patch(self):
        """Test PATCH /api/events/{slug}/food"""
        slug = self.event_slug or "simran-weds-arjun"
        
        success, data = self.run_test(
            f"PATCH /api/events/{slug}/food",
            "PATCH",
            f"events/{slug}/food",
            200,
            data={"dietType": "Jain"}
        )
        
        if success:
            assert 'dietType' in data, "Missing 'dietType' in response"
            print(f"✓ Food diet type updated: {data.get('dietType')}")
        
        return success

    def test_reminders_flow(self):
        """Test reminders creation and patching"""
        slug = self.event_slug or "simran-weds-arjun"
        
        # Create reminder
        success1, data1 = self.run_test(
            f"POST /api/events/{slug}/reminders",
            "POST",
            f"events/{slug}/reminders",
            200,
            data={"text": "Test reminder from automated test"}
        )
        
        if success1:
            assert 'reminders' in data1, "Missing 'reminders' in response"
            reminders = data1.get('reminders', [])
            print(f"✓ Reminder created: {len(reminders)} total reminders")
            
            # Patch reminder
            if reminders:
                success2, data2 = self.run_test(
                    f"PATCH /api/events/{slug}/reminders",
                    "PATCH",
                    f"events/{slug}/reminders",
                    200,
                    data={"index": len(reminders) - 1, "done": True}
                )
                
                if success2:
                    print(f"✓ Reminder marked as done")
                
                return success1 and success2
        
        return success1

    def test_poster_get(self):
        """Test GET /api/posters/{filename} - demo poster"""
        success, _ = self.run_test(
            "GET /api/posters/simran-weds-arjun.png",
            "GET",
            "posters/simran-weds-arjun.png",
            200,
            timeout=10
        )
        
        if success:
            print("✓ Poster image served successfully (>100KB expected)")
        
        return success

    def run_all_tests(self):
        """Run all backend tests in sequence"""
        print("\n" + "="*60)
        print("🎉 UTSAV BACKEND API TEST SUITE")
        print("="*60)
        print(f"Base URL: {self.base_url}")
        print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("="*60)
        
        # Test sequence
        print("\n\n📋 PHASE 1: DEMO EVENT & BASIC ENDPOINTS")
        self.test_demo_event()
        self.test_get_nonexistent_event()
        
        print("\n\n📋 PHASE 2: AI CHAT FLOW (GEMINI)")
        cards = self.test_chat_first_turn()
        if cards:
            self.test_chat_second_turn(cards)
        
        print("\n\n📋 PHASE 3: EVENT OPERATIONS")
        self.test_get_event()
        self.test_rsvp_flow()
        self.test_vendors_flow()
        
        print("\n\n📋 PHASE 4: EVENT MODIFICATIONS")
        self.test_checklist_patch()
        self.test_budget_patch()
        self.test_food_patch()
        self.test_reminders_flow()
        
        print("\n\n📋 PHASE 5: POSTER SERVING")
        self.test_poster_get()
        
        # Summary
        print("\n\n" + "="*60)
        print("📊 TEST SUMMARY")
        print("="*60)
        print(f"Total tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Tests failed: {self.tests_run - self.tests_passed}")
        print(f"Success rate: {(self.tests_passed / self.tests_run * 100):.1f}%")
        
        if self.failed_tests:
            print("\n❌ FAILED TESTS:")
            for i, fail in enumerate(self.failed_tests, 1):
                print(f"  {i}. {fail.get('test')}")
                print(f"     Endpoint: {fail.get('endpoint')}")
                if 'expected' in fail:
                    print(f"     Expected: {fail['expected']}, Got: {fail['actual']}")
                if 'error' in fail:
                    print(f"     Error: {fail['error']}")
        
        print("\n" + "="*60)
        print(f"Completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("="*60)
        
        return 0 if self.tests_passed == self.tests_run else 1


def main():
    tester = UtsavAPITester()
    return tester.run_all_tests()


if __name__ == "__main__":
    sys.exit(main())
