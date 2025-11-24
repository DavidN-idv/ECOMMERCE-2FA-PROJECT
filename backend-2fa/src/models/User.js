import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
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
    unique: true,
    sparse: true, //1 sđt chỉ được dùng cho 1 acc
    set: v => {
      if (!v) return undefined;              // nếu null/undefined thì bỏ
      const trimmed = v.trim();              // loại bỏ khoảng trắng
      return trimmed === "" ? undefined : trimmed;
    },
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

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;