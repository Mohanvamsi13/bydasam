const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  email:      { type:String, required:true, unique:true, lowercase:true },
  password:   { type:String, required:true },
  mfaSecret:  { type:String, default:'' },
  mfaEnabled: { type:Boolean, default:false },
}, { timestamps:true });

adminSchema.pre('save', async function(next){
  if(this.isModified('password')) this.password = await bcrypt.hash(this.password, 12);
  next();
});
adminSchema.methods.comparePassword = function(p){ return bcrypt.compare(p, this.password); };

const folderSchema = new mongoose.Schema({
  name:      { type:String, required:true },
  parent:    { type:mongoose.Schema.Types.ObjectId, ref:'Folder', default:null },
  coverPhoto:{ type:String, default:'' },
  order:     { type:Number, default:0 },
}, { timestamps:true });

const photoSchema = new mongoose.Schema({
  title:    { type:String, default:'' },
  url:      { type:String, required:true },
  publicId: { type:String, required:true },
  folder:   { type:mongoose.Schema.Types.ObjectId, ref:'Folder', default:null },
  type:     { type:String, enum:['portfolio','carousel'], default:'portfolio' },
  featured:      { type:Boolean, default:false },
  cropPosition: { type:String, default:'center center' },
  order:        { type:Number, default:0 },
}, { timestamps:true });

const bookingSchema = new mongoose.Schema({
  firstName:{ type:String, required:true },
  lastName: { type:String, default:'' },
  email:    { type:String, required:true, lowercase:true },
  phone:    { type:String, default:'' },
  service:  { type:String, default:'General Inquiry' },
  date:     { type:String, default:'' },
  message:  { type:String, default:'' },
  status:   { type:String, enum:['new','confirmed','cancelled'], default:'new' }
}, { timestamps:true });

const settingsSchema = new mongoose.Schema({
  key:  { type:String, required:true, unique:true },
  value:{ type:mongoose.Schema.Types.Mixed }
}, { timestamps:true });

const socialSchema = new mongoose.Schema({
  name: { type:String, required:true },
  url:  { type:String, required:true },
  order:{ type:Number, default:0 }
}, { timestamps:true });

module.exports = {
  Admin:    mongoose.models.Admin    || mongoose.model('Admin',    adminSchema),
  Folder:   mongoose.models.Folder   || mongoose.model('Folder',   folderSchema),
  Photo:    mongoose.models.Photo    || mongoose.model('Photo',    photoSchema),
  Booking:  mongoose.models.Booking  || mongoose.model('Booking',  bookingSchema),
  Settings: mongoose.models.Settings || mongoose.model('Settings', settingsSchema),
  Social:   mongoose.models.Social   || mongoose.model('Social',   socialSchema),
};
