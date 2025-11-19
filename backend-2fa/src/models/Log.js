import mongoose from 'mongoose';

const logSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true }, // 'LOGIN_SUCCESS', 'LOGIN_FAILED'
  ip: String,
  userAgent: String, 
  timestamp: { type: Date, default: Date.now }
});

const Log = mongoose.model('Log', logSchema);
export default Log;