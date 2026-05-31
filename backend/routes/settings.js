// settings
const sr = require('express').Router();
const { protect } = require('../middleware/auth');
const { Settings } = require('../models');
sr.get('/', async (req,res) => { try { const rows=await Settings.find(); const obj={}; rows.forEach(r=>obj[r.key]=r.value); res.json(obj); } catch(e){ res.status(500).json({error:e.message}); } });
sr.post('/', protect, async (req,res) => { try { await Promise.all(Object.entries(req.body).map(([key,value])=>Settings.findOneAndUpdate({key},{key,value},{upsert:true,new:true}))); res.json({message:'Saved'}); } catch(e){ res.status(500).json({error:e.message}); } });
module.exports = sr;
