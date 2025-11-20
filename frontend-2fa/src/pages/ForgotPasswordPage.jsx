//src/pages/ForgotPasswordPage.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/AuthPages.css";
// Giả sử bạn import authService từ đây
import authService from "./../services/authService"; 

// --- CÁC HÀM CHẤM ĐIỂM MẬT KHẨU ---

function estimateEntropy(s) {
  let charset = 0;
  if (/[a-z]/.test(s)) charset += 26;
  if (/[A-Z]/.test(s)) charset += 26;
  if (/[0-9]/.test(s)) charset += 10;
  if (/[^\w\s]/.test(s)) charset += 33;
  if (!charset || !s.length) return 0;
  return Math.round(s.length * Math.log2(charset));
}

function includesEmailLocal(pwVal, emailVal) {
  const local = (emailVal.split("@")[0] || "").toLowerCase();
  return local && local.length >= 3 && pwVal.toLowerCase().includes(local);
}

function score(pwVal, emailVal) {
  let sc = 0;
  if (!pwVal) {
    return {
      score: 0, label: "—", percent: 0, entropy: 0,
      flags: { len: false, lower: false, upper: false, digit: false, symbol: false, email: true }
    };
  }
  const L = pwVal.length;
  const hasLower = /[a-z]/.test(pwVal),
    hasUpper = /[A-Z]/.test(pwVal),
    hasDigit = /[0-9]/.test(pwVal),
    hasSymbol = /[^\w\s]/.test(pwVal);

  if (L >= 8) sc++;
  if (L >= 12) sc++;
  const variety = [hasLower, hasUpper, hasDigit, hasSymbol].filter(Boolean).length;
  if (variety >= 2) sc++;
  if (variety >= 3) sc++;
  if (variety === 4) sc++;

  if (/(.)\1{2,}/.test(pwVal)) sc--;
  if (includesEmailLocal(pwVal, emailVal)) sc--;
  const common = ["password", "123456", "qwerty", "admin", "12345678"];
  if (common.includes(pwVal.toLowerCase())) sc -= 2;

  sc = Math.max(0, Math.min(5, sc));
  const labels = ["Rất yếu", "Yếu", "Trung bình", "Khá", "Mạnh"];
  if (sc === 5 && L >= 16) {
    labels[5] = "Rất mạnh";
  } else if (sc === 5) {
    labels[5] = "Mạnh";
  }
  
  const perc = [0, 20, 40, 60, 80, 100];
  
  return {
    score: sc,
    label: labels[sc],
    percent: perc[sc],
    entropy: estimateEntropy(pwVal),
    flags: {
      len: L >= 8,
      lower: hasLower,
      upper: hasUpper,
      digit: hasDigit,
      symbol: hasSymbol,
      email: !includesEmailLocal(pwVal, emailVal),
    },
  };
}

// HÀM KIỂM TRA EMAIL HỢP LỆ
const isValidEmail = (email) => {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(String(email).toLowerCase());
};

