// src/utils/responseParams.js

// Cấu trúc: { "data": { ... } }
export const sendSuccess = (res, data, statusCode = 200) => {
  return res.status(statusCode).json({
    data: data
  });
};

// Cấu trúc: { "response": { "data": { "message": "..." } } }
export const sendError = (res, message, statusCode = 400) => {
  return res.status(statusCode).json({
    response: {
      data: {
        message: message
      }
    }
  });
};