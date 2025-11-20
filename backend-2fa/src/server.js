import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js'; 
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';

dotenv.config();
connectDB();

const app = express();
const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.error("Blocked by CORS:", origin); // Log ra để dễ debug nếu bị chặn
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true // Cho phép gửi cookie/token
}));
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});