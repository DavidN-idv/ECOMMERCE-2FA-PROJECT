# **🔐 Secure E-commerce Authentication System (2FA)**

**Đề tài:** Thiết kế và xây dựng website thương mại điện tử với hệ thống đăng nhập an toàn sử dụng xác thực hai lớp (Two-Factor Authentication \- 2FA).

## **📖 Giới thiệu (Introduction)**

Dự án này là hệ thống xác thực người dùng bảo mật cao dành cho thương mại điện tử. Điểm nhấn của dự án là quy trình **Xác thực 2 lớp (2FA)** sử dụng mã OTP giới hạn thời gian (Time-based OTP) gửi qua Email, tuân thủ các tiêu chuẩn bảo mật hiện đại.

Mô hình dự án: **Monorepo** (Backend và Frontend nằm chung một kho lưu trữ).

Lưu ý: Dự án này không liên quan đến việc bán hàng trực tuyến hoặc các giao dịch tiền tệ. Dự án sử dụng pnpm để chạy và cài đặt thư viện. Vui lòng cài đặt pnpm trước, sau đó vào từng thư mục backend/frontend để cài đặt các thư viện cần thiết (bằng cách chạy lệnh pnpm install).

## **🚀 Tính năng nổi bật (Key Features)**

* ✅ **Authentication Flow:** Đăng ký, Xác thực Email, Đăng nhập (JWT).  
* ✅ **Two-Factor Authentication (2FA):**  
  * Bảo vệ tài khoản bằng lớp bảo mật thứ 2\.  
  * Mã OTP tự động hết hạn sau 60 giây (Sử dụng MongoDB TTL).  
  * Quy trình bật/tắt 2FA an toàn.  
* ✅ **Password Management:**  
  * Đổi mật khẩu (Yêu cầu pass cũ).  
  * Quên mật khẩu (Reset qua OTP Email).  
  * Validation mật khẩu mạnh (Chữ hoa, thường, số, ký tự đặc biệt).  
* ✅ **Security Best Practices:**  
  * Mật khẩu được mã hóa bằng Bcrypt.  
  * Middleware bảo vệ các Route nhạy cảm.  
  * Cấu trúc phản hồi API chuẩn hóa.

## **🛠️ Công nghệ sử dụng (Tech Stack)**

### **Backend (Folder /backend)**

* **Core:** Node.js, Express.js  
* **Database:** MongoDB, Mongoose ODM  
* **Security:** JSON Web Token (JWT), Bcryptjs, Cors  
* **Email Service:** Nodemailer (Gmail SMTP) hoặc SendGrid  
* **Dev Tools:** Nodemon, pnpm

### **Frontend (Folder /frontend)**

* **Core:** ReactJS, Vite  
* **HTTP Client:** Axios  
* **Routing:** React Router DOM  
* **Styling:** TailwindCSS (Khuyến nghị)

## **📂 Cấu trúc dự án (Project Structure)**

ECOMMERCE-2FA-PROJECT/  
├── backend/             \# Mã nguồn Server (Port 8000\)  
│   ├── src/  
│   │   ├── config/      \# Kết nối Database  
│   │   ├── controllers/ \# Logic xử lý API  
│   │   ├── middleware/  \# Auth Middleware  
│   │   ├── models/      \# MongoDB Schemas (User, Otp)  
│   │   ├── routes/      \# Định nghĩa API Endpoints  
│   │   └── utils/       \# Hàm hỗ trợ (SendMail, Validate...)  
│   ├── .env             \# Biến môi trường Backend  
│   └── server.js        \# File khởi chạy  
│  
├── frontend/            \# Mã nguồn Client (Port 5173\)  
│   ├── src/  
│   │   ├── components/  \# UI Components  
│   │   ├── pages/       \# Các màn hình (Login, 2FA...)  
│   │   └── services/    \# Cấu hình Axios & API calls  
│   ├── .env             \# Biến môi trường Frontend  
│   └── vite.config.js  
│  
└── README.md            \# Tài liệu hướng dẫn này

## **⚙️ Hướng dẫn cài đặt (Installation)**

Yêu cầu: Máy đã cài sẵn **Node.js** và **pnpm**.

### **Bước 1: Clone dự án**

git clone \<link-repo-cua-ban\>  
cd ECOMMERCE-2FA-PROJECT

### **Bước 2: Cài đặt & Chạy Backend**

Mở terminal thứ nhất:

cd backend  
pnpm install

Tạo file .env trong thư mục backend/ với nội dung:

PORT=8000  
MONGODB\_URI=mongodb://localhost:27017/ecommerce\_2fa  
JWT\_SECRET=chuoi\_bi\_mat\_cua\_ban\_super\_secret  
\# Cấu hình Email (Ví dụ dùng Gmail App Password)  
SMPT\_HOST=smtp.gmail.com  
SMPT\_PORT=587  
SMPT\_MAIL=email\_cua\_ban@gmail.com  
SMPT\_PASSWORD=mat\_khau\_ung\_dung\_16\_ky\_tu

Chạy Server:

pnpm dev  
\# ✅ Server running on port 8000  
\# ✅ MongoDB Connected...

### **Bước 3: Cài đặt & Chạy Frontend**

Mở terminal thứ hai:

cd frontend  
pnpm install

Tạo file .env trong thư mục frontend/:

VITE\_API\_BASE\_URL=http://localhost:8000/api

Chạy Client:

pnpm dev  
\# ➜  Local:   http://localhost:5173/

## **🔌 Tài liệu API (API Documentation)**

**Base URL:** http://localhost:8000/api

### **1\. Authentication (Công khai)**

| Method | Endpoint | Mô tả | Body Request |
| :---- | :---- | :---- | :---- |
| POST | /auth/register | Đăng ký tài khoản | { email, password, name } |
| POST | /auth/verify-email | Xác thực email sau đăng ký | { email, otp } |
| POST | /auth/login | Đăng nhập (Bước 1\) | { email, password } |
| POST | /auth/verify-2fa | Xác thực 2FA (Bước 2 \- nếu bật) | { userId, otp } |
| POST | /auth/forgot-password | Yêu cầu khôi phục mật khẩu | { email } |
| POST | /auth/reset-password | Đặt mật khẩu mới | { email, otp, newPassword } |

### **2\. 2FA Management (Yêu cầu Token)**

*Header bắt buộc:* Authorization: Bearer \<token\>

| Method | Endpoint | Mô tả | Body Request |
| :---- | :---- | :---- | :---- |
| POST | /auth/2fa/enable-request | Xin OTP để bật 2FA | *(None)* |
| POST | /auth/2fa/enable-confirm | Xác nhận bật 2FA | { otp } |
| POST | /auth/2fa/disable | Tắt tính năng 2FA | { password } |

### **3\. User Profile (Yêu cầu Token)**

*Header bắt buộc:* Authorization: Bearer \<token\>

| Method | Endpoint | Mô tả | Body Request |
| :---- | :---- | :---- | :---- |
| GET | /users/profile | Lấy thông tin user hiện tại | *(None)* |
| POST | /auth/change-password | Đổi mật khẩu | { oldPassword, newPassword } |

## **📋 Quy chuẩn Response (Response Format)**

Mọi API đều trả về dữ liệu theo cấu trúc JSON chuẩn:

**Thành công (Success \- 2xx):**

{  
  "data": {  
    "message": "Thành công...",  
    "token": "...",  
    "user": { ... }  
  }  
}

**Thất bại (Error \- 4xx/5xx):**

{  
  "response": {  
    "data": {  
      "message": "Mô tả lỗi chi tiết"  
    }  
  }  
}  
