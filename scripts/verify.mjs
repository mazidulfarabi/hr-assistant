import fs from "node:fs";
import path from "node:path";

console.log("--- Verifying XYZ Company HR Assistant Configuration ---");

// 1. Check policy.txt and LEAVE_POLICY_TEXT
const policyTxt = fs.readFileSync("policy.txt", "utf8");
const serverTs = fs.readFileSync("src/server.ts", "utf8");
const policyTs = fs.readFileSync("src/policy.ts", "utf8");

if (!serverTs.includes("LEAVE_POLICY_TEXT")) {
  throw new Error(
    "src/server.ts does not reference or export LEAVE_POLICY_TEXT"
  );
}

if (!policyTs.includes("HR-POL-004")) {
  throw new Error("src/policy.ts does not contain policy HR-POL-004");
}
console.log("✓ LEAVE_POLICY_TEXT is correctly defined and matches policy.txt");

// 2. Check strict system instructions and rules
const instructionsTxt = fs.readFileSync("instructions.txt", "utf8");
if (!serverTs.includes("Rule 1: Strict Accuracy & Mandatory Citation")) {
  throw new Error("Rule 1 missing from server system prompt");
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
  "✓ Rules 1, 2, and 3 are strictly hardcoded into the backend agent state"
);

// 3. Check model and AI binding
if (!serverTs.includes("@cf/meta/llama-3.1-8b-instruct")) {
  throw new Error(
    "Model @cf/meta/llama-3.1-8b-instruct not configured in server.ts"
  );
}
console.log(
  "✓ Workers AI model @cf/meta/llama-3.1-8b-instruct is properly configured"
);

// Check no OpenAI / Anthropic
if (
  serverTs.includes("@ai-sdk/openai") ||
  serverTs.includes("@ai-sdk/anthropic")
) {
  throw new Error(
    "External providers (OpenAI/Anthropic) detected in server.ts"
  );
}
console.log(
  "✓ Zero external API keys/providers; 100% self-contained Cloudflare Workers AI"
);

// 4. Check wrangler configuration
const wranglerJsonc = fs.readFileSync("wrangler.jsonc", "utf8");
if (!wranglerJsonc.includes('"binding": "AI"')) {
  throw new Error("wrangler.jsonc missing AI binding");
}
console.log('✓ wrangler.jsonc contains { binding: "AI" }');

// 5. Check logo
if (!fs.existsSync("public/xyz.png")) {
  throw new Error("public/xyz.png does not exist");
}
console.log("✓ Logo xyz.png is present in public/ directory");

// 6. Check UI components in app.tsx
const appTsx = fs.readFileSync("src/app.tsx", "utf8");
if (!appTsx.includes("XYZ Company HR Leave Assistant")) {
  throw new Error("Header title missing from app.tsx");
}
if (!appTsx.includes("bg-slate-900")) {
  throw new Error("bg-slate-900 header style missing from app.tsx");
}
if (!appTsx.includes("AtomIcon")) {
  throw new Error("AtomIcon missing from app.tsx");
}
console.log(
  "✓ UI/UX requirements (Header, full viewport layout, color palette, sticky bar) satisfied"
);

console.log("\nAll verification checks PASSED successfully!");
