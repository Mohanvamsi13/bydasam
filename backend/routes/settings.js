const router = require('express').Router();
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { protect } = require('../middleware/auth');
const { Settings } = require('../models');

cloudinary.config({ cloud_name:process.env.CLOUDINARY_CLOUD_NAME, api_key:process.env.CLOUDINARY_API_KEY, api_secret:process.env.CLOUDINARY_API_SECRET });

const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: { folder:'bydasam-about', allowed_formats:['jpg','jpeg','png','webp'], transformation:[{ width:1200, crop:'fill', height:1400, quality:'auto:good', fetch_format:'auto' }] }
});

const heroStorage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => {
    const isVideo = file.mimetype.startsWith('video/');
    return {
      folder: 'bydasam-hero',
      resource_type: isVideo ? 'video' : 'image',
      allowed_formats: isVideo ? ['mp4','mov','webm','avi'] : ['jpg','jpeg','png','webp'],
      transformation: isVideo
        ? [{ quality:'auto:good', fetch_format:'mp4' }]
        : [{ width:1920, crop:'limit', quality:'auto:good', fetch_format:'auto' }],
    };
  }
});

const carouselStorage = new CloudinaryStorage({
  cloudinary,
  params: { folder:'bydasam-carousel', allowed_formats:['jpg','jpeg','png','webp'], transformation:[{ width:1920, crop:'limit', quality:'auto:good', fetch_format:'auto' }] }
});

const uploadImage    = multer({ storage: imageStorage,    limits:{ fileSize: 500*1024*1024 } });
const uploadHero     = multer({ storage: heroStorage,     limits:{ fileSize: 500*1024*1024 } });
const uploadCarousel = multer({ storage: carouselStorage, limits:{ fileSize: 500*1024*1024 } });

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

router.post('/about-photo', protect, uploadImage.single('photo'), async (req,res) => {
  try {
    await Settings.findOneAndUpdate({key:'aboutPhoto'},{key:'aboutPhoto',value:req.file.path},{upsert:true,new:true});
    res.json({ url: req.file.path });
  } catch(e){ res.status(500).json({error:e.message}); }
});

router.post('/hero-media', protect, uploadHero.single('media'), async (req,res) => {
  try {
    const isVideo = req.file.mimetype.startsWith('video/');
    await Settings.findOneAndUpdate({key:'heroMedia'},{key:'heroMedia',value:req.file.path},{upsert:true,new:true});
    await Settings.findOneAndUpdate({key:'heroMediaType'},{key:'heroMediaType',value:isVideo?'video':'image'},{upsert:true,new:true});
    res.json({ url: req.file.path, type: isVideo?'video':'image' });
  } catch(e){ res.status(500).json({error:e.message}); }
});

router.get('/carousel', async (req,res) => {
  try {
    const row = await Settings.findOne({ key:'carouselPhotos' });
    res.json(row ? row.value : []);
  } catch(e){ res.status(500).json({error:e.message}); }
});

router.post('/carousel', protect, uploadCarousel.array('photos', 20), async (req,res) => {
  try {
    const existing = await Settings.findOne({ key:'carouselPhotos' });
    const current = existing ? existing.value : [];
    const newPhotos = req.files.map((f, i) => ({ url: f.path, publicId: f.filename, order: current.length + i }));
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
