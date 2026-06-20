const mongoose = require('mongoose');

/**
 * Connect to MongoDB using the connection string from environment variables.
 * Exits the process on connection failure to prevent the app from running
 * in a broken state.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
