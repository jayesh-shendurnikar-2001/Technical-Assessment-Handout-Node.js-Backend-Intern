const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const logger = require('./utils/logger');

// Catch synchronous unhandled exceptions and exit gracefully
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...', {
    name: err.name,
    message: err.message,
    stack: err.stack,
  });
  process.exit(1);
});

const app = require('./app');
const connectDB = require('./config/db');

// Connect to MongoDB
connectDB();

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  logger.info(`App running on port ${port} in ${process.env.NODE_ENV} mode.`);
});

// Catch asynchronous unhandled rejections (e.g., failed DB connection later on)
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...', {
    name: err.name,
    message: err.message,
    stack: err.stack,
  });
  // Graceful shutdown: close server then exit
  server.close(() => {
    process.exit(1);
  });
});

// Handle SIGTERM (e.g., from Heroku/Docker)
process.on('SIGTERM', () => {
  logger.info('👋 SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    logger.info('💥 Process terminated!');
  });
});
