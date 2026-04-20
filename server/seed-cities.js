/**
 * seed-cities.js - Import cities from cities.json into MongoDB without touching other collections.
 *
 * Run: node seed-cities.js
 * Make sure MONGODB_URI is set in .env before running.
 */
require('dotenv').config();
const path = require('path');
const fse = require('fs-extra');
const mongoose = require('mongoose');
const City = require('./models/City');

async function run() {
  console.log('\n  Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('  Connected!\n');

  const filePath = path.join(__dirname, 'data', 'cities.json');
  if (!(await fse.pathExists(filePath))) {
    console.error('  cities.json not found at', filePath);
    await mongoose.disconnect();
    process.exit(1);
  }

  const cities = await fse.readJson(filePath);
  console.log(`  Read ${cities.length} cities from cities.json`);

  await City.deleteMany({});
  await City.insertMany(cities);
  console.log(`  Imported ${cities.length} cities into MongoDB\n`);

  await mongoose.disconnect();
  console.log('  Done!\n');
}

run().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
