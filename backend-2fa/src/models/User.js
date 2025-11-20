import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    //required: true,
    default: '', // Để mặc định rỗng
    sparse: true, //1 sđt chỉ được dùng cho 1 acc
  },
  avatar: {
    type: String,
    // placeholder
    default: 'https://cdn-icons-png.flaticon.com/512/149/149071.png'
  },
  is2FAEnabled: {
    type: Boolean,
    default: false 
  },
}, {
  timestamps: true // Tự động tạo createdAt và updatedAt
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;