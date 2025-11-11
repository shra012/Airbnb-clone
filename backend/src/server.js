const http = require('http');
const { app, sessionMiddleware } = require('./app');
const { env } = require('./config/env');
const { prisma } = require('./config/prisma');
const { closeMongo } = require('./config/mongo');
const { startBookingConsumers, stopBookingConsumers } = require('./messaging/bookingConsumers');
const { initSocketServer, closeSocketServer } = require('./realtime/socketServer');

async function bootstrap() {
  const httpServer = http.createServer(app);
  initSocketServer(httpServer, sessionMiddleware);
  await startBookingConsumers();
  await new Promise((resolve) => {
    httpServer.listen(env.port, () => {
      console.log(`API listening on port ${env.port}`);
      resolve();
    });
  });
  return httpServer;
}

let serverPromise = bootstrap();

function shutdown(signal) {
  console.log(`\nReceived ${signal}, shutting down gracefully...`);
  serverPromise
    .then(
      (server) =>
        new Promise((resolve) => {
          server.close(resolve);
        })
    )
    .catch(() => Promise.resolve())
    .finally(async () => {
      await stopBookingConsumers();
      await closeSocketServer();
      await closeMongo();
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