// --- COMPONENT CHÍNH ---
const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const navigate = useNavigate();
  
  const [isPasswordInfoVisible, setIsPasswordInfoVisible] = useState(false);

  const s = score(newPassword, email);

  const canSubmitStep2 = 
    otp.length > 0 &&
    newPassword === confirmPassword &&
    s.score >= 4; 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (!otpSent) {
      // --- BƯỚC 1: GỬI EMAIL ĐỂ LẤY OTP ---
      
      // KIỂM TRA EMAIL HỢP LỆ TRƯỚC KHI GỬI API
      if (!isValidEmail(email)) {
        setError("Vui lòng nhập email của bạn");
        setLoading(false); 
        return; 
      }

      try {
        const response = await authService.requestPasswordReset(email);
        setSuccessMessage(response.data.message); // Sửa: Lấy từ data
        setOtpSent(true); 
      } catch (err) {
        setError(err.response?.data?.message || "Đã xảy ra lỗi. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    } else {
      // --- BƯỚC 2: XÁC THỰC OTP VÀ ĐẶT MẬT KHẨU MỚI ---
      
      if (newPassword !== confirmPassword) {
        setError("Mật khẩu nhập lại không khớp!");
        setLoading(false);
        return;
      }
      if (s.score < 4) { 
        setError("Mật khẩu mới quá yếu. Vui lòng chọn mật khẩu mạnh hơn.");
        setLoading(false);
        return;
      }
      
      try {
        const response = await authService.resetPassword(email, otp, newPassword);
        setSuccessMessage(response.data.message + " Bạn sẽ được chuyển về trang Đăng nhập."); 
        
        setTimeout(() => {
          navigate("/login");
        }, 2000);

      } catch (err) {
        setError(err.response?.data?.message || err.message); 
      } finally {
        setLoading(false);
      }
    }
  };

  const handleChangeEmail = () => {
    setOtpSent(false);
    setSuccessMessage(null);
    setError(null);
    setEmail(""); 
  };
  
  const handlePasswordSectionBlur = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsPasswordInfoVisible(false);
    }
  };

  return (
    <div className="forgot-container">
      <div className="forgot-card">
        <h2 className="forgot-title">
          {otpSent ? "Đặt lại mật khẩu" : "Quên mật khẩu"}
        </h2>
        <p className="forgot-subtitle">
          {otpSent
            ? `Một mã OTP đã được gửi đến ${email}. Vui lòng nhập mã đó.`
            : "Nhập email đã đăng ký để nhận mã OTP."}
        </p>

        <form onSubmit={handleSubmit} className="forgot-form">
          {/* HIỂN THỊ Ô EMAIL (BƯỚC 1) */}
          {!otpSent && (
            <div className="form-step-enter">
              <label htmlFor="email" className="forgot-label">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="forgot-input"
                placeholder="example@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
          )}

          {/* HIỂN THỊ CÁC Ô OTP & MẬT KHẨU (BƯỚC 2) */}
          {otpSent && (
            <div className="form-step-enter">
              <label htmlFor="otp" className="forgot-label">
                Mã OTP
              </label>
              <input
                id="otp"
                type="text"
                className="forgot-input"
                placeholder="Nhập mã OTP (654321)"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                disabled={loading}
              />
              
              <label htmlFor="newPassword" className="forgot-label">
                Mật khẩu mới
              </label>
              
              <div 
                className="password-section-wrapper"
                onBlur={handlePasswordSectionBlur}
              >
                <input
                  id="newPassword"
                  type="password"
                  className="forgot-input"
                  placeholder="Nhập mật khẩu mới"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onFocus={() => setIsPasswordInfoVisible(true)} 
                  disabled={loading}
                />
                
                {/* Popover thông tin mật khẩu */}
                {isPasswordInfoVisible && (
                  <div className="password-info-popover">
                    <div className="meter-wrap">
                      <div className="meter" style={{ width: `${s.percent}%` }}></div>
                    </div>
                    <div className="info">
                      <span>Độ mạnh: {s.label}</span>
                    </div>

                    <ul className="tips">
                      <li className={s.flags.len ? 'ok' : ''}>
                        <span className="dot"></span> Tối thiểu 8 ký tự
                      </li>
                      <li className={s.flags.lower ? 'ok' : ''}>
                        <span className="dot"></span> Có chữ thường
                      </li>
                      <li className={s.flags.upper ? 'ok' : ''}>
                        <span className="dot"></span> Có chữ hoa
                      </li>
                      <li className={s.flags.digit ? 'ok' : ''}>
                        <span className="dot"></span> Có số
                      </li>
                      <li className={s.flags.symbol ? 'ok' : ''}>
                        <span className="dot"></span> Có ký tự đặc biệt
                      </li>
                      <li className={s.flags.email ? 'ok' : (s.flags.email === false ? 'warn' : '')}>
                        <span className="dot"></span> Không chứa email
                      </li>
                    </ul>
                  </div>
                )}
              </div> 
              {/* Hết phần Popover */}

              <label htmlFor="confirmPassword" className="forgot-label">
                Xác nhận mật khẩu
              </label>
              <input
                id="confirmPassword"
                type="password"
                className="forgot-input"
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          )}
          
          <button 
            type="submit" 
            className="forgot-btn" 
            disabled={loading || (otpSent && !canSubmitStep2)}
          >
            {loading ? "Đang xử lý..." : (otpSent ? "Xác nhận & Đổi mật khẩu" : "Gửi mã OTP")}
          </button>

          {error && <p className="forgot-message error">{error}</p>}
          {successMessage && <p className="forgot-message success">{successMessage}</p>}
        </form>

        <div className="forgot-back">
          {otpSent ? (
            <a href="#" onClick={handleChangeEmail}>← Quay lại (nhập email khác)</a>
          ) : (
            <Link to="/login">← Quay lại đăng nhập</Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;