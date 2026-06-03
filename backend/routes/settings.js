const router = require('express').Router();
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const sharp = require('sharp');
const { protect } = require('../middleware/auth');
const { Settings } = require('../models');

cloudinary.config({ cloud_name:process.env.CLOUDINARY_CLOUD_NAME, api_key:process.env.CLOUDINARY_API_KEY, api_secret:process.env.CLOUDINARY_API_SECRET });

const upload = multer({ storage: multer.memoryStorage(), limits:{ fileSize: 500*1024*1024 } });
const uploadHero = multer({ storage: multer.memoryStorage(), limits:{ fileSize: 500*1024*1024 } });

const compressImage = async (buffer, width=2400, quality=85) => {
  return sharp(buffer)
    .resize({ width, withoutEnlargement: true })
    .jpeg({ quality, progressive: true })
    .toBuffer();
};

const uploadToCloudinary = (buffer, folder, opts={}) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type:'image', fetch_format:'auto', ...opts },
      (err, result) => { if (err) reject(err); else resolve(result); }
    );
    stream.end(buffer);
  });
};

const uploadVideoToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type:'video', fetch_format:'mp4' },
      (err, result) => { if (err) reject(err); else resolve(result); }
    );
    stream.end(buffer);
  });
};

router.get('/', async (req,res) => {
  try {
    const rows = await Settings.find();
    const obj = {};
    rows.forEach(r => obj[r.key] = r.value);
    res.json(obj);
  } catch(e){ res.status(500).json({error:e.message}); }
});

router.post('/', protect, async (req,res) => {
  try {
    await Promise.all(Object.entries(req.body).map(([key,value]) =>
      Settings.findOneAndUpdate({key},{key,value},{upsert:true,new:true})
    ));
    res.json({message:'Saved'});
  } catch(e){ res.status(500).json({error:e.message}); }
});

router.post('/about-photo', protect, upload.single('photo'), async (req,res) => {
  try {
    const compressed = await compressImage(req.file.buffer, 780, 90);
    const result = await uploadToCloudinary(compressed, 'bydasam-about');
    await Settings.findOneAndUpdate({key:'aboutPhoto'},{key:'aboutPhoto',value:result.secure_url},{upsert:true,new:true});
    res.json({ url: result.secure_url });
  } catch(e){ res.status(500).json({error:e.message}); }
});

router.post('/hero-media', protect, uploadHero.single('media'), async (req,res) => {
  try {
    const isVideo = req.file.mimetype.startsWith('video/');
    let url;
    if (isVideo) {
      const result = await uploadVideoToCloudinary(req.file.buffer, 'bydasam-hero');
      url = result.secure_url;
    } else {
      const compressed = await compressImage(req.file.buffer, 1920, 90);
      const result = await uploadToCloudinary(compressed, 'bydasam-hero');
      url = result.secure_url;
    }
    await Settings.findOneAndUpdate({key:'heroMedia'},{key:'heroMedia',value:url},{upsert:true,new:true});
    await Settings.findOneAndUpdate({key:'heroMediaType'},{key:'heroMediaType',value:isVideo?'video':'image'},{upsert:true,new:true});
    res.json({ url, type: isVideo?'video':'image' });
  } catch(e){ res.status(500).json({error:e.message}); }
});

router.get('/carousel', async (req,res) => {
  try {
    const row = await Settings.findOne({ key:'carouselPhotos' });
    res.json(row ? row.value : []);
  } catch(e){ res.status(500).json({error:e.message}); }
});

router.post('/carousel', protect, upload.array('photos', 20), async (req,res) => {
  try {
    const existing = await Settings.findOne({ key:'carouselPhotos' });
    const current = existing ? existing.value : [];
    const newPhotos = await Promise.all(
      req.files.map(async (f, i) => {
        const compressed = await compressImage(f.buffer, 1920, 85);
        const result = await uploadToCloudinary(compressed, 'bydasam-carousel');
        return { url: result.secure_url, publicId: result.public_id, order: current.length + i };
      })
    );
    const updated = [...current, ...newPhotos].slice(0, 20);
    await Settings.findOneAndUpdate({key:'carouselPhotos'},{key:'carouselPhotos',value:updated},{upsert:true,new:true});
    res.json(updated);
  } catch(e){ res.status(500).json({error:e.message}); }
});

router.delete('/carousel/:publicId', protect, async (req,res) => {
  try {
    const row = await Settings.findOne({ key:'carouselPhotos' });
    if (!row) return res.json([]);
    const publicId = decodeURIComponent(req.params.publicId);
    await cloudinary.uploader.destroy(publicId);
    const updated = row.value.filter(p => p.publicId !== publicId);
    await Settings.findOneAndUpdate({key:'carouselPhotos'},{key:'carouselPhotos',value:updated},{upsert:true,new:true});
    res.json(updated);
  } catch(e){ res.status(500).json({error:e.message}); }
});

module.exports = router;
