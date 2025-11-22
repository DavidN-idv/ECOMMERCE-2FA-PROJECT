// src/utils/errorHandler.js

export const getErrorMessage = (error, defaultMessage) => {
  return (
    // Cấu trúc của backend hiện tại
    error.response?.data?.response?.data?.message || 
    // Cấu trúc lỗi Axios thông thường
    error.response?.data?.message ||                 
    // Lỗi JS thuần (ví dụ: Network Error)
    error.message ||                                 
    // Fallback
    defaultMessage
  );
};