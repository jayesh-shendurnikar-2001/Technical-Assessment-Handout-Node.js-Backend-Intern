const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { generalLimiter } = require('./middlewares/rateLimiter');
const errorHandler = require('./middlewares/errorHandler');
const AppError = require('./utils/AppError');

// Route imports
const userRoutes = require('./routes/userRoutes');
const cartRoutes = require('./routes/cartRoutes');
const checkoutRoutes = require('./routes/checkoutRoutes');
const campaignRoutes = require('./routes/campaignRoutes');

const app = express();

// 1. Global Middlewares
app.use(helmet()); // Security headers
app.use(cors()); // Cross-Origin Resource Sharing
app.use(express.json({ limit: '10kb' })); // Body parser, reading data from body into req.body

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate Limiting (Feature X)
// Apply the general limiter to all requests
app.use(generalLimiter);

// 2. Routes
app.use('/api/users', userRoutes);
// Nested routes for tenant isolation: /api/users/:userId/cart...
app.use('/api/users/:userId/cart', cartRoutes);
app.use('/api/users/:userId/checkout', checkoutRoutes);

app.use('/api/campaigns', campaignRoutes);

// 3. Handle unhandled routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// 4. Global Error Handling Middleware
app.use(errorHandler);

module.exports = app;
