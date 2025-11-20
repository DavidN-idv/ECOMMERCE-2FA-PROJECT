import User from '../models/User.js';
import Otp from '../models/Otp.js';
import generateToken from '../utils/generateToken.js';
import sendEmail from '../utils/sendEmail.js';
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

    // Kiểm tra mật khẩu
    if (!validatePassword(password)) {
      return sendError(res, 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.');
    }

    // Kiểm tra user đã tồn tại chưa
    const userExists = await User.findOne({ email });
    if (userExists) {
      return sendError(res, 'Email này đã tồn tại trong hệ thống.');
    }

    // Tạo user mới
    const user = await User.create({
      username: name || email.split('@')[0],
      email,
      password,
      phone,
      is2FAEnabled: false
    });

    // Tạo OTP xác thực emai
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    await Otp.create({ userId: user._id, otpCode });

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
    await sendEmail({
      email: user.email,
      subject: 'Xác thực tài khoản My Beauty',
      message: message,
    });

    return sendSuccess(res, {
      message: "Đăng ký thành công! Vui lòng kiểm tra email.",
      userId: user._id
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
    const user = await User.findOne({ email });

    if (!user) return sendError(res, 'Email không tồn tại');

    const otpRecord = await Otp.findOne({ userId: user._id, otpCode: otp });
    if (!otpRecord) return sendError(res, 'Mã OTP không hợp lệ');

    await Otp.deleteOne({ _id: otpRecord._id });

    //user.isEmailVerified = true;
    return sendSuccess(res, { message: "Xác thực email thành công!" });
  } catch (error) {
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

    if (user && (await user.matchPassword(password))) {

      // Nếu User ĐANG BẬT 2FA 
      if (user.is2FAEnabled) {
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        // Xóa OTP cũ nếu có
        await Otp.deleteMany({ userId: user._id });
        await Otp.create({
          userId: user._id,
          otpCode,
        });

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
      res.status(401).json({ message: 'Sai email hoặc mật khẩu' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**-----------------------------------------------
* @desc    Đăng nhập: Verify OTP
* @route   POST /api/auth/verify-otp
* @access  Public
*/
const verify2FA = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    const otpRecord = await Otp.findOne({ userId, otpCode: otp });
    if (!otpRecord) return sendError(res, 'Mã OTP không hợp lệ hoặc đã hết hạn');

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
    res.status(500).json({ message: error.message });
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
    if (!otpRecord) {
      return sendError(res, "Mã OTP kích hoạt không đúng");
    }

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
      return res.status(401).json({ message: 'Bạn chưa đăng nhập (Không có Refresh Token)' });
    }

    const refreshToken = cookies.jwt;

    // Verify token
    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: 'Phiên đăng nhập hết hạn' });
      }

      const newAccessToken = jwt.sign(
        { userId: decoded.userId },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
      );

      res.json({ accessToken: newAccessToken });
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**-----------------------------------------------
* @desc    Đăng xuất (Xóa Cookie)
* @route   POST /api/auth/logout
*/
const logoutUser = (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ message: 'Đăng xuất thành công' });
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
    user.password = newPassword;
    await user.save();
    await Otp.deleteOne({ _id: otpRecord._id });

    return sendSuccess(res, { message: "Đặt lại mật khẩu thành công! Hãy đăng nhập lại!" });
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};
export { registerUser, authUser, verifyEmail, verify2FA, refreshToken, logoutUser, enable2FAConfirm, enable2FARequest, disable2FA, forgotPassword, resetPassword };