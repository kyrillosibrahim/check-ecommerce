const ExternalWebsite = require('../models/ExternalWebsite');

async function getNextId() {
  const last = await ExternalWebsite.findOne({}, { id: 1 }).sort({ id: -1 });
  return last ? last.id + 1 : 1;
}

function sanitize(doc) {
  const obj = doc.toObject();
  delete obj._id;
  delete obj.__v;
  return obj;
}

async function getAllExternalWebsites(_req, res, next) {
  try {
    const sites = await ExternalWebsite.find({}, { __v: 0 }).sort({ id: -1 });
    res.json(sites.map(s => { const o = s.toObject(); delete o._id; return o; }));
  } catch (err) { next(err); }
}

async function createExternalWebsite(req, res, next) {
  try {
    const { name, logoUrl } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Website name is required.' });
    if (!logoUrl?.trim()) return res.status(400).json({ error: 'Website logo is required.' });
    const created = await ExternalWebsite.create({
      id: await getNextId(),
      name: name.trim(),
      logoUrl: logoUrl.trim(),
    });
    res.status(201).json(sanitize(created));
  } catch (err) { next(err); }
}

async function updateExternalWebsite(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, logoUrl } = req.body;
    const site = await ExternalWebsite.findOne({ id });
    if (!site) return res.status(404).json({ error: 'External website not found.' });
    if (name !== undefined) {
      if (!name.trim()) return res.status(400).json({ error: 'Website name is required.' });
      site.name = name.trim();
    }
    if (logoUrl !== undefined) {
      if (!logoUrl.trim()) return res.status(400).json({ error: 'Website logo is required.' });
      site.logoUrl = logoUrl.trim();
    }
    await site.save();
    res.json(sanitize(site));
  } catch (err) { next(err); }
}

async function deleteExternalWebsite(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const deleted = await ExternalWebsite.findOneAndDelete({ id });
    if (!deleted) return res.status(404).json({ error: 'External website not found.' });
    res.json({ message: 'External website deleted successfully.' });
  } catch (err) { next(err); }
}

module.exports = {
  getAllExternalWebsites,
  createExternalWebsite,
  updateExternalWebsite,
  deleteExternalWebsite,
};
