import User from '../models/User.js';
import Log from '../models/Log.js';
import { validatePassword } from '../utils/validation.js';
import { sendSuccess, sendError } from '../utils/responseParams.js';

/**---------------------------------------------
// @desc    Lấy thông tin người dùng hiện tại
// @route   GET /api/users/profile
// @access  Private (Yêu cầu Token)
*/
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      return sendSuccess(res, {
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          avatar: user.avatar,
          is2FAEnabled: user.is2FAEnabled,
          createdAt: user.createdAt,
        }
      });
    } else {
      return sendError(res, 'Không tìm thấy người dùng', 404);
    }
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};


/**---------------------------------------------
// @desc    Đổi mật khẩu
// @route   PUT /api/users/change-password
// @access  Private (Yêu cầu Token)
*/
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return sendError(res, 'Người dùng không tồn tại', 404);

    if (!(await user.matchPassword(oldPassword))) {
      return sendError(res, 'Mật khẩu cũ không đúng');
    }

    if (!validatePassword(newPassword)) {
      return sendError(res,
        'Mật khẩu mới không đủ mạnh (Cần 8 ký tự, chữ Hoa, thường, số, ký tự đặc biệt!'
      );
    }

    if (await user.matchPassword(newPassword)) {
       return sendError(res,'Mật khẩu mới không được trùng với mật khẩu cũ');
    }

    user.password = newPassword;
    await user.save();

    return sendSuccess(res, { message: 'Đổi mật khẩu thành công!' });

  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

/**
 * @desc    Lấy lịch sử đăng nhập
 * @route   GET /api/users/logs
 * @access  Private
 */
const getLoginHistory = async (req, res) => {
  try {
    // Lấy logs của user hiện tại, sắp xếp mới nhất lên đầu
    const logs = await Log.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10); // Chỉ lấy 10 lần gần nhất cho gọn

    return sendSuccess(res, logs);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export { getUserProfile, changePassword, getLoginHistory };