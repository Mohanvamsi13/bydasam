const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { Folder, Photo } = require('../models');

router.get('/', async (req, res) => {
  try {
    const folders = await Folder.find().sort({ order:1, createdAt:1 });
    const buildTree = (parentId = null) => {
      return folders
        .filter(f => String(f.parent) === String(parentId) || (!f.parent && !parentId))
        .map(f => ({ ...f.toObject(), children: buildTree(f._id) }));
    };
    res.json(buildTree());
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/flat', async (req, res) => {
  try {
    const folders = await Folder.find().populate('parent','name').sort({ order:1 });
    const foldersWithCovers = await Promise.all(folders.map(async f => {
      const obj = f.toObject();
      if (!obj.coverPhoto) {
        const firstPhoto = await Photo.findOne({ folder: f._id }).sort({ createdAt: 1 });
        if (firstPhoto) obj.coverPhoto = firstPhoto.url;
      }
      return obj;
    }));
    res.json(foldersWithCovers);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/', protect, async (req, res) => {
  try {
    const { name, parent } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });
    const folder = await Folder.create({ name, parent: parent || null });
    res.status(201).json(folder);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.patch('/:id', protect, async (req, res) => {
  try {
    const folder = await Folder.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(folder);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const deleteRecursive = async (id) => {
      const children = await Folder.find({ parent: id });
      for (const child of children) await deleteRecursive(child._id);
      await Folder.findByIdAndDelete(id);
    };
    await deleteRecursive(req.params.id);
    res.json({ message: 'Deleted' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
