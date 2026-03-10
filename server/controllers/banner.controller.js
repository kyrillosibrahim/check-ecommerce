const path = require('path');
const fse = require('fs-extra');

const DATA_FILE = path.join(__dirname, '..', 'data', 'banners.json');
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads', 'banners');

async function readBanners() {
  if (!(await fse.pathExists(DATA_FILE))) {
    await fse.writeJson(DATA_FILE, [], { spaces: 2 });
    return [];
  }
  return fse.readJson(DATA_FILE);
}

async function writeBanners(banners) {
  await fse.writeJson(DATA_FILE, banners, { spaces: 2 });
}

function getNextId(banners) {
  if (banners.length === 0) return 1;
  return Math.max(...banners.map(b => b.id)) + 1;
}

async function getAllBanners(_req, res, next) {
  try {
    const banners = await readBanners();
    res.json(banners);
  } catch (err) {
    next(err);
  }
}

async function createBanner(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Banner image is required.' });
    }

    const banners = await readBanners();
    const link = (req.body.link || '').trim();
    const page = (req.body.page || 'home').trim();

    await fse.ensureDir(UPLOADS_DIR);
    const ext = path.extname(req.file.originalname) || '.webp';
    const filename = `banner-${Date.now()}${ext}`;
    const dest = path.join(UPLOADS_DIR, filename);
    await fse.move(req.file.path, dest, { overwrite: true });

    const newBanner = {
      id: getNextId(banners),
      image: `banners/${filename}`,
      link,
      page
    };

    banners.push(newBanner);
    await writeBanners(banners);

    res.status(201).json(newBanner);
  } catch (err) {
    next(err);
  }
}

async function updateBanner(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const banners = await readBanners();
    const index = banners.findIndex(b => b.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Banner not found.' });
    }

    if (req.body.link !== undefined) {
      banners[index].link = req.body.link.trim();
    }
    if (req.body.page !== undefined) {
      banners[index].page = req.body.page.trim();
    }

    if (req.file) {
      await fse.ensureDir(UPLOADS_DIR);
      // Delete old image
      if (banners[index].image) {
        const oldPath = path.join(__dirname, '..', 'uploads', banners[index].image);
        await fse.remove(oldPath).catch(() => {});
      }
      const ext = path.extname(req.file.originalname) || '.webp';
      const filename = `banner-${Date.now()}${ext}`;
      const dest = path.join(UPLOADS_DIR, filename);
      await fse.move(req.file.path, dest, { overwrite: true });
      banners[index].image = `banners/${filename}`;
    }

    await writeBanners(banners);
    res.json(banners[index]);
  } catch (err) {
    next(err);
  }
}

async function deleteBanner(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const banners = await readBanners();
    const index = banners.findIndex(b => b.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Banner not found.' });
    }

    if (banners[index].image) {
      const imgPath = path.join(__dirname, '..', 'uploads', banners[index].image);
      await fse.remove(imgPath).catch(() => {});
    }

    banners.splice(index, 1);
    await writeBanners(banners);

    res.json({ message: 'Banner deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAllBanners, createBanner, updateBanner, deleteBanner };
