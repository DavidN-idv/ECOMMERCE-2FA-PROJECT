import rateLimit from 'express-rate-limit';

// Giới hạn cho việc Đăng nhập (Chống Spam)
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 5, // Tối đa 5 request
  skipSuccessfulRequests: true,
  standardHeaders: true, 
  legacyHeaders: false, 
  message: {
    response: {
      data: {
        message: "Bạn đã thử quá nhiều lần. Vui lòng thử lại sau 15 phút."
      }
    }
  }
});

// Giới hạn cho việc Gửi OTP (Chống Spam Mail/SMS)
export const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 giờ
  max: 3, // Tối đa 3 request
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    response: {
      data: {
        message: "Bạn đã yêu cầu gửi OTP quá nhiều lần. Vui lòng đợi 1 giờ sau."
      }
    }
  }
});