const { app } = require('./app');
const { env } = require('./config/env');
const { prisma } = require('./config/prisma');

const server = app.listen(env.port, () => {
  console.log(`API listening on port ${env.port}`);
});

function shutdown(signal) {
  console.log(`\nReceived ${signal}, shutting down gracefully...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

['SIGINT', 'SIGTERM'].forEach((signal) => {
  process.on(signal, () => shutdown(signal));
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception', err);
  shutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection', reason);
  shutdown('unhandledRejection');
});
