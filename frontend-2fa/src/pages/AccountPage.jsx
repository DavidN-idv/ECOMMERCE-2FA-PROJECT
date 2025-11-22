// src/pages/AccountPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';
//import { useNavigate } from 'react-router-dom';
import ChangePassword from './ChangePassword';
import '../styles/AccountPage.css';
import { getErrorMessage } from '../utils/errorHandler';

const AccountPage = () => {
  const { user, logout, setUser } = useAuth();
  //const navigate = useNavigate();

  const [is2faEnabled, setIs2faEnabled] = useState(user?.is2FAEnabled || false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [logs, setLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);

  useEffect(() => {
    if (user) {
      setIs2faEnabled(user.is2FAEnabled);
    }
  }, [user]);

  useEffect(() => {
    const fetchLogs = async () => {
      if (showLogs && user) {
        try {
          const res = await authService.getLoginHistory();
          setLogs(res.data.data || []);
        } catch (error) {
          console.error("Lỗi lấy log:", error);
        }
      }
    }
    fetchLogs();
  }, [showLogs, user]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage('');
      }, 5000); // 5000ms = 5 giây
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  const getLogBadge = (action) => {
    switch (action) {
      case 'LOGIN_SUCCESS':
      case 'LOGIN_STANDARD':
      case 'LOGIN_2FA':
        return { class: 'success', text: 'Đăng nhập thành công' };
      case 'LOGIN_FAILED':
      case '2FA_FAILED':
        return { class: 'failed', text: 'Đăng nhập thất bại' };
      case 'LOGOUT':
        return { class: 'info', text: 'Đăng xuất' };
      default:
        return { class: 'info', text: action };
    }
  };

  const parseUserAgent = (ua) => {
    if (!ua) return 'Unknown';

    let browser = 'Trình duyệt khác';
    if (ua.indexOf('Firefox') > -1) browser = 'Firefox';
    else if (ua.indexOf('SamsungBrowser') > -1) browser = 'Samsung Internet';
    else if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) browser = 'Opera';
    else if (ua.indexOf('Trident') > -1) browser = 'Internet Explorer';
    else if (ua.indexOf('Edge') > -1) browser = 'Edge';
    else if (ua.indexOf('Chrome') > -1) browser = 'Chrome';
    else if (ua.indexOf('Safari') > -1) browser = 'Safari';

    let os = 'Hệ điều hành khác';
    if (ua.indexOf('Win') > -1) os = 'Windows';
    else if (ua.indexOf('Mac') > -1) os = 'MacOS';
    else if (ua.indexOf('Linux') > -1) os = 'Linux';
    else if (ua.indexOf('Android') > -1) os = 'Android';
    else if (ua.indexOf('like Mac') > -1) os = 'iOS';

    return `${browser} (${os})`;
  };

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
        const msg = response.data.data?.message || response.data.message || "Đã gửi mã OTP";
        setMessage(msg);
        setShowOtpInput(true);
        setShowPasswordInput(false);
      } catch (err) {
        setError(getErrorMessage(err, 'Không thể gửi OTP. Vui lòng thử lại sau.'));
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
      const msg = response.data.data?.message || response.data.message || "Bật 2FA thành công";
      setMessage(msg);
      setIs2faEnabled(true);
      setShowOtpInput(false);
      setOtp('');
      setUser({ ...user, is2FAEnabled: true });
    } catch (err) {
      setError(getErrorMessage(err, "Lỗi khi bật 2FA"));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDisable = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await authService.disable2FA(password);
      const msg = response.data.data?.message || response.data.message || "Tắt 2FA thành công";
      setMessage(msg);
      setIs2faEnabled(false);
      setShowPasswordInput(false);
      setPassword('');
      setUser({ ...user, is2FAEnabled: false });
    } catch (err) {
      setError(getErrorMessage(err, "Lỗi khi tắt 2FA"));
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
                placeholder="Nhập mã OTP"
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
                placeholder="Nhập mật khẩu"
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

        {/* Log Section */}
        <div className="account-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 className="section-title" style={{ marginBottom: 0 }}>📜 Lịch sử hoạt động</h2>

            <button
              onClick={() => setShowLogs(!showLogs)}
              className="toggle-btn enable"
              style={{ padding: '6px 12px', fontSize: '0.85rem' }}
            >
              {showLogs ? 'Ẩn lịch sử' : 'Xem lịch sử'}
            </button>
          </div>

          {showLogs && (
            <>
              <div className="logs-container" style={{ animation: 'fadeIn 0.3s ease' }}>
                {logs.length === 0 ? (
                  <p style={{ color: '#666', fontStyle: 'italic', textAlign: 'center' }}>Đang tải hoặc chưa có dữ liệu...</p>
                ) : (
                  <table className="logs-table">
                    <thead>
                      <tr>
                        <th>Hành động</th>
                        <th>Thời gian</th>
                        <th>IP</th>
                        <th>Thiết bị</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => {
                        const badge = getLogBadge(log.action);
                        return (
                          <tr key={log._id}>
                            <td>
                              <span className={`log-badge ${badge.class}`}>
                                {badge.text}
                              </span>
                            </td>
                            <td>{formatDate(log.createdAt)}</td>
                            <td>{log.ip === '::1' ? 'Localhost' : log.ip}</td>
                            <td title={log.userAgent}>
                              {parseUserAgent(log.userAgent)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
              {logs.length > 0 && (
                <p className="logs-footer">
                  * Đang hiển thị lịch sử hoạt động của 10 lần gần nhất.
                </p>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default AccountPage;