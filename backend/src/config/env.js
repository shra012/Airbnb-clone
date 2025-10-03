const fs = require("fs");
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

const providerAlias = new Map([
  ["pg", "pg"],
  ["postgres", "pg"],
  ["postgresql", "pg"],
  ["postgres-psql", "pg"],
  ["mysql", "mysql"],
]);

const providerInput = (process.env.DATABASE || process.env.DATABASE_PROVIDER || "").toLowerCase();
const databaseProvider = providerAlias.get(providerInput) || "mysql";

if (!providerAlias.has(providerInput) && providerInput) {
  console.warn(`Warning: Unrecognized DATABASE provider "${providerInput}" - defaulting to MySQL schema.`);
}

const schemaSuffix = databaseProvider === "pg" ? "pg" : "mysql";
const prismaSchemaPath = path.resolve(process.cwd(), "prisma", `schema.${schemaSuffix}.prisma`);

if (!fs.existsSync(prismaSchemaPath)) {
  console.warn(`Warning: Prisma schema not found at ${prismaSchemaPath}`);
}

if (!process.env.PRISMA_SCHEMA_PATH) {
  process.env.PRISMA_SCHEMA_PATH = prismaSchemaPath;
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
  databaseProvider,
  prismaSchemaPath,
  sessionSecret: process.env.SESSION_SECRET || generateSessionId(),
  corsOrigins: (process.env.CORS_ORIGINS || "").split(",").filter(Boolean),
};

module.exports = { env };
