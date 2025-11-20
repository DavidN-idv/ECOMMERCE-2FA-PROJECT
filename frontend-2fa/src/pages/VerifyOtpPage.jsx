// src/pages/VerifyOtpPage.jsx
import React, { useState } from "react";
// 1. Import thêm useLocation
import { useSearchParams, useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
// 2. Import unified authService (mock or real)
import authService from "../services/authService"; 

const VerifyOtpPage = () => {
  const { 
    user,
    verifyOtp,      // Hàm này từ Context (dùng cho xác thực email)
    loginSuccess    // Hàm này từ Context (dùng để hoàn tất đăng nhập 2FA)
  } = useAuth();
  
  const navigate = useNavigate();
  
  // 3. Lấy cả hai nguồn dữ liệu
  const [searchParams] = useSearchParams();
  const location = useLocation();

  // 4. KIỂM TRA XEM ĐANG Ở CHẾ ĐỘ NÀO
  
  // Chế độ 1: Xác thực Email (lấy từ URL)
  const emailForVerification = searchParams.get("email"); 
  
  // Chế độ 2: Đăng nhập 2FA (lấy từ state điều hướng)
  const userIdFor2FA = location.state?.userId;

  // Quyết định chế độ
  const is2FAMode = !!userIdFor2FA; // true nếu là đăng nhập 2FA
  const emailToShow = emailForVerification || location.state?.email || user?.email || "";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (is2FAMode) {
      // --- LUỒNG 1: ĐĂNG NHẬP 2FA ---
      try {
        // Gọi thẳng authService (vì Context chưa cung cấp)
        const response = await authService.verify2FA(userIdFor2FA, otp);
        
        // Đăng nhập thành công!
        // Gọi hàm loginSuccess từ Context để lưu token và điều hướng
        loginSuccess(response.data); 
        
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }

    } else {
      // --- LUỒNG 2: XÁC THỰC EMAIL (Sau khi đăng ký) ---
      try {
        await authService.verifyEmailOtp(emailForVerification, otp);
        alert("Xác thực email thành công! Bạn có thể đăng nhập.");
        navigate("/login");
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="auth-container"> {/* Sử dụng class từ AuthPages.css */}
      <div className="auth-box">
        <h1 className="auth-title">Xác thực OTP</h1>
        <p className="auth-subtitle">
          {is2FAMode 
            ? `Một mã 2FA đã được gửi đến email của bạn.`
            : `Một mã OTP đã được gửi đến email: ${emailToShow}`
          }
        </p>

        {error && <p className="auth-error">{error}</p>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            type="text"
            className="auth-input"
            placeholder={is2FAMode ? "Nhập mã 2FA (Mock: 123456)" : "Nhập mã OTP (Mock: 111111)"}
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
            disabled={loading}
            maxLength={6}
          />
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "Đang xác thực..." : "Xác thực"}
          </button>
        </form>
        
        <div className="auth-footer">
          <Link to="/login" className="back-link">
            ← Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtpPage;