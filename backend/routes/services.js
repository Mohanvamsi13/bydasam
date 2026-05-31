// services
const sr = require('express').Router();
const { protect } = require('../middleware/auth');
const { Service } = require('../models');
sr.get('/', async (req,res) => { try { res.json(await Service.find().sort({order:1})); } catch(e){ res.status(500).json({error:e.message}); } });
sr.post('/', protect, async (req,res) => { try { res.status(201).json(await Service.create(req.body)); } catch(e){ res.status(500).json({error:e.message}); } });
sr.patch('/:id', protect, async (req,res) => { try { res.json(await Service.findByIdAndUpdate(req.params.id,req.body,{new:true})); } catch(e){ res.status(500).json({error:e.message}); } });
sr.delete('/:id', protect, async (req,res) => { try { await Service.findByIdAndDelete(req.params.id); res.json({message:'Deleted'}); } catch(e){ res.status(500).json({error:e.message}); } });
module.exports = sr;
