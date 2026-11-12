import { Phone, Mail, MapPin, Clock, ShieldCheck, Heart, ArrowUp } from 'lucide-react';
import PrimeLogo from './PrimeLogo';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="prime-footer">
      {/* Top Banner Row */}
      <div className="prime-footer-topbar">
        <div className="prime-container footer-topbar-inner">
          <div className="footer-topbar-badge">
            <ShieldCheck size={20} className="badge-icon-teal" />
            <span>Hệ thống Nha khoa chuẩn quốc tế - Được cấp phép bởi Bộ Y Tế</span>
          </div>
          <div className="footer-topbar-hotline">
            <span>Cấp cứu nha khoa 24/7: </span>
            <a href="tel:+84123456789" className="hotline-highlight">
              +84 123456789
            </a>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="prime-container footer-main-inner">
        {/* Col 1: Brand & Bio */}
        <div className="footer-col-brand">
          <PrimeLogo size={36} light={true} />
          <p className="footer-brand-desc">
            Primecare là hệ thống nha khoa chuyên sâu chất lượng cao, tiên phong ứng dụng công
            nghệ kỹ thuật số trong khám, điều trị và kiến tạo nụ cười thẩm mỹ rạng rỡ cho hàng
            chục nghìn khách hàng.
          </p>
          <div className="footer-cert-tags">
            <span className="cert-chip">ISO 9001:2015</span>
            <span className="cert-chip">Invisalign Platinum Elite</span>
            <span className="cert-chip">Straumann Top Partner</span>
          </div>
        </div>

        {/* Col 2: Navigation */}
        <div className="footer-col-links">
          <h4 className="footer-heading">Khám Phá</h4>
          <ul className="footer-nav-list">
            <li><a href="#home">Trang Chủ</a></li>
            <li><a href="#about">Về Primecare</a></li>
            <li><a href="#services">Dịch Vụ Chuyên Sâu</a></li>
            <li><a href="#doctors">Đội Ngũ Bác Sĩ</a></li>
            <li><a href="#reviews">Cảm Nhận Khách Hàng</a></li>
            <li><a href="#faq">Câu Hỏi Thường Gặp</a></li>
          </ul>
        </div>

        {/* Col 3: Services */}
        <div className="footer-col-links">
          <h4 className="footer-heading">Dịch Vụ Nổi Bật</h4>
          <ul className="footer-nav-list">
            <li><a href="#services">Nha Khoa Tổng Quát</a></li>
            <li><a href="#services">Niềng Răng Invisalign</a></li>
            <li><a href="#services">Cấy Ghép Implant Kỹ Thuật Số</a></li>
            <li><a href="#services">Dán Sứ Veneer Siêu Mỏng</a></li>
            <li><a href="#services">Tẩy Trắng Răng Laser Care</a></li>
            <li><a href="#services">Nhổ Răng Khôn Sóng Siêu Âm</a></li>
            <li><a href="#services">Điều Trị Tủy Vi Phẫu</a></li>
          </ul>
        </div>

        {/* Col 4: Contact & Hours */}
        <div className="footer-col-contact">
          <h4 className="footer-heading">Thông Tin Liên Hệ</h4>
          <ul className="footer-contact-list">
            <li>
              <MapPin size={18} className="contact-icon" />
              <div>
                <strong>Cơ sở 1:</strong> 123 Phố Huế, Q. Hai Bà Trưng, Hà Nội
              </div>
            </li>
            <li>
              <MapPin size={18} className="contact-icon" />
              <div>
                <strong>Cơ sở 2:</strong> 456 Nguyễn Thị Minh Khai, Q. 3, TP. HCM
              </div>
            </li>
            <li>
              <Phone size={18} className="contact-icon" />
              <div>
                <strong>Hotline:</strong> +84 123456789 (Hỗ trợ 24/7)
              </div>
            </li>
            <li>
              <Mail size={18} className="contact-icon" />
              <div>
                <strong>Email:</strong> contact@primecare.vn
              </div>
            </li>
            <li>
              <Clock size={18} className="contact-icon" />
              <div>
                <strong>Giờ mở cửa:</strong> 08:00 - 20:00 (Thứ 2 - Chủ Nhật)
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="prime-footer-bottom">
        <div className="prime-container footer-bottom-inner">
          <p className="copyright-text">
            © {new Date().getFullYear()} Primecare Dental Clinic. Tất cả các quyền được bảo lưu.
          </p>
          <div className="footer-bottom-links">
            <a href="#privacy">Chính sách bảo mật</a>
            <span>•</span>
            <a href="#terms">Điều khoản sử dụng</a>
            <span>•</span>
            <a href="#license">Giấy phép hoạt động số 01842/BYT</a>
          </div>
          <button className="btn-back-to-top" onClick={scrollToTop} aria-label="Lên đầu trang">
            <ArrowUp size={16} />
            <span>Lên đầu trang</span>
          </button>
        </div>
      </div>
    </footer>
  );
}
