//src/pages/ChangePassword.jsx
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
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPasswordInfoVisible, setIsPasswordInfoVisible] = useState(false);
  
  // (Pass email rỗng vì không cần)
  const s = score(newPassword, ""); 

  const canSubmit = 
    oldPassword.length > 0 &&
    newPassword === confirmPassword &&
    s.score >= 4; // Mật khẩu phải mạnh

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
      setMessage(response.data.message);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsPasswordInfoVisible(false); 
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handlePasswordSectionBlur = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsPasswordInfoVisible(false);
    }
  };

  return (
    <div className="change-password-form">
      <h3>Đổi Mật Khẩu</h3>
      <form onSubmit={handleSubmit}>
        <div>
          <input
            className="auth-input"
            type="password"
            placeholder="Mật khẩu cũ (Mock: 123)"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        
        <div className="password-section-wrapper">
          <input
            className="auth-input"
            type="password"
            placeholder="Mật khẩu mới"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            onFocus={() => setIsPasswordInfoVisible(true)} 
            required
            disabled={loading}
          />
          
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

        <div>
          <input
            className="auth-input"
            type="password"
            placeholder="Xác nhận mật khẩu mới"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        
        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}
        
        <button 
          type="submit" 
          disabled={loading || !canSubmit}
        >
          {loading ? 'Đang xử lý...' : 'Đổi Mật Khẩu'}
        </button>
      </form>
    </div>
  );
};

export default ChangePassword;