const Governorate = require('../models/Governorate');
const City = require('../models/City');

async function getAllGovernorates(_req, res, next) {
  try { const govs = await Governorate.find({}, { __v: 0 }); res.json(govs.map(g => { const o = g.toObject(); delete o._id; return o; })); }
  catch (err) { next(err); }
}

async function getCitiesByGovernorate(req, res, next) {
  try { const govId = parseInt(req.params.id, 10); const cities = await City.find({ governorate_id: govId }, { __v: 0, _id: 0 }); res.json(cities); }
  catch (err) { next(err); }
}

async function updateGovernorate(req, res, next) {
  try {
    const govId = parseInt(req.params.id, 10); const { shippingCost } = req.body;
    if (shippingCost == null || isNaN(Number(shippingCost))) return res.status(400).json({ message: 'shippingCost is required' });
    const gov = await Governorate.findOneAndUpdate(
      { id: govId },
      { $set: { shippingCost: Number(shippingCost) } },
      { new: true, upsert: true, setDefaultsOnInsert: true, projection: { __v: 0 } }
    );
    const o = gov.toObject(); delete o._id; res.json(o);
  } catch (err) { next(err); }
}

module.exports = { getAllGovernorates, getCitiesByGovernorate, updateGovernorate };
