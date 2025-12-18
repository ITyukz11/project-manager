import crypto from "crypto";

function generateApiKey(prefix: string = "sk_live"): string {
  const randomBytes = crypto.randomBytes(32);
  const key = randomBytes.toString("hex");
  return `${prefix}_${key}`;
}

// Generate 3 keys
console.log("\n🔑 Generated API Keys:\n");
console.log("BANKING_API_KEY_MASTER=" + generateApiKey());
console.log("BANKING_API_KEY_PARTNER1=" + generateApiKey());
console.log("BANKING_API_KEY_PARTNER2=" + generateApiKey());
console.log("\n✅ Copy these to your . env file\n");
