// src/pages/ChangePassword.jsx
import React, { useState } from 'react';
import authService from "./../services/authService";
import "../styles/AuthPages.css";

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

// --- COMPONENT CHÍNH ---
const ChangePassword = () => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // State ẩn/hiện cho từng ô input
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPasswordInfoVisible, setIsPasswordInfoVisible] = useState(false);

  const s = score(newPassword, "");

  const canSubmit =
    oldPassword.length > 0 &&
    newPassword === confirmPassword &&
    s.score >= 4;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu mới không khớp!');
      setLoading(false);
      return;
    }
    if (s.score < 4) {
      setError('Mật khẩu mới quá yếu, vui lòng chọn mật khẩu mạnh hơn.');
      setLoading(false);
      return;
    }

    try {
      const response = await authService.changePassword(oldPassword, newPassword);

      const msg = response.data?.data?.message || response.data?.message || "Đổi mật khẩu thành công!";

      setMessage(msg);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsPasswordInfoVisible(false);

    } catch (err) {
      const msg = err.response?.data?.response?.data?.message ||
        err.response?.data?.message ||
        err.message ||
        "Lỗi không xác định";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSectionBlur = (e) => {
    if (e.currentTarget.contains(e.relatedTarget)) {
      return;
    }
    setIsPasswordInfoVisible(false);
  };

  return (
    <div className="change-password-form">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>

        {/* --- Ô MẬT KHẨU CŨ --- */}
        <div className="auth-input-wrapper">
          <input
            className="auth-input"
            type={showOldPass ? "text" : "password"}
            placeholder="Mật khẩu cũ"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            required
            disabled={loading}
            style={{ paddingRight: '40px' }}
          />
          <button
            type="button"
            className="icon-btn"
            onClick={() => setShowOldPass(!showOldPass)}
            onMouseDown={(e) => e.preventDefault()}
            tabIndex="-1"
          >
            {showOldPass ? "🙈" : "👁️"}
          </button>
        </div>

        {/* --- Ô MẬT KHẨU MỚI --- */}
        <div
          className="password-section-wrapper"
          onBlur={handlePasswordSectionBlur}
        >
          <div className="auth-input-wrapper">
            <input
              className="auth-input"
              type={showNewPass ? "text" : "password"}
              placeholder="Mật khẩu mới"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              onFocus={() => setIsPasswordInfoVisible(true)}
              required
              disabled={loading}
              style={{ paddingRight: '40px' }}
            />
            <button
              type="button"
              className="icon-btn"
              onClick={() => setShowNewPass(!showNewPass)}
              onMouseDown={(e) => e.preventDefault()}
              tabIndex="-1"
            >
              {showNewPass ? "🙈" : "👁️"}
            </button>
          </div>

          {/* Popover đánh giá mật khẩu */}
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

        {/* --- Ô XÁC NHẬN MẬT KHẨU --- */}
        <div className="auth-input-wrapper">
          <input
            className="auth-input"
            type={showConfirmPass ? "text" : "password"}
            placeholder="Xác nhận mật khẩu mới"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={loading}
            style={{ paddingRight: '40px' }}
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
            onClick={() => setShowConfirmPass(!showConfirmPass)}
            onMouseDown={(e) => e.preventDefault()}
            tabIndex="-1"
          >
            {showConfirmPass ? "🙈" : "👁️"}
          </button>
        </div>

        {/* Thông báo lỗi/thành công */}
        {message && <div className="forgot-message success">{message}</div>}
        {error && <div className="forgot-message error">{error}</div>}

        <button
          type="submit"
          className="auth-btn"
          disabled={loading || !canSubmit}
          style={{ marginTop: '10px' }}
        >
          {loading ? 'Đang xử lý...' : 'Đổi Mật Khẩu'}
        </button>
      </form>
    </div>
  );
};

export default ChangePassword;