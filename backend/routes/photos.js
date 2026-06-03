const router = require('express').Router();
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const sharp = require('sharp');
const { protect } = require('../middleware/auth');
const { Photo } = require('../models');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 },
});

const compressAndUpload = async (buffer, filename) => {
  const compressed = await sharp(buffer)
    .resize({ width: 2400, withoutEnlargement: true })
    .jpeg({ quality: 85, progressive: true })
    .toBuffer();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'bydasam', resource_type: 'image', fetch_format: 'auto' },
      (err, result) => { if (err) reject(err); else resolve(result); }
    );
    stream.end(compressed);
  });
};

router.get('/', async (req, res) => {
  try {
    const q = {};
    if (req.query.folder) q.folder = req.query.folder;
    if (req.query.featured) q.featured = true;
    const photos = await Photo.find(q).populate('folder','name').sort({ order:1, createdAt:-1 });
    res.json(photos);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/', protect, upload.array('photos', 100), async (req, res) => {
  try {
    const saved = await Promise.all(
      req.files.map(async (f, i) => {
        const result = await compressAndUpload(f.buffer, f.originalname);
        return Photo.create({
          title:    req.body.title || '',
          url:      result.secure_url,
          publicId: result.public_id,
          folder:   req.body.folder || null,
          featured: false,
          order:    i,
        });
      })
    );
    res.status(201).json(saved);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.patch('/:id', protect, async (req, res) => {
  try {
    const photo = await Photo.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(photo);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const p = await Photo.findById(req.params.id);
    if (!p) return res.status(404).json({ error: 'Not found' });
    await cloudinary.uploader.destroy(p.publicId);
    await p.deleteOne();
    res.json({ message: 'Deleted' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
