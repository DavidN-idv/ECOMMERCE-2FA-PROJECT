// src/pages/HomePage.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/HomePage.css";
import { useAuth } from "../context/AuthContext";

const HomePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  const goToLogin = () => navigate("/login");
  const goToRegister = () => navigate("/register");
  const goToAccount = () => navigate("/account");

  return (
    <div className="home-wrapper">
      
      {/* ===== HEADER ===== */}
      <header className="home-header">
        <div className="header-container">
          <div className="logo">My Beauty</div>

          {/* 🔍 SEARCH BAR */}
          <div className="search-bar">
            <input type="text" placeholder="Tìm kiếm sản phẩm, thương hiệu..." />
            <button className="search-btn">
              <i className="fa fa-search">🔍</i>
            </button>
          </div>

          {/* ACTIONS */}
          <div className="header-actions">
            {isAuthenticated ? (
              <>
                <button onClick={goToAccount} className="action-btn user-btn">
                  <span>👤 {user?.username || "Tài khoản"}</span>
                </button>
                <button onClick={logout} className="action-btn logout-btn">
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <button onClick={goToLogin} className="action-btn login-btn">
                  Đăng nhập
                </button>
                <button onClick={goToRegister} className="action-btn register-btn">
                  Đăng ký
                </button>
              </>
            )}
            <button className="action-btn cart-btn">🛒</button>
          </div>
        </div>

        {/* NAV LINKS (Nằm dưới Header chính) */}
        <nav className="nav-bar">
          <Link to="/category/skincare">Skincare</Link>
          <Link to="/category/makeup">Makeup</Link>
          <Link to="/category/fragrance">Nước hoa</Link>
          <Link to="/category/hair">Chăm sóc tóc</Link>
          <Link to="/category/bath">Tắm & Cơ thể</Link>
          <Link to="/category/tools">Dụng cụ</Link>
        </nav>
      </header>

      {/* ===== HERO BANNER ===== */}
      <section className="hero-section">
        <div className="hero-content">
          <span className="hero-tag">Mới Ra Mắt</span>
          <h1>Đánh Thức Vẻ Đẹp <br/> Tiềm Ẩn Của Bạn</h1>
          <p>Khám phá bộ sưu tập độc quyền 2025. Tinh hoa từ thiên nhiên kết hợp công nghệ làm đẹp hiện đại.</p>
          <button
            onClick={isAuthenticated ? goToAccount : goToRegister}
            className="cta-btn"
          >
            {isAuthenticated ? "Khám Phá Ngay" : "Đăng Ký Ngay - Giảm 10%"}
          </button>
        </div>
        <div className="hero-image-wrapper">
          <img
            src="https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?q=80&w=1000&auto=format&fit=crop"
            alt="Hero Banner"
            className="hero-img"
          />
        </div>
      </section>

      {/* ===== CATEGORIES (Hình tròn) ===== */}
      <section className="categories-section">
        <h2>Danh Mục Nổi Bật</h2>
        <div className="category-list">
          {[
            { name: "Skincare", img: "https://www.skincenterofsouthmiami.com/wp-content/uploads/2018/06/Skin-Center-of-South-Miami-Facials-and-Skin-Care.jpg" },
            { name: "Makeup", img: "https://hocviensacdepaau.com/wp-content/uploads/2024/07/dung-cu-makeup-chuyen-nghiep.jpg" },
            { name: "Nước hoa", img: "https://theperfume.vn/wp-content/uploads/2018/08/N%C6%B0%E1%BB%9Bc-hoa-Miss-Dior-100ml-e1669350357726-300x300.png" },
            { name: "Tóc", img: "https://images.herzindagi.info/image/2024/Aug/haircare-routine-for-hair.jpg" },
          ].map((cat, index) => (
            <div key={index} className="category-item">
              <div className="cat-img-holder">
                <img src={cat.img} alt={cat.name} />
              </div>
              <span>{cat.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ===== BEST SELLERS (Product Cards) ===== */}
      <section className="products-section">
        <div className="section-header">
          <h2>Sản Phẩm Bán Chạy</h2>
          <Link to="/all-products" className="view-all">Xem tất cả →</Link>
        </div>
        
        <div className="product-grid">
          {/* Sản phẩm 1 */}
          <div className="product-card">
            <div className="card-badge">Hot</div>
            <div className="card-img">
              <img src="https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500" alt="Serum" />
            </div>
            <div className="card-info">
              <p className="brand">The Ordinary</p>
              <h3 className="name">Serum Vitamin C Sáng Da</h3>
              <div className="price-row">
                <span className="price">1.290.000đ</span>
                <button className="add-btn">+</button>
              </div>
            </div>
          </div>

          {/* Sản phẩm 2 */}
          <div className="product-card">
            <div className="card-img">
              <img src="https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=500" alt="Cream" />
            </div>
            <div className="card-info">
              <p className="brand">Laneige</p>
              <h3 className="name">Kem Dưỡng Ẩm Water Bank</h3>
              <div className="price-row">
                <span className="price">780.000đ</span>
                <button className="add-btn">+</button>
              </div>
            </div>
          </div>

          {/* Sản phẩm 3 */}
          <div className="product-card">
            <div className="card-badge">-20%</div>
            <div className="card-img">
              <img src="https://images.unsplash.com/photo-1515688594390-b649af70d282?w=500" alt="Lipstick" />
            </div>
            <div className="card-info">
              <p className="brand">MAC</p>
              <h3 className="name">Son Lì Mịn Môi Chili</h3>
              <div className="price-row">
                <span className="price">550.000đ</span>
                <span className="old-price">690.000đ</span>
                <button className="add-btn">+</button>
              </div>
            </div>
          </div>
             {/* Sản phẩm 4 */}
             <div className="product-card">
            <div className="card-img">
              <img src="https://nuochoamy.vn/upload/sanpham/thumbs/nuoc-hoa-dior-miss-dior-edt-50ml-1592621407-fb7942.png" alt="Perfume" />
            </div>
            <div className="card-info">
              <p className="brand">Dior</p>
              <h3 className="name">Nước Hoa Miss Dior</h3>
              <div className="price-row">
                <span className="price">2.550.000đ</span>
                <button className="add-btn">+</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-col">
            <h3>My Beauty</h3>
            <p>Nơi vẻ đẹp thăng hoa</p>
          </div>
          <div className="footer-col">
            <h4>Hỗ trợ</h4>
            <a href="#">Trung tâm trợ giúp</a>
            <a href="#">Vận chuyển</a>
          </div>
          <div className="footer-col">
            <h4>Về chúng tôi</h4>
            <a href="#">Câu chuyện</a>
            <a href="#">Tuyển dụng</a>
          </div>
        </div>
        <div className="copyright">
          © 2025 My Beauty
        </div>
      </footer>

    </div>
  );
};

export default HomePage;