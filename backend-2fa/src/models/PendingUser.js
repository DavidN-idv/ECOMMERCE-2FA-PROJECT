import mongoose from 'mongoose';

const pendingUserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true }, // Mật khẩu đã được hash từ Controller
  phone: { type: String },
  otpCode: { type: String, required: true },
  createdAt: { 
    type: Date, 
    default: Date.now, 
    expires: 600 // ự động xóa sau 600 giây (10 phút)
  }
});

const PendingUser = mongoose.model('PendingUser', pendingUserSchema);
export default PendingUser;