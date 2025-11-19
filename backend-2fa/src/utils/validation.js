/**
 * Kiểm tra độ mạnh của mật khẩu
 * Yêu cầu:
 * - Ít nhất 8 ký tự
 * - Ít nhất 1 chữ thường (a-z)
 * - Ít nhất 1 chữ hoa (A-Z)
 * - Ít nhất 1 số (0-9)
 * - Ít nhất 1 ký tự đặc biệt (!@#$%^&...)
 */
export const validatePassword = (password) => {
  // Regex giải thích:
  // (?=.*[a-z]) : Phải chứa ít nhất 1 chữ thường
  // (?=.*[A-Z]) : Phải chứa ít nhất 1 chữ hoa
  // (?=.*\d)    : Phải chứa ít nhất 1 số
  // (?=.*[\W_]) : Phải chứa ít nhất 1 ký tự đặc biệt (hoặc dấu gạch dưới)
  // .{8,}       : Tổng độ dài phải từ 8 ký tự trở lên
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
  
  return re.test(password);
};