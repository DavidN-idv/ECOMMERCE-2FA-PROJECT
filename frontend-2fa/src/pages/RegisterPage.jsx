// src/pages/RegisterPage.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./../styles/AuthPages.css";
import { useAuth } from "../context/AuthContext"; // Use unified authService via context

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
const RegisterPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordInfoVisible, setIsPasswordInfoVisible] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // (Loại bỏ state toast)

  //const navigate = useNavigate();
  const { register: registerUser } = useAuth(); // Get register function from AuthContext

  // (Loại bỏ useEffect của toast)
  useEffect(() => {
    if (error) setTimeout(() => setError(null), 4000);
  }, [error]);

  const s = score(password, email);
  
  const canSubmit = s.score >= 4 &&
                    isValidEmail(email) &&
                    name.length > 0 &&
                    password === confirmPassword &&
                    password.length > 0;

  // (Loại bỏ handleGenerate và handleCopy)
  
  const handlePasswordSectionBlur = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsPasswordInfoVisible(false);
    }
  };

const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) {
       setError("Vui lòng điền đầy đủ và đảm bảo mật khẩu đủ mạnh.");
       return;
    }
    setError(null);
    setLoading(true);

    try {
      await registerUser(email, password, name);
      // Note: registerUser() handles navigation to /verify-otp via AuthContext
    } catch (err) {
      console.error("Lỗi đăng ký:", err.message);
      setError(err.response?.data?.message || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1 className="auth-title">Đăng ký</h1>
        <p className="auth-subtitle">Tạo tài khoản mới bắt đầu</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          
          {error && <p className="auth-error">{error}</p>}
          {/* (Loại bỏ toast) */}

          <input
            type="text" className="auth-input" placeholder="Họ và tên"
            value={name} onChange={(e) => setName(e.target.value)}
            required disabled={loading}
          />
          <input
            type="email" className="auth-input" placeholder="Email"
            value={email} onChange={(e) => setEmail(e.target.value)}
            required disabled={loading}
            //pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
            title="Vui lòng nhập email đúng định dạng (ví dụ: user@domain.com)"
          />
          
          {/* Bọc phần mật khẩu và popover */}
          <div 
            className="password-section-wrapper"
            onBlur={handlePasswordSectionBlur}
          >
            <div className="auth-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                className="auth-input" 
                placeholder="Mật khẩu"
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setIsPasswordInfoVisible(true)}
                required minLength={8} disabled={loading}
              />
              <button 
                type="button" 
                className="icon-btn" 
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Hiện/ẩn mật khẩu"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>

            {/* Popover thông tin mật khẩu (hiển thị có điều kiện) */}
            {isPasswordInfoVisible && (
              <div className="password-info-popover">
                
                {/* (Loại bỏ auth-row) */}

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
          {/* Hết .password-section-wrapper */}

          <input
            type={showPassword ? "text" : "password"}
            className="auth-input" 
            placeholder="Nhập lại mật khẩu"
            value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)}
            required disabled={loading}
          />

          <button type="submit" className="auth-btn" disabled={loading || !canSubmit}>
            {loading ? "Đang xử lý..." : "Đăng ký"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;