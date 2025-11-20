// src/pages/LoginPage.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom"; // 1. Import useNavigate
import "./../styles/AuthPages.css";
import { useAuth } from "../context/AuthContext"; // Import useAuth from AuthContext

const LoginPage = () => {
  // 3. Thêm state cho email và password
  const [email, setEmail] = useState("");
  const [password, setPassword] =useState("");
  
  // 4. Thêm state cho loading và error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // Sẽ lưu nội dung lỗi

  //const navigate = useNavigate(); // 5. Khởi tạo hook navigate
  const { login } = useAuth(); // Sử dụng login từ AuthContext

  // 6. Cập nhật handleSubmit thành async
  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setLoading(true); // Bắt đầu loading
    setError(null); // Xóa lỗi cũ

    try {
      // 7. Gọi login từ AuthContext
      await login(email, password);

    } catch (err) {
      // 8. Xử lý khi API ném ra lỗi
      console.error("Lỗi đăng nhập:", err.message);
      setError(err.message); // Hiển thị lỗi cho người dùng

    } finally {
      // 9. Luôn tắt loading sau khi API chạy xong (dù thành công hay lỗi)
      setLoading(false); 
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1 className="auth-title">Đăng nhập</h1>
        <p className="auth-subtitle">Chào mừng bạn quay lại My Beauty</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          
          {/* 10. Hiển thị lỗi nếu có */}
          {error && <p className="auth-error">{error}</p>}

          <input
            type="email"
            className="auth-input"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading} // 11. Vô hiệu hóa khi đang loading
          />
          <input
            type="password"
            className="auth-input"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading} // 11. Vô hiệu hóa khi đang loading
          />
          
          {/* 12. Thay đổi text và trạng thái button khi loading */}
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