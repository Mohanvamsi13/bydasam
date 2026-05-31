const r = require('express').Router();
const { protect } = require('../middleware/auth');
const { Social } = require('../models');
r.get('/', async (req,res) => { try { res.json(await Social.find().sort({order:1})); } catch(e){ res.status(500).json({error:e.message}); } });
r.post('/', protect, async (req,res) => { try { res.status(201).json(await Social.create(req.body)); } catch(e){ res.status(500).json({error:e.message}); } });
r.patch('/:id', protect, async (req,res) => { try { res.json(await Social.findByIdAndUpdate(req.params.id,req.body,{new:true})); } catch(e){ res.status(500).json({error:e.message}); } });
r.delete('/:id', protect, async (req,res) => { try { await Social.findByIdAndDelete(req.params.id); res.json({message:'Deleted'}); } catch(e){ res.status(500).json({error:e.message}); } });
module.exports = r;
