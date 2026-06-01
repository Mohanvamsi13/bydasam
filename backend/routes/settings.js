const router = require('express').Router();
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { protect } = require('../middleware/auth');
const { Settings } = require('../models');

cloudinary.config({ cloud_name:process.env.CLOUDINARY_CLOUD_NAME, api_key:process.env.CLOUDINARY_API_KEY, api_secret:process.env.CLOUDINARY_API_SECRET });

const storage = new CloudinaryStorage({ cloudinary, params: { folder:'bydasam-about', allowed_formats:['jpg','jpeg','png','webp'], transformation:[{ width:800, crop:'limit', quality:'auto' }] } });
const upload = multer({ storage, limits:{ fileSize: 10*1024*1024 } });

router.get('/', async (req,res) => {
  try { const rows=await Settings.find(); const obj={}; rows.forEach(r=>obj[r.key]=r.value); res.json(obj); }
  catch(e){ res.status(500).json({error:e.message}); }
});

router.post('/', protect, async (req,res) => {
  try {
    await Promise.all(Object.entries(req.body).map(([key,value])=>Settings.findOneAndUpdate({key},{key,value},{upsert:true,new:true})));
    res.json({message:'Saved'});
  } catch(e){ res.status(500).json({error:e.message}); }
});

router.post('/about-photo', protect, upload.single('photo'), async (req,res) => {
  try {
    await Settings.findOneAndUpdate({key:'aboutPhoto'},{key:'aboutPhoto',value:req.file.path},{upsert:true,new:true});
    res.json({ url: req.file.path });
  } catch(e){ res.status(500).json({error:e.message}); }
});

module.exports = router;
