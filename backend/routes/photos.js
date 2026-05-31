const router = require('express').Router();
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { protect } = require('../middleware/auth');
const { Photo } = require('../models');

cloudinary.config({ cloud_name:process.env.CLOUDINARY_CLOUD_NAME, api_key:process.env.CLOUDINARY_API_KEY, api_secret:process.env.CLOUDINARY_API_SECRET });

const storage = new CloudinaryStorage({ cloudinary, params: { folder:'bydasam', allowed_formats:['jpg','jpeg','png','webp'], transformation:[{ width:2400, crop:'limit', quality:'auto' }] } });
const upload = multer({ storage, limits:{ fileSize: 15*1024*1024 } });

router.get('/', async (req,res) => {
  try {
    const q = req.query.category ? { category:req.query.category } : {};
    res.json(await Photo.find(q).populate('category','name slug').sort({ order:1, createdAt:-1 }));
  } catch(e){ res.status(500).json({ error:e.message }); }
});
router.post('/', protect, upload.array('photos',20), async (req,res) => {
  try {
    const saved = await Promise.all(req.files.map((f,i) => Photo.create({ title:req.body.title||'', url:f.path, publicId:f.filename, category:req.body.category||null, order:i })));
    res.status(201).json(saved);
  } catch(e){ res.status(500).json({ error:e.message }); }
});
router.patch('/:id', protect, async (req,res) => {
  try { res.json(await Photo.findByIdAndUpdate(req.params.id, req.body, { new:true })); }
  catch(e){ res.status(500).json({ error:e.message }); }
});
router.delete('/:id', protect, async (req,res) => {
  try {
    const p = await Photo.findById(req.params.id);
    if (!p) return res.status(404).json({ error:'Not found' });
    await cloudinary.uploader.destroy(p.publicId);
    await p.deleteOne();
    res.json({ message:'Deleted' });
  } catch(e){ res.status(500).json({ error:e.message }); }
});
module.exports = router;
