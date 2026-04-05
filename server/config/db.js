const mongoose = require('mongoose');

async function connectDB() {
  const maxRetries = 5;
  for (let i = 1; i <= maxRetries; i++) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 15000,
        socketTimeoutMS: 45000,
      });
      console.log('  MongoDB connected successfully');
      return;
    } catch (err) {
      console.error(`  MongoDB connection attempt ${i}/${maxRetries} failed:`, err.message);
      if (i < maxRetries) {
        const wait = i * 3000;
        console.log(`  Retrying in ${wait / 1000}s...`);
        await new Promise(r => setTimeout(r, wait));
      }
    }
  }
  console.error('  MongoDB connection failed after all retries. Server will start without DB.');
}

module.exports = connectDB;
