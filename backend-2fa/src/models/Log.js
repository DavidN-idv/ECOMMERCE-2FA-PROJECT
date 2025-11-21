import mongoose from 'mongoose';

const logSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true, // Ví dụ: "LOGIN_SUCCESS", "LOGOUT"
  },
  ip: {
    type: String,
    default: 'Unknown'
  },
  userAgent: {
    type: String, // Lưu thông tin trình duyệt/thiết bị
    default: 'Unknown'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60 * 60 * 24 * 30 // Tự xóa log sau 30 ngày để nhẹ Database
  }
});

const Log = mongoose.model('Log', logSchema);
export default Log;