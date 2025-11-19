import jwt from 'jsonwebtoken';

const generateToken = (res, userId) => {
  // 1. Tạo Access Token (Ngắn hạn: 15 phút)
  const accessToken = jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: '15m', 
  });

  // 2. Tạo Refresh Token (Dài hạn: 30 ngày)
  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '30d',
  });

  // 3. Gắn Refresh Token vào HTTPOnly Cookie
  res.cookie('jwt', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development', 
    sameSite: 'strict', // Chống tấn công CSRF
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 ngày (tính bằng mili giây)
  });

  return accessToken;
};

export default generateToken;