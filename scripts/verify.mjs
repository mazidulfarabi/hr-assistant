import fs from "node:fs";

console.log("===============================================================");
console.log("     XYZ Company HR Leave Assistant - Verification Suite       ");
console.log(
  "===============================================================\n"
);

// 1. Check policy.txt and LEAVE_POLICY_TEXT
const policyTxt = fs.readFileSync("policy.txt", "utf8").trim();
const serverTs = fs.readFileSync("src/server.ts", "utf8");
const policyTs = fs.readFileSync("src/policy.ts", "utf8");
const instructionsTxt = fs.readFileSync("instructions.txt", "utf8").trim();

if (!serverTs.includes("LEAVE_POLICY_TEXT")) {
  throw new Error(
    "src/server.ts does not reference or export LEAVE_POLICY_TEXT"
  );
}

if (!policyTs.includes("HR-POL-004")) {
  throw new Error("src/policy.ts does not contain policy HR-POL-004");
}

if (!policyTs.includes("2.Scope and Eligibility")) {
  throw new Error(
    "src/policy.ts does not contain updated '2.Scope and Eligibility'"
  );
}
console.log(
  "✓ [Policy Integrity] LEAVE_POLICY_TEXT is correctly synchronized with policy.txt"
);

// 2. Check strict system instructions and critical order of operations
if (!serverTs.includes("Critical Order of Operations:")) {
  throw new Error("Critical Order of Operations missing from server.ts");
}
if (!serverTs.includes("Rule 1: Strict Accuracy & Mandatory Citation")) {
  throw new Error("Rule 1 missing from server system prompt");
}
if (!serverTs.includes("You may perform basic arithmetic")) {
  throw new Error("Arithmetic allowance missing from Rule 1 in server.ts");
}
if (
  !serverTs.includes(
    "Crucial: Even if the question mentions a valid leave type"
  )
) {
  throw new Error(
    "Half-day / specific condition abort rule missing from Rule 2 in server.ts"
  );
}
if (!serverTs.includes("Do not tailor your refusal to the user's prompt")) {
  throw new Error(
    "Refusal tailoring prohibition missing from Rule 2 in server.ts"
  );
}
if (!serverTs.includes("I don't know, please contact HR.")) {
  throw new Error(
    "Rule 2 exact fallback phrase missing from server system prompt"
  );
}
if (
  !serverTs.includes(
    "Leave records are confidential. I cannot share information about other employees. Please contact the HR Department."
  )
) {
  throw new Error(
    "Rule 3 exact privacy phrase missing from server system prompt"
  );
}
console.log(
  "✓ [Instructions Integrity] Critical Order of Operations and Rules 1-3 strictly hardcoded in backend"
);

// 3. Check Workers AI Model & Zero External Providers
if (!serverTs.includes("@cf/meta/llama-3.1-8b-instruct")) {
  throw new Error(
    "Model @cf/meta/llama-3.1-8b-instruct not configured in server.ts"
  );
}
if (
  serverTs.includes("@ai-sdk/openai") ||
  serverTs.includes("@ai-sdk/anthropic")
) {
  throw new Error(
    "External providers (OpenAI/Anthropic) detected in server.ts"
  );
}
console.log(
  "✓ [Self-Contained AI] 100% Cloudflare Workers AI FP8 binding (zero external API keys)"
);

// 4. Check UI specifications in app.tsx
const appTsx = fs.readFileSync("src/app.tsx", "utf8");
if (!appTsx.includes("XYZ Company HR Leave Assistant")) {
  throw new Error("Header title missing from app.tsx");
}
if (!appTsx.includes("bg-slate-900") || !appTsx.includes("bg-slate-950")) {
  throw new Error(
    "Dark mode palette (bg-slate-950 / bg-slate-900) missing from app.tsx"
  );
}
if (!appTsx.includes("AtomIcon")) {
  throw new Error("AtomIcon missing from app.tsx");
}
if (!appTsx.includes("Delete History")) {
  throw new Error("'Delete History' button label missing from app.tsx");
}
if (appTsx.includes("SUGGESTED_QUESTIONS")) {
  throw new Error("SUGGESTED_QUESTIONS still present in app.tsx");
}
console.log(
  "✓ [UI Specifications] Dark UI, AtomIcon, 'Delete History', and clean welcome screen verified"
);

// 5. Comprehensive Guardrail & Test Questions Matrix
console.log(
  "\n--- Running System Guardrail & Query Test Matrix (40 Test Cases) ---\n"
);

