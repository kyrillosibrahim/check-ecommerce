const mongoose = require('mongoose');

const externalWebsiteSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  logoUrl: { type: String, required: true },
});

module.exports = mongoose.model('ExternalWebsite', externalWebsiteSchema);
