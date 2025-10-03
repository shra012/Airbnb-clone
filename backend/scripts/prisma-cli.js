#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const dotenv = require('dotenv');

// Load environment variables so DATABASE provider can be resolved consistently
const projectRoot = path.resolve(__dirname, '..');
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
dotenv.config({ path: path.join(projectRoot, envFile) });

const providerEnv = (process.env.DATABASE || process.env.DATABASE_PROVIDER || '').toLowerCase();
const providerMap = new Map([
  ['pg', 'pg'],
  ['postgres', 'pg'],
  ['postgresql', 'pg'],
  ['mysql', 'mysql'],
]);
const schemaSuffix = providerMap.get(providerEnv) || 'mysql';
const schemaPath = path.join(projectRoot, 'prisma', `schema.${schemaSuffix}.prisma`);

if (!fs.existsSync(schemaPath)) {
  console.error(`\nError: Unable to locate Prisma schema for provider "${providerEnv || 'mysql (default)'}".`);
  console.error(`Expected file at ${path.relative(projectRoot, schemaPath)}\n`);
  process.exit(1);
}

const args = process.argv.slice(2);
const hasSchemaFlag = args.some((arg) => arg.startsWith('--schema'));
const firstArg = args[0];
const schemaAwareCommands = new Set([
  'generate',
  'migrate',
  'db',
  'studio',
  'validate',
  'format',
]);

const shouldAttachSchema =
  !hasSchemaFlag &&
  firstArg &&
  !firstArg.startsWith('-') &&
  schemaAwareCommands.has(firstArg);

if (shouldAttachSchema) {
  args.push(`--schema=${schemaPath}`);
}

const prismaBinary = path.join(
  projectRoot,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'prisma.cmd' : 'prisma'
);

if (!fs.existsSync(prismaBinary)) {
  console.error('\nError: Prisma CLI not found. Did you run npm install?\n');
  process.exit(1);
}

// Ensure Prisma honors the desired schema and preserve the current environment
const result = spawnSync(prismaBinary, args, {
  stdio: 'inherit',
  env: {
    ...process.env,
    PRISMA_SCHEMA_PATH:
      hasSchemaFlag || !shouldAttachSchema ? process.env.PRISMA_SCHEMA_PATH : schemaPath,
  },
});

if (result.error) {
  console.error(`\nError running Prisma CLI: ${result.error.message}\n`);
  process.exit(result.status ?? 1);
}

process.exit(result.status ?? 0);
