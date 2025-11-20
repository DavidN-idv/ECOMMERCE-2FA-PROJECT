//context/AuthContext.jsx
import React, { createContext, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/authService";


const AuthContext = createContext();
//eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

// AUTH PROVIDER
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("user");
      return savedUser && savedUser !== "undefined" ? JSON.parse(savedUser) : null;
    } catch (error) {
      console.error("Lỗi parse user từ localStorage:", error);
      return null;
    }
  });
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const navigate = useNavigate(); // 5. KHỞI TẠO NAVIGATE

  // TẠO HÀM NỘI BỘ ĐỂ XỬ LÝ ĐĂNG NHẬP THÀNH CÔNG
  const loginSuccess = (data, successMessage = null) => {
    setUser(data.user);
    setToken(data.accessToken);
    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("token", data.accessToken);

    // Store refresh token if provided (for token refresh flow)
    // if (data.refreshToken) {
    //   localStorage.setItem("refreshToken", data.refreshToken);
    // }

    if (successMessage) alert(successMessage);
    // Điều hướng về trang chủ/tài khoản (replace: true để không "Back" lại được)
    navigate("/", { replace: true });
  };

  // HÀM LOGIN
  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      const data = response.data.data;

      if (data.requires2FA) {
        // Nếu cần 2FA, điều hướng và truyền userId + email (để hiển thị)
        navigate('/verify-otp', { state: { userId: data.userId, email: email } });
      } else {
        loginSuccess(data);
      }
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi đăng nhập');
    }
  };

  // HÀM REGISTER (ĐIỀU HƯỚNG)
  const register = async (email, password, name, phone) => {
    try {
      await authService.register(email, password, name, phone);
      // Đăng ký xong, chuyển sang xác thực email
      navigate(`/verify-otp?email=${email}`);
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi đăng ký');
    }
  };

  // HÀM VERIFY EMAIL (DÙNG CHO ĐĂNG KÝ)
  const verifyOtp = async (email, otp) => {
    try {
      // Dùng hàm mock 'verifyEmailOtp'
      await authService.verifyEmailOtp(email, otp);
      navigate('/login');
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi xác thực OTP');
    }
  };

  // HÀM RESET PASSWORD
  const resetPassword = async (email, otp, newPassword) => {
    try {
      const response = await authService.resetPassword(email, otp, newPassword);
      alert(response.data.message); // Hiển thị thông báo thành công
      navigate('/login');
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi đặt lại mật khẩu');
    }
  };

  // HÀM REQUEST RESET
  const requestPasswordReset = async (email) => {
    try {
      // Hàm này chỉ gọi, không điều hướng
      return await authService.requestPasswordReset(email);
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi gửi email');
    }
  };

  // HÀM LOGOUT
  const logout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      console.error(e);
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    //localStorage.removeItem("refreshToken"); // Clear refresh token too
    navigate('/login'); // Đăng xuất thì bay về login
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser, // <-- ĐÃ THÊM ĐỂ ACCOUNT PAGE SỬ DỤNG
        token,
        isAuthenticated: !!token,
        login,
        register,
        verifyOtp, // Dùng cho Đăng ký
        logout,
        requestPasswordReset,
        resetPassword,
        loginSuccess // Dùng cho VerifyOtpPage (luồng 2FA)
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};