// src/pages/VerifyOtpPage.jsx
import React, { useState } from "react";
import { useSearchParams, useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import authService from "../services/authService"; 

const VerifyOtpPage = () => {
  const { 
    user,
    loginSuccess    
  } = useAuth();
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  // Lấy thông tin
  const emailForVerification = searchParams.get("email"); 
  const userIdFor2FA = location.state?.userId;

  // Quyết định chế độ
  const is2FAMode = !!userIdFor2FA; 
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
        const response = await authService.verify2FA(userIdFor2FA, otp);
        
        // --- SỬA LỖI TẠI ĐÂY ---
        // Bóc tách dữ liệu từ wrapper { data: { ... } } của Backend
        const responseData = response.data;
        const payload = responseData.data || responseData; 
        
        // Lưu token và chuyển hướng
        loginSuccess(payload); 
        
      } catch (err) {
        const msg = err.response?.data?.response?.data?.message || err.response?.data?.message || err.message;
        setError(msg);
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
        const msg = err.response?.data?.response?.data?.message || err.response?.data?.message || err.message;
        setError(msg);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="auth-container">
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
            placeholder={is2FAMode ? "Nhập mã 2FA" : "Nhập mã OTP"}
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