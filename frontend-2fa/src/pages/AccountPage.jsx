// src/pages/AccountPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';
import { useNavigate } from 'react-router-dom';
import ChangePassword from './ChangePassword';
import '../styles/AccountPage.css';

const AccountPage = () => {
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();
  
  const [is2faEnabled, setIs2faEnabled] = useState(user?.is_2fa_enabled || false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  useEffect(() => {
    if (user) {
      setIs2faEnabled(user.is_2fa_enabled);
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    // navigate('/login'); // logout trong Context đã tự navigate rồi
  };

  const handleToggle2FA = async () => {
    setMessage('');
    setError('');

    if (is2faEnabled) {
      setShowPasswordInput(true);
      setShowOtpInput(false); 
    } else {
      setLoading(true);
      try {
        const response = await authService.enable2FARequest();
        setMessage(response.data.message);
        setShowOtpInput(true); 
        setShowPasswordInput(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Lỗi');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleConfirmEnable = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await authService.enable2FAConfirm(otp);
      setMessage(response.data.message); 
      setIs2faEnabled(true); 
      setShowOtpInput(false); 
      setOtp('');
      setUser({ ...user, is_2fa_enabled: true }); 
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Lỗi');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDisable = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await authService.disable2FA(password);
      setMessage(response.data.message); 
      setIs2faEnabled(false); 
      setShowPasswordInput(false); 
      setPassword('');
      setUser({ ...user, is_2fa_enabled: false });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Lỗi');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="account-container">
      <div className="account-wrapper">
        {/* Header */}
        <div className="account-header">
          <div className="user-info">
            <div className="user-avatar">{user?.username?.[0]?.toUpperCase() || 'U'}</div>
            <div>
              <h1 className="user-name">{user?.username || user?.email || 'Bạn'}</h1>
              <p className="user-email">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-btn">Đăng xuất</button>
        </div>

        {/* 2FA Section */}
        <div className="account-section">
          <h2 className="section-title">Xác thực hai yếu tố</h2>
          <div className="twofa-card">
            <div className="twofa-status">
              <span className={`status-badge ${is2faEnabled ? 'enabled' : 'disabled'}`}>
                {is2faEnabled ? 'ĐANG BẬT' : 'ĐÃ TẮT'}
              </span>
              <p className="status-text">
                {is2faEnabled 
                  ? 'Tài khoản của bạn đang được bảo vệ tối đa.'
                  : 'Kích hoạt để bảo vệ tài khoản ngay cả khi lộ mật khẩu.'}
              </p>
            </div>
            <button 
              onClick={handleToggle2FA} 
              className={`toggle-btn ${is2faEnabled ? 'disable' : 'enable'}`}
              disabled={loading}
            >
              {loading ? 'Đang xử lý...' : (is2faEnabled ? 'Tắt' : 'Bật')}
            </button>
          </div>

          {message && <div className="alert alert-success">{message}</div>}
          {error && <div className="alert alert-error">{error}</div>}

          {/* OTP Input Form */}
          {showOtpInput && (
            <form onSubmit={handleConfirmEnable} className="confirm-form">
              <p className="form-label">Một mã OTP đã được gửi đến email của bạn</p>
              <input
                type="text"
                placeholder="Nhập mã OTP (Mock: 123456)"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="otp-input"
                disabled={loading}
                required
              />
              <button type="submit" className="confirm-btn" disabled={loading || otp.length !== 6}>
                {loading ? 'Đang xác nhận...' : 'Xác nhận Bật'}
              </button>
            </form>
          )}

          {/* Password Input Form */}
          {showPasswordInput && (
            <form onSubmit={handleConfirmDisable} className="confirm-form">
              <p className="form-label">Nhập mật khẩu để xác nhận tắt 2FA</p>
              <input
                type="password"
                placeholder="Nhập mật khẩu (Mock: 123)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="password-input"
                disabled={loading}
                required
              />
              <button type="submit" className="confirm-btn" disabled={loading || !password}>
                {loading ? 'Đang xác nhận...' : 'Xác nhận Tắt'}
              </button>
            </form>
          )}
        </div>

        {/* Password Change Section */}
        <div className="account-section">
          <h2 className="section-title">🔑 Đổi Mật Khẩu</h2>
          
          {/* Card điều khiển (giống style của 2FA) */}
          <div className="twofa-card">
            <div className="twofa-status">
              <p className="status-text">
                {showChangePassword 
                  ? 'Vui lòng nhập thông tin bên dưới để đổi mật khẩu.' 
                  : 'Cập nhật mật khẩu thường xuyên để bảo vệ tài khoản.'}
              </p>
            </div>
            <button 
              onClick={() => setShowChangePassword(!showChangePassword)} 
              className={`toggle-btn ${showChangePassword ? 'disable' : 'enable'}`}
            >
              {showChangePassword ? 'Hủy bỏ' : 'Thay đổi'}
            </button>
          </div>

          {/* Chỉ hiển thị Form khi showChangePassword = true */}
          {showChangePassword && (
            <div style={{ marginTop: '20px', animation: 'fadeIn 0.3s ease' }}>
              <ChangePassword />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountPage;