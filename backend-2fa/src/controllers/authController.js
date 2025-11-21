import User from '../models/User.js';
import Otp from '../models/Otp.js';
import Log from '../models/Log.js';
import PendingUser from '../models/PendingUser.js';
import bcrypt from 'bcryptjs';
import generateToken from '../utils/generateToken.js';
import sendEmail from '../utils/sendEmail.js';
import jwt from 'jsonwebtoken';
import { validatePassword } from '../utils/validation.js';
import { sendSuccess, sendError } from '../utils/responseParams.js';

/** -----------------------------------------------
* @description    Đăng ký tài khoản mới
* @route   POST /api/auth/register
* @access  Public
*/
const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!phone || phone.trim() === "") {
      phone = null;
    }

    // Kiểm tra mật khẩu
    if (!validatePassword(password)) {
      return sendError(res, 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.');
    }

    // Kiểm tra user đã tồn tại chưa
    const userExists = await User.findOne({ email });
    if (userExists) {
      return sendError(res, 'Email này đã tồn tại trong hệ thống.');
    }

    if (phone) {
      const phoneExists = await User.findOne({ phone });
      if (phoneExists) {
        return sendError(res, 'Số điện thoại đã bị trùng, vui lòng sử dụng số điện thoại khác.');
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    await PendingUser.findOneAndDelete({ email });
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Tạo Pending user mới
    await PendingUser.create({
      username: name || email.split('@')[0],
      email,
      password: hashedPassword, // Lưu pass đã mã hóa
      phone,
      otpCode
    });

    // Nội dung Email
    const message = `
      <div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
        <div style="margin:50px auto;width:70%;padding:20px 0">
          <div style="border-bottom:1px solid #eee">
            <a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">My Beauty</a>
          </div>
          <p style="font-size:1.1em">Xin chào,</p>
          <p>Vui lòng sử dụng mã OTP sau để xác thực email của bạn. Mã có hiệu lực trong 5 phút:</p>
          <h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${otpCode}</h2>
          <p style="font-size:0.9em;">Xin cảm ơn,<br />Ecommercial Team</p>
        </div>
      </div>
    `;

    // Gửi email
    try {
      await sendEmail({
        email,
        subject: 'Xác thực tài khoản My Beauty',
        message: message,
      });
    } catch (err) {
      await PendingUser.findOneAndDelete({ email });
      return sendError(res, "Không thể gửi email xác thực. Vui lòng kiểm tra lại địa chỉ email.");
    }

    return sendSuccess(res, {
      message: "Mã xác thực đã được gửi. Vui lòng kiểm tra email.",
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * 
 * @description     Xác thực email 
 * @route           POST /api/auth/verify-email
 * @access          Public
 */
const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const pendingUser = await PendingUser.findOne({ email });

    if (!pendingUser) return sendError(res, 'Mã xác thực hết hạn hoặc email chưa đăng ký.');
    if (pendingUser.otpCode !== otp) return sendError(res, 'Mã OTP không chính xác.');
    const phoneToSave = (pendingUser.phone && pendingUser.phone !== "") ? pendingUser.phone : null;

    // Tạo User 
    await User.create({
      username: pendingUser.username,
      email: pendingUser.email,
      password: pendingUser.password,
      phone: phoneToSave,
      is2FAEnabled: false
    });
    await PendingUser.deleteOne({ _id: pendingUser._id });

    return sendSuccess(res, { message: "Xác thực email thành công! Bạn có thể đăng nhập ngay." });
  } catch (error) {
    if (error.code === 11000) {
      if (error.keyPattern && error.keyPattern.phone) {
        return sendError(res, 'Số điện thoại này đã được đăng ký bởi tài khoản khác trong lúc bạn chờ xác thực.');
      }
      if (error.keyPattern && error.keyPattern.email) {
        return sendError(res, 'Email này đã được đăng ký.');
      }
    }
    return sendError(res, error.message, 500);
  }
};

/** -----------------------------------------------
* @desc    Đăng nhập: bước Kiểm tra User/Pass
* @route   POST /api/auth/login
* @access  Public
*/
const authUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    // Lấy thông tin ghi log
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    if (user && (await user.matchPassword(password))) {

      // Nếu User ĐANG BẬT 2FA 
      if (user.is2FAEnabled) {
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        // Xóa OTP cũ nếu có
        await Otp.deleteMany({ userId: user._id });
        await Otp.create({ userId: user._id, otpCode });

        // Nội dung Email
        const message = `
          <div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
            <div style="margin:50px auto;width:70%;padding:20px 0">
              <div style="border-bottom:1px solid #eee">
                <a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">My Beauty</a>
              </div>
              <p style="font-size:1.1em">Xin chào,</p>
              <p>Vui lòng sử dụng mã OTP sau để hoàn tất đăng nhập. Mã có hiệu lực trong 5 phút:</p>
              <h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${otpCode}</h2>
              <p style="font-size:0.9em;">Xin cảm ơn,<br />Ecommercial Team</p>
            </div>
          </div>
        `;

        // Gửi Email
        await sendEmail({
          email: user.email,
          subject: 'Mã xác thực đăng nhập (2FA) - My Beauty',
          message,
        });

        return sendSuccess(res, {
          requires2FA: true,
          userId: user._id
        });
      }

      // Nếu không bật 2FA

      await Log.create({
        userId: user._id,
        action: 'LOGIN_STANDARD',
        ip,
        userAgent
      });

      const accessToken = generateToken(res, user._id);
      return sendSuccess(res, {
        accessToken,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          is2FAEnabled: user.is2FAEnabled,
        }
      });

    } else {
      if (user) {
        await Log.create({
          userId: user._id,
          action: 'LOGIN_FAILED', // Đánh dấu thất bại
          ip,
          userAgent
        });
      }
      return sendError(res, 'Sai email hoặc mật khẩu', 401);
    }
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

/**-----------------------------------------------
* @desc    Đăng nhập: Verify OTP
* @route   POST /api/auth/verify-2fa
* @access  Public
*/
const verify2FA = async (req, res) => {
  try {
    const { userId, otp } = req.body;
    // Lấy thông tin ghi log
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const otpRecord = await Otp.findOne({ userId, otpCode: otp });
    if (!otpRecord) {
      await Log.create({
        userId: userId,
        action: '2FA_FAILED', // Sai OTP
        ip,
        userAgent
      });

      return sendError(res, 'Mã OTP không hợp lệ hoặc đã hết hạn');
    }


    await Log.create({
      userId: user._id,
      action: 'LOGIN_2FA',
      ip,
      userAgent
    });

    const user = await User.findById(userId);
    await Otp.deleteOne({ _id: otpRecord._id });
    const accessToken = generateToken(res, user._id);
    return sendSuccess(res, {
      accessToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        is2FAEnabled: user.is2FAEnabled,
      }
    });

  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

/**-----------------------------------------------
* @desc    Kích hoạt 2FA
* @route   POST /api/auth/enable-2fa
* @access  Public
*/
const enable2FARequest = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    await Otp.deleteMany({ userId: user._id });
    await Otp.create({ userId: user._id, otpCode });

    // Nội dung Email
    const message = `
      <div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
        <div style="margin:50px auto;width:70%;padding:20px 0">
          <div style="border-bottom:1px solid #eee">
            <a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">My Beauty</a>
          </div>
          <p style="font-size:1.1em">Xin chào,</p>
          <p>Vui lòng sử dụng mã OTP sau để kích hoạt 2FA. Mã có hiệu lực trong 5 phút:</p>
          <h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${otpCode}</h2>
          <p style="font-size:0.9em;">Xin cảm ơn,<br />Ecommercial Team</p>
        </div>
      </div>
    `;

    await sendEmail({
      email: user.email,
      subject: 'Kích hoạt xác thực 2 lớp (2FA) - My Beauty',
      message
    });

    return sendSuccess(res, { message: "Đã gửi mã OTP kích hoạt đến email." });
  } catch (error) {
    return sendError(res, "Không thể gửi email OTP", 500);
  }
};

/**-----------------------------------------------
* @desc     Xác nhận kích hoạt 2FA
* @route    POST /api/auth/enable-2fa/confirm
* @access   Public
*/
const enable2FAConfirm = async (req, res) => {
  try {
    const { otp } = req.body;
    const user = await User.findById(req.user._id);

    const otpRecord = await Otp.findOne({ userId: user._id, otpCode: otp });
    if (!otpRecord) return sendError(res, "Mã OTP kích hoạt không đúng");

    user.is2FAEnabled = true;
    await user.save();
    await Otp.deleteOne({ _id: otpRecord._id });

    return sendSuccess(res, {
      message: "Bật 2FA thành công!",
      is2FAEnabled: true
    });
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

/**-----------------------------------------------
* @desc      Xác nhận tắt 2FA
* @route     POST /api/auth/disable-2fa
* @access    Public
*/
const disable2FA = async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.user._id);

    if (!(await user.matchPassword(password))) {
      return sendError(res, "Mật khẩu xác nhận không đúng");
    }

    user.is2FAEnabled = false;
    await user.save();

    return sendSuccess(res, {
      message: "Tắt 2FA thành công!",
      is2FAEnabled: false
    });
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

/**-----------------------------------------------
* @desc    Cấp lại Access Token mới từ Refresh Token
* @route   POST /api/auth/refresh
* @access  Public
*/
const refreshToken = async (req, res) => {
  try {
    // Lấy refresh token từ cookie
    const cookies = req.cookies;

    if (!cookies?.jwt) {
      return sendError(res, 'Bạn chưa đăng nhập (Không có Refresh Token)');
    }

    const refreshToken = cookies.jwt;

    // Verify token
    const jwt = await import('jsonwebtoken');
    try {
      const decoded = jwt.default.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const newAccessToken = jwt.default.sign(
        { userId: decoded.userId },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
      );

      return sendSuccess(res, { accessToken: newAccessToken });
    } catch (err) {
      return sendError(res, 'Phiên đăng nhập hết hạn hoặc token không hợp lệ', 403);
    }
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

/**-----------------------------------------------
* @desc    Đăng xuất (Xóa Cookie)
* @route   POST /api/auth/logout
*/
const logoutUser = async (req, res) => {
  try {
    // Lấy thông tin user từ cookie trước khi xóa
    const cookies = req.cookies;
    if (cookies?.jwt) {
      try {
        const decoded = jwt.verify(cookies.jwt, process.env.JWT_REFRESH_SECRET);

        // GHI LOG LOGOUT
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const userAgent = req.headers['user-agent'];

        await Log.create({
          userId: decoded.userId,
          action: 'LOGOUT',
          ip,
          userAgent
        });
      } catch (e) {
        // Token hết hạn -> Tự log out không ghi log
      }
    }

    // Xóa Cookie
    res.cookie('jwt', '', {
      httpOnly: true,
      expires: new Date(0),
    });

    return sendSuccess(res, { message: 'Đăng xuất thành công' });
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};


/**-----------------------------------------------
* @desc    Quên mật khẩu
* @route   POST /api/auth/forgot-password
*/
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return sendSuccess(res, { message: "Nếu email tồn tại, link reset đã được gửi" });
  }

  // Tạo OTP và gửi mail
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  await Otp.deleteMany({ userId: user._id });
  await Otp.create({ userId: user._id, otpCode });

  // Nội dung Email
  const message = `
    <div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
      <div style="margin:50px auto;width:70%;padding:20px 0">
        <div style="border-bottom:1px solid #eee">
          <a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">My Beauty</a>
        </div>
        <p style="font-size:1.1em">Xin chào,</p>
        <p>Vui lòng sử dụng mã OTP sau để khôi phục mật khẩu. Mã có hiệu lực trong 5 phút:</p>
        <h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${otpCode}</h2>
        <p style="font-size:0.9em;">Xin cảm ơn,<br />Ecommercial Team</p>
      </div>
    </div>
  `;

  // Gửi Email

  await sendEmail({
    email: user.email,
    subject: 'Mã xác thực khôi phục mật khẩu (2FA) - My Beauty',
    message,
  });

  return sendSuccess(res, { message: "Nếu email tồn tại, link reset đã được gửi" });
}

/**-----------------------------------------------
* @desc    Reset mật khẩu
* @route   POST /api/auth/reset-password
*/
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!validatePassword(newPassword)) {
      return sendError(res, 'Mật khẩu mới quá yếu. Yêu cầu: 8 ký tự, có Hoa, thường, số và ký tự đặc biệt.');
    }
    const user = await User.findOne({ email });
    if (!user) return sendError(res, 'Mã OTP không chính xác');
    const otpRecord = await Otp.findOne({ userId: user._id, otpCode: otp });
    if (!otpRecord) return sendError(res, 'Mã OTP không chính xác');

    // Đặt lại pass
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();
    await Otp.deleteOne({ _id: otpRecord._id });

    return sendSuccess(res, { message: "Đặt lại mật khẩu thành công! Hãy đăng nhập lại!" });
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};
export { registerUser, authUser, verifyEmail, verify2FA, refreshToken, logoutUser, enable2FAConfirm, enable2FARequest, disable2FA, forgotPassword, resetPassword };