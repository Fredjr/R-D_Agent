# 🚀 QUICK START GUIDE - E2E TESTING

**Get started with automated testing in 5 minutes!**

---

## ⚡ FASTEST WAY TO RUN TESTS

```bash
# 1. Navigate to test directory
cd tests/e2e

# 2. Install dependencies (first time only)
npm install && npx playwright install

# 3. Run all tests
./run-tests.sh
```

That's it! Tests will run and show results.

---

## 📋 WHAT GETS TESTED

✅ **Backend APIs** - All 18 endpoints  
✅ **Smart Inbox** - Paper triage, actions, keyboard shortcuts  
✅ **Decision Timeline** - Create, edit, display decisions  
✅ **Project Alerts** - Bell icon, panel, filters, dismiss  
✅ **Integration** - Cross-feature data flow  
✅ **Error Handling** - Network errors, empty states  
✅ **Performance** - Load times, API speed, UI responsiveness  

**Total: 37 tests across 8 test suites**

---

## 🎯 COMMON COMMANDS

```bash
# Run all tests
./run-tests.sh

# Run with browser visible (see what's happening)
./run-tests.sh --headed

# Run specific feature tests
./run-tests.sh --inbox        # Smart Inbox only
./run-tests.sh --decisions    # Decision Timeline only
./run-tests.sh --alerts       # Project Alerts only

# Debug mode (step through tests)
./run-tests.sh --debug

# Interactive UI mode
./run-tests.sh --ui

# View test report after running
npm run report
```

---

## 🔧 CONFIGURATION (OPTIONAL)

Create `.env` file for custom settings:

```bash
cp .env.example .env
```

Edit `.env`:
```bash
TEST_URL=https://r-d-agent.vercel.app
BACKEND_URL=https://r-dagent-production.up.railway.app
TEST_PROJECT_ID=your-project-id
```

---

## 📊 UNDERSTANDING RESULTS

### **✅ All Tests Pass**
```
✅ ALL TESTS PASSED
Duration: 45 seconds

📊 View detailed report:
  npm run report
```

### **❌ Some Tests Fail**
```
❌ SOME TESTS FAILED
Duration: 52 seconds

🔍 Debugging options:
  1. View HTML report: npm run report
  2. Run in debug mode: ./run-tests.sh --debug
  3. Run with browser visible: ./run-tests.sh --headed
```

---

## 🐛 DEBUGGING TIPS

### **See what's happening**
```bash
./run-tests.sh --headed
```
Browser opens and you can watch tests run.

### **Step through tests**
```bash
./run-tests.sh --debug
```
Playwright Inspector opens - step through each action.

### **View detailed report**
```bash
npm run report
```
Opens HTML report with screenshots, videos, logs.

---

## 📝 TEST OUTPUT EXAMPLE

```
🧪 COMPREHENSIVE E2E TEST SUITE - WEEKS 12-14

Testing: Smart Inbox, Decision Timeline, Project Alerts
Total Tests: 37 across 8 test suites

✓ Testing backend health endpoint: {"status": "healthy"}
✓ Endpoint /api/triage/project/test-project-001: Status: 200
✓ Endpoint /api/decisions/project/test-project-001: Status: 200
✓ Endpoint /api/alerts/project/test-project-001: Status: 200
✓ Clicked Papers tab
✓ Clicked Inbox sub-tab
✓ Inbox loaded: Papers displayed
✓ Paper card elements: Score: true, Impact: true, Reasoning: true
✓ Clicked Maybe button - action executed
✓ Pressed J key (next paper)
✓ Keyboard shortcuts tested
✓ Clicked Research tab
✓ Clicked Decisions sub-tab
✓ Decision Timeline loaded
✓ Clicked Add Decision button
✓ Decision modal opened
✓ Bell icon present
✓ Clicked bell icon
✓ Alerts panel opened
✓ Alert statistics displayed
✓ Alert card elements: Title: true, Description: true

✅ ALL TESTS PASSED
Duration: 45 seconds
```

---

## 🆘 TROUBLESHOOTING

### **"Command not found: playwright"**
```bash
npm install
npx playwright install
```

### **"Tests timeout"**
Increase timeout in `playwright.config.js`:
```javascript
timeout: 120 * 1000, // 2 minutes
```

### **"Element not found"**
Run in headed mode to see what's happening:
```bash
./run-tests.sh --headed
```

### **"Authentication required"**
Set credentials in `.env`:
```bash
TEST_USER_EMAIL=your-email@example.com
TEST_USER_PASSWORD=your-password
```

---

## 📚 MORE INFORMATION

- **Full Documentation**: See `README.md`
- **Test Details**: See `WEEKS_12-14_E2E_TEST_SUITE.md`
- **Playwright Docs**: https://playwright.dev

---

## ✅ NEXT STEPS

1. ✅ Run tests: `./run-tests.sh`
2. ✅ Review results
3. ✅ Fix any bugs found
4. ✅ Run tests regularly during development
5. ✅ Integrate into CI/CD pipeline

---

**Happy Testing! 🧪**

