const path = require('path');
const fse = require('fs-extra');

const GOV_FILE = path.join(__dirname, '..', 'data', 'governorates.json');
const CITIES_FILE = path.join(__dirname, '..', 'data', 'cities.json');

async function readGovernorates() {
  if (!(await fse.pathExists(GOV_FILE))) return [];
  return fse.readJson(GOV_FILE);
}

async function readCities() {
  if (!(await fse.pathExists(CITIES_FILE))) return [];
  return fse.readJson(CITIES_FILE);
}

// GET /api/governorates
async function getAllGovernorates(_req, res, next) {
  try {
    const governorates = await readGovernorates();
    res.json(governorates);
  } catch (err) {
    next(err);
  }
}

// GET /api/governorates/:id/cities
async function getCitiesByGovernorate(req, res, next) {
  try {
    const govId = parseInt(req.params.id, 10);
    const allCities = await readCities();
    const cities = allCities.filter(c => c.governorate_id === govId);
    res.json(cities);
  } catch (err) {
    next(err);
  }
}

module.exports = { getAllGovernorates, getCitiesByGovernorate };
