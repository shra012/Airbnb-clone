const path = require("path");
const crypto = require("crypto");
const dotenv = require("dotenv");

const envFile = process.env.NODE_ENV === "test" ? ".env.test" : ".env";
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

const required = ["DATABASE_URL"];
const missing = required.filter((key) => !process.env[key]);

if (missing.length) {
  console.warn(`Warning: Missing environment variables: ${missing.join(", ")}`);
}

const generateSessionId = () => {
  const salt = crypto.randomBytes(16).toString("hex");
  const entropy = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHmac("sha256", salt).update(entropy).digest("hex");
  return `${salt}.${hash}`;
};

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "4000", 10),
  databaseUrl: process.env.DATABASE_URL,
  sessionSecret: process.env.SESSION_SECRET || generateSessionId(),
  corsOrigins: (process.env.CORS_ORIGINS || "").split(",").filter(Boolean),
};

module.exports = { env };
