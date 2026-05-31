const router = require('express').Router();
const nodemailer = require('nodemailer');
const { protect } = require('../middleware/auth');
const { Booking } = require('../models');

const mailer = nodemailer.createTransport({ service:'gmail', auth:{ user:process.env.EMAIL_USER, pass:process.env.EMAIL_PASS } });

router.post('/', async (req,res) => {
  try {
    const b = await Booking.create(req.body);
    mailer.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.NOTIFY_EMAIL,
      subject: `📸 New Booking — ${b.firstName} ${b.lastName} (${b.service})`,
      html: `<h2>New Booking on bydasam.com</h2><p><b>Name:</b> ${b.firstName} ${b.lastName}</p><p><b>Email:</b> ${b.email}</p><p><b>Phone:</b> ${b.phone||'N/A'}</p><p><b>Service:</b> ${b.service}</p><p><b>Date:</b> ${b.date||'Flexible'}</p><p><b>Message:</b> ${b.message||'None'}</p>`,
    }).catch(e => console.warn('Email failed:', e.message));
    res.status(201).json({ message:'Booking received', id:b._id });
  } catch(e){ res.status(500).json({error:e.message}); }
});
router.get('/', protect, async (req,res) => { try { res.json(await Booking.find().sort({createdAt:-1})); } catch(e){ res.status(500).json({error:e.message}); } });
router.patch('/:id', protect, async (req,res) => { try { res.json(await Booking.findByIdAndUpdate(req.params.id,req.body,{new:true})); } catch(e){ res.status(500).json({error:e.message}); } });
router.delete('/:id', protect, async (req,res) => { try { await Booking.findByIdAndDelete(req.params.id); res.json({message:'Deleted'}); } catch(e){ res.status(500).json({error:e.message}); } });
module.exports = router;
