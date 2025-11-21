// src/pages/ForgotPasswordPage.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/AuthPages.css";
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // State hiển thị popover độ mạnh
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
      // BƯỚC 1: Gửi OTP
      if (!isValidEmail(email)) {
        setError("Vui lòng nhập email đúng định dạng");
        setLoading(false);
        return;
      }
      try {
        const response = await authService.requestPasswordReset(email);
        setSuccessMessage(response.data.data?.message || response.data.message);
        setOtpSent(true);
      } catch (err) {
        const msg = err.response?.data?.response?.data?.message || err.response?.data?.message || "Lỗi gửi email";
        setError(msg);
      } finally {
        setLoading(false);
      }
    } else {
      // BƯỚC 2: Reset Password
      if (newPassword !== confirmPassword) {
        setError("Mật khẩu nhập lại không khớp!");
        setLoading(false);
        return;
      }
      if (s.score < 4) {
        setError("Mật khẩu mới quá yếu.");
        setLoading(false);
        return;
      }

      try {
        const response = await authService.resetPassword(email, otp, newPassword);
        setSuccessMessage((response.data.data?.message || "Thành công") + " Đang chuyển hướng...");
        setTimeout(() => navigate("/login"), 2000);
      } catch (err) {
        const msg = err.response?.data?.response?.data?.message || err.response?.data?.message || "Lỗi đặt lại mật khẩu";
        setError(msg);
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

  // Xử lý khi blur khỏi vùng password
  const handlePasswordSectionBlur = (e) => {
    if (e.currentTarget.contains(e.relatedTarget)) {
      return;
    }
    setIsPasswordInfoVisible(false);
  };

  return (
    <div className="forgot-container">
      <div className="forgot-card">
        <h2 className="forgot-title">
          {otpSent ? "Đặt lại mật khẩu" : "Quên mật khẩu"}
        </h2>
        <p className="forgot-subtitle">
          {otpSent
            ? `OTP đã gửi đến ${email}.`
            : "Nhập email đã đăng ký để nhận mã OTP."}
        </p>

        <form onSubmit={handleSubmit} className="forgot-form">

          {/*  EMAIL */}
          {!otpSent && (
            <div className="form-step-enter">
              <label htmlFor="email" className="forgot-label">Email</label>
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

          {/*  OTP & PASS */}
          {otpSent && (
            <div className="form-step-enter">
              <label htmlFor="otp" className="forgot-label">Mã OTP</label>
              <input
                id="otp"
                type="text"
                className="forgot-input"
                placeholder="Nhập mã OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                disabled={loading}
              />

              <label htmlFor="newPassword" className="forgot-label">Mật khẩu mới</label>

              <div
                className="password-section-wrapper"
                onBlur={handlePasswordSectionBlur}
              >
                <div className="auth-input-wrapper">
                  <input
                    id="newPassword"
                    type={showPassword ? "text" : "password"} // Toggle type
                    className="forgot-input"
                    placeholder="Nhập mật khẩu mới"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    onFocus={() => setIsPasswordInfoVisible(true)}
                    disabled={loading}
                    style={{ paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>

                {/* KHỐI POPOVER (Chỉ hiện khi focus) */}
                {isPasswordInfoVisible && (
                  <div className="password-info-popover">
                    <div className="meter-wrap">
                      <div className="meter" style={{ width: `${s.percent}%` }}></div>
                    </div>
                    <div className="info">
                      <span>Độ mạnh: {s.label}</span>
                    </div>
                    <ul className="tips">
                      <li className={s.flags.len ? 'ok' : ''}><span className="dot"></span> 8+ ký tự</li>
                      <li className={s.flags.lower ? 'ok' : ''}><span className="dot"></span> Chữ thường</li>
                      <li className={s.flags.upper ? 'ok' : ''}><span className="dot"></span> Chữ hoa</li>
                      <li className={s.flags.digit ? 'ok' : ''}><span className="dot"></span> Số</li>
                      <li className={s.flags.symbol ? 'ok' : ''}><span className="dot"></span> Ký tự đặc biệt</li>
                    </ul>
                  </div>
                )}
              </div>

              <label htmlFor="confirmPassword" className="forgot-label">Xác nhận mật khẩu</label>
              <div className="auth-input-wrapper">
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  className="forgot-input"
                  placeholder="Nhập lại mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                />
                {confirmPassword.length > 0 && (
                  <span
                    className={`validation-icon ${newPassword === confirmPassword ? 'valid' : 'invalid'}`}
                  >
                    {newPassword === confirmPassword ? '✔' : '✖'}
                  </span>
                )}
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  onMouseDown={(e) => e.preventDefault()} // Ngăn mất focus
                  tabIndex="-1"
                >
                  {showConfirmPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="forgot-btn"
            disabled={loading || (otpSent && !canSubmitStep2)}
          >
            {loading ? "Đang xử lý..." : (otpSent ? "Đổi mật khẩu" : "Gửi mã OTP")}
          </button>

          {error && <p className="forgot-message error">{error}</p>}
          {successMessage && <p className="forgot-message success">{successMessage}</p>}
        </form>

        <div className="forgot-back">
          {otpSent ? (
            <a href="#" onClick={handleChangeEmail}>← Nhập email khác</a>
          ) : (
            <Link to="/login">← Quay lại đăng nhập</Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;