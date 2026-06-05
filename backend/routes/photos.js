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

const compressAndUpload = async (buffer) => {
  const compressed = await sharp(buffer)
    .resize({ width: 2400, withoutEnlargement: true })
    .jpeg({ quality: 82, progressive: true })
    .toBuffer();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'bydasam', resource_type: 'image' },
      (err, result) => { if (err) reject(err); else resolve(result); }
    );
    stream.end(compressed);
  });
};

router.get('/', async (req, res) => {
  try {
    const q = {};
    if (req.query.folder) q.folder = req.query.folder;
    if (req.query.featured) { q.featured = true; q.folder = null; }
    const photos = await Photo.find(q).populate('folder','name').sort({ order:1, createdAt:-1 });
    res.json(photos);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/', protect, upload.array('photos', 100), async (req, res) => {
  try {
    const saved = [];
    for (let i = 0; i < req.files.length; i++) {
      const f = req.files[i];
      const result = await compressAndUpload(f.buffer);
      const photo = await Photo.create({
        title:    req.body.title || '',
        url:      result.secure_url,
        publicId: result.public_id,
        folder:   req.body.folder || null,
        featured: false,
        order:    i,
      });
      saved.push(photo);
    }
    res.status(201).json(saved);
  } catch(e) {
    console.error('Upload error:', e.message);
    res.status(500).json({ error: e.message });
  }
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
