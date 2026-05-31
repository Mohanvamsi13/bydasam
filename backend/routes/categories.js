const r = require('express').Router();
const { protect } = require('../middleware/auth');
const { Category } = require('../models');
r.get('/', async (req,res) => { try { res.json(await Category.find().sort({order:1})); } catch(e){ res.status(500).json({error:e.message}); } });
r.post('/', protect, async (req,res) => {
  try {
    const slug = req.body.name.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
    res.status(201).json(await Category.create({...req.body, slug}));
  } catch(e){ res.status(500).json({error:e.message}); }
});
r.patch('/:id', protect, async (req,res) => { try { res.json(await Category.findByIdAndUpdate(req.params.id,req.body,{new:true})); } catch(e){ res.status(500).json({error:e.message}); } });
r.delete('/:id', protect, async (req,res) => { try { await Category.findByIdAndDelete(req.params.id); res.json({message:'Deleted'}); } catch(e){ res.status(500).json({error:e.message}); } });
module.exports = r;