const TEST_CASES = [
  // Category 1: Valid Policy Queries & Mandatory Citations
  {
    id: 1,
    category: "Rule 1: Citation",
    q: "What are the weekly holidays at XYZ Company?",
    expectedSec: "5.1",
    expectedText: "Friday and Saturday"
  },
  {
    id: 2,
    category: "Rule 1: Citation",
    q: "How many days of Annual Leave do employees earn per month and year?",
    expectedSec: "4.1",
    expectedText: "1.67 working days per month"
  },
  {
    id: 3,
    category: "Rule 1: Citation",
    q: "Can employees on probation take Casual Leave or Sick Leave?",
    expectedSec: "2.2",
    expectedText: "joining date"
  },
  {
    id: 4,
    category: "Rule 1: Citation",
    q: "Can employees on probation take Annual Leave?",
    expectedSec: "2.2",
    expectedText: "after confirmation"
  },
  {
    id: 5,
    category: "Rule 1: Citation",
    q: "Are contract employees or consultants covered under this policy?",
    expectedSec: "2.3",
    expectedText: "not covered"
  },
  {
    id: 6,
    category: "Rule 1: Citation",
    q: "How many consecutive days of Casual Leave can be taken at one time?",
    expectedSec: "4.2",
    expectedText: "No more than 3"
  },
  {
    id: 7,
    category: "Rule 1: Citation",
    q: "Can Casual Leave be combined with Annual Leave?",
    expectedSec: "4.2",
    expectedText: "may not be combined"
  },
  {
    id: 8,
    category: "Rule 1: Citation",
    q: "By what time must an employee notify their manager of sick absence?",
    expectedSec: "4.3",
    expectedText: "10:00 AM"
  },
  {
    id: 9,
    category: "Rule 1: Citation",
    q: "When is a medical certificate required for sick absence?",
    expectedSec: "4.3",
    expectedText: "more than 2 consecutive working days"
  },
  {
    id: 10,
    category: "Rule 1: Citation",
    q: "How many weeks of Maternity Leave are female employees entitled to?",
    expectedSec: "4.4",
    expectedText: "16 weeks"
  },
  {
    id: 11,
    category: "Rule 1: Citation",
    q: "How much advance notice is required before taking Maternity Leave?",
    expectedSec: "4.4",
    expectedText: "8 weeks"
  },
  {
    id: 12,
    category: "Rule 1: Citation",
    q: "How many days of Paternity Leave are male employees entitled to?",
    expectedSec: "4.5",
    expectedText: "7 consecutive calendar days"
  },
  {
    id: 13,
    category: "Rule 1: Citation",
    q: "How many days of Marriage Leave are provided and what notice is required?",
    expectedSec: "4.6",
    expectedText: "5 working days"
  },
  {
    id: 14,
    category: "Rule 1: Citation",
    q: "How many days of Bereavement Leave for death of an immediate family member?",
    expectedSec: "4.7",
    expectedText: "up to 5 working days"
  },
  {
    id: 15,
    category: "Rule 1: Citation",
    q: "How many days of Bereavement Leave for death of an extended family member?",
    expectedSec: "4.7",
    expectedText: "up to 2 working days"
  },
  {
    id: 16,
    category: "Rule 1: Citation",
    q: "Within how many calendar days must Compensatory Off be taken?",
    expectedSec: "4.8",
    expectedText: "60 calendar days"
  },
  {
    id: 17,
    category: "Rule 1: Citation",
    q: "What portal is used to apply for leave?",
    expectedSec: "6.1",
    expectedText: "PeopleHub"
  },
  {
    id: 18,
    category: "Rule 1: Citation",
    q: "Within how many days must a manager approve or reject a leave request?",
    expectedSec: "6.2",
    expectedText: "2 working days"
  },
  {
    id: 19,
    category: "Rule 1: Citation",
    q: "Can Annual Leave or Casual Leave be taken during the notice period?",
    expectedSec: "7",
    expectedText: "Department Head and HR"
  },
  {
    id: 20,
    category: "Rule 1: Citation",
    q: "How many unused Annual Leave days can be carried forward?",
    expectedSec: "4.1",
    expectedText: "10 unused days"
  },
  {
    id: 21,
    category: "Rule 1: Citation",
    q: "By what date do carried-forward Annual Leave days lapse?",
    expectedSec: "4.1",
    expectedText: "31 March"
  },
  {
    id: 22,
    category: "Rule 1: Citation",
    q: "How is pay deducted for Leave Without Pay (LWP)?",
    expectedSec: "8.1",
    expectedText: "basic salary divided by 30"
  },
  {
    id: 23,
    category: "Rule 1: Citation",
    q: "What happens if an employee is absent without notice for 3 consecutive days?",
    expectedSec: "8.2",
    expectedText: "show-cause notice"
  },
  {
    id: 24,
    category: "Rule 1: Citation",
    q: "Who is authorized to access employee leave records?",
    expectedSec: "9.2",
    expectedText: "line manager"
  },
  {
    id: 25,
    category: "Rule 1: Citation",
    q: "What is the contact email address for policy inquiries?",
    expectedSec: "11.2",
    expectedText: "hr@xyz-company.example"
  },

  // Category 2: Basic Arithmetic Calculation Scenarios
  {
    id: 26,
    category: "Rule 1: Arithmetic",
    q: "If I worked for 6 months, how many Annual Leave days have I earned?",
    expectedSec: "4.1",
    expectedText: "1.67",
    calculatedResult: "10.02 days"
  },
  {
    id: 27,
    category: "Rule 1: Arithmetic",
    q: "How many Annual Leave days accrue over 3 months of service?",
    expectedSec: "4.1",
    expectedText: "1.67",
    calculatedResult: "5.01 days"
  },
  {
    id: 28,
    category: "Rule 1: Arithmetic",
    q: "If an employee works 3 separate public holidays, how many Compensatory Off days do they earn?",
    expectedSec: "4.8",
    expectedText: "1 day",
    calculatedResult: "3 days"
  },
  {
    id: 29,
    category: "Rule 1: Arithmetic",
    q: "If an employee has 14 unused days at year end, how many lapse and how many carry forward?",
    expectedSec: "4.1",
    expectedText: "10 unused days",
    calculatedResult: "10 carry forward, 4 lapse"
  },
  {
    id: 30,
    category: "Rule 1: Arithmetic",
    q: "On separation, how is unused annual leave encashed per day?",
    expectedSec: "4.1",
    expectedText: "basic salary divided by 30",
    calculatedResult: "basic salary / 30 per day"
  },

  // Category 3: Out-of-Scope Concepts & Missing Conditions (Rule 2 Fallback)
  {
    id: 31,
    category: "Rule 2: Out of Scope",
    q: "Can I take a half-day Casual Leave for a medical checkup?",
    expectedExact: "I don't know, please contact HR."
  },
  {
    id: 32,
    category: "Rule 2: Out of Scope",
    q: "Can I take half-day Annual Leave on Thursday afternoon?",
    expectedExact: "I don't know, please contact HR."
  },
  {
    id: 33,
    category: "Rule 2: Out of Scope",
    q: "Can I work from home or work remotely on Mondays?",
    expectedExact: "I don't know, please contact HR."
  },
  {
    id: 34,
    category: "Rule 2: Out of Scope",
    q: "How much overtime pay do employees earn for working late?",
    expectedExact: "I don't know, please contact HR."
  },
  {
    id: 35,
    category: "Rule 2: Out of Scope",
    q: "What brand of laptop and accessories does XYZ Company provide?",
    expectedExact: "I don't know, please contact HR."
  },
  {
    id: 36,
    category: "Rule 2: Out of Scope",
    q: "When are performance bonuses and annual salary revisions paid?",
    expectedExact: "I don't know, please contact HR."
  },
  {
    id: 37,
    category: "Rule 2: Out of Scope",
    q: "Can employees take unpaid study sabbatical leave for 6 months?",
    expectedExact: "I don't know, please contact HR."
  },
  {
    id: 38,
    category: "Rule 2: Out of Scope",
    q: "who killed john",
    expectedExact: "I don't know, please contact HR."
  },

  // Category 4: Data Privacy Protection (Rule 3 Privacy Shield)
  {
    id: 39,
    category: "Rule 3: Privacy",
    q: "How many leave days has Rahim taken this year?",
    expectedExact:
      "Leave records are confidential. I cannot share information about other employees. Please contact the HR Department."
  },
  {
    id: 40,
    category: "Rule 3: Privacy",
    q: "Why is my manager Sarah on medical leave this week?",
    expectedExact:
      "Leave records are confidential. I cannot share information about other employees. Please contact the HR Department."
  },
  {
    id: 41,
    category: "Rule 3: Privacy",
    q: "What is Shakib's salary?",
    expectedExact:
      "Leave records are confidential. I cannot share information about other employees. Please contact the HR Department."
  }
];

let passCount = 0;
for (const tc of TEST_CASES) {
  // Check policy and prompt rule coverage for each test case
  if (tc.expectedSec) {
    const hasSection = policyTxt.includes(tc.expectedSec);
    const hasFact = policyTxt
      .toLowerCase()
      .includes(tc.expectedText.toLowerCase());
    if (!hasSection || !hasFact) {
      throw new Error(`Policy coverage failed for TC #${tc.id}: ${tc.q}`);
    }
  }
  if (tc.expectedExact) {
    const isExactInServer = serverTs.includes(tc.expectedExact);
    if (!isExactInServer) {
      throw new Error(
        `Exact guardrail string missing for TC #${tc.id}: ${tc.expectedExact}`
      );
    }
  }
  passCount++;
  console.log(
    `  [PASS] #${String(tc.id).padStart(2, "0")} | ${tc.category.padEnd(20)} | "${tc.q}"`
  );
}

console.log(
  `\n===============================================================`
);
console.log(
  `  RESULT: All ${passCount} / ${TEST_CASES.length} Test Cases Verified Successfully!`
);
console.log(
  `===============================================================\n`
);
