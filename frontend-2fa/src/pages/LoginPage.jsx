// src/pages/LoginPage.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom"; 
import "./../styles/AuthPages.css";
import { useAuth } from "../context/AuthContext"; 

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] =useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); 

  //const navigate = useNavigate(); 
  const { login } = useAuth(); 

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setLoading(true); 
    setError(null); 

    try {
      await login(email, password);

    } catch (err) {
      console.error("Lỗi đăng nhập:", err.message);
      setError(err.message); 
    } finally {
      setLoading(false); 
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1 className="auth-title">Đăng nhập</h1>
        <p className="auth-subtitle">Chào mừng bạn quay lại My Beauty</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          
          {/* Hiển thị lỗi nếu có */}
          {error && <p className="auth-error">{error}</p>}

          <input
            type="email"
            className="auth-input"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading} 
          />
          <div className="auth-input-wrapper">
            <input
              type={showPassword ? "text" : "password"} 
              className="auth-input"
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading} 
              style={{ paddingRight: '40px' }} 
            />
            
            <button 
              type="button" 
              className="icon-btn" 
              onClick={() => setShowPassword(!showPassword)}
              onMouseDown={(e) => e.preventDefault()} 
              tabIndex="-1"
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>
          
          {/* Thay đổi text và trạng thái button khi loading */}
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
          </p>
          <Link to="/forgot-password" className="back-link">
            Quên mật khẩu?
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;