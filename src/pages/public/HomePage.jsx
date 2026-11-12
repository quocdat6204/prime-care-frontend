import { useState } from 'react';
import {
  Calendar, Shield, Stethoscope, Sparkles, HeartPulse,
  ArrowUpRight, ArrowRight, Plus, Star, Award, CheckCircle2,
  Clock, ChevronDown, ChevronUp, PhoneCall, SmilePlus,
  Check, UserCheck, ShieldCheck, Heart
} from 'lucide-react';

export default function HomePage({ onLoginClick, onRegisterClick }) {
  const [showAllServices, setShowAllServices] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  const mainServices = [
    {
      id: 1,
      title: 'Nha Khoa Tổng Quát',
      desc: 'Nha khoa tổng quát bao gồm các dịch vụ chăm sóc răng miệng cơ bản và toàn diện.',
      icon: <Stethoscope size={24} />,
      iconBg: '#6366F1',
      arrowType: 'up-right',
      image: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=700&q=80',
    },
    {
      id: 2,
      title: 'Nha Khoa Thẩm Mỹ',
      desc: 'Nha khoa thẩm mỹ tập trung vào việc cải thiện vẻ ngoài của răng, nướu và nụ cười.',
      icon: <Sparkles size={24} />,
      iconBg: '#4F46E5',
      arrowType: 'up-right',
      image: 'https://images.unsplash.com/photo-1588776814546-daab30f310ce?auto=format&fit=crop&w=700&q=80',
    },
    {
      id: 3,
      title: 'Nha Khoa Phục Hồi',
      desc: 'Nha khoa phục hồi tập trung vào khôi phục chức năng và thẩm mỹ của răng.',
      icon: <HeartPulse size={24} />,
      iconBg: '#312E81',
      arrowType: 'right',
      image: 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=700&q=80',
    },
  ];

  const extraServices = [
    {
      id: 4,
      title: 'Niềng Răng Invisalign',
      desc: 'Khay niềng trong suốt chuẩn Mỹ, tháo lắp linh hoạt, vô hình và hiệu quả gấp 2 lần.',
      icon: <SmilePlus size={24} />,
      iconBg: '#4F46E5',
      arrowType: 'up-right',
      image: 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=700&q=80',
    },
    {
      id: 5,
      title: 'Cấy Ghép Implant Kỹ Thuật Số',
      desc: 'Phục hồi răng mất trọn đời với trụ Thụy Sĩ/Hàn Quốc, tích hợp xương sinh học 99.8%.',
      icon: <ShieldCheck size={24} />,
      iconBg: '#4338CA',
      arrowType: 'up-right',
      image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=700&q=80',
    },
    {
      id: 6,
      title: 'Tẩy Trắng Răng Laser Whitening',
      desc: 'Bật tone sáng bóng tự nhiên sau 45 phút, không ê buốt với công nghệ Laser lạnh.',
      icon: <Sparkles size={24} />,
      iconBg: '#6366F1',
      arrowType: 'right',
      image: 'https://images.unsplash.com/photo-1588776814546-daab30f310ce?auto=format&fit=crop&w=700&q=80',
    },
  ];

  const doctors = [
    {
      name: 'TS. BS. Nguyễn Hoàng Nam',
      role: 'Đồng sáng lập & Giám đốc Chuyên môn',
      exp: '18 năm kinh nghiệm',
      degree: 'Tiến sĩ Răng Hàm Mặt - ĐH Y Hà Nội',
      image: 'https://images.unsplash.com/photo-1622902046580-2b47f47f5471?auto=format&fit=crop&w=400&q=80',
      badge: 'Chuyên gia Chỉnh nha Quốc tế',
    },
    {
      name: 'ThS. BS. Trần Minh Khôi',
      role: 'Trưởng khoa Cấy ghép Implant & Phục hình',
      exp: '15 năm kinh nghiệm',
      degree: 'Thạc sĩ Tu nghiệp Implant tại Thụy Sĩ',
      image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=400&q=80',
      badge: 'Thành viên Hiệp hội ICOI Hoa Kỳ',
    },
    {
      name: 'BS. CKI Lê Hoàng Yến',
      role: 'Chuyên gia Thẩm mỹ Nụ cười & Dán sứ Veneer',
      exp: '12 năm kinh nghiệm',
      degree: 'Bác sĩ CKI - ĐH Y Dược TP.HCM',
      image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80',
      badge: 'Chứng chỉ Quốc tế DSD Smile Design',
    },
  ];


  const testimonials = [
    {
      name: 'Nguyễn Thu Trang',
      role: 'Bệnh nhân Niềng răng Invisalign',
      stars: 5,
      content:
        'Mình niềng răng trong suốt tại Primecare được 10 tháng, răng vào phom cực kỳ chuẩn và đẹp. Đội ngũ bác sĩ và nhân viên chăm sóc rất chu đáo, nhắc lịch hẹn đều đặn!',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    },
    {
      name: 'Hoàng Minh Quân',
      role: 'Khách hàng Cấy ghép Implant',
      stars: 5,
      content:
        'Trồng răng Implant không đau như mình nghĩ. Phòng khám sạch sẽ, máy móc hiện đại và bác sĩ giải thích tỉ mỉ từng giai đoạn. Rất an tâm khi đến đây!',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    },
    {
      name: 'Đặng Mai Phương',
      role: 'Dán sứ Veneer thẩm mỹ',
      stars: 5,
      content:
        'Nụ cười mới giúp mình tự tin hơn hẳn trong công việc giao tiếp. Dáng răng tự nhiên và màu sắc trắng sáng rất ưng ý. Cảm ơn đội ngũ Primecare!',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
    },
  ];

  const faqs = [
    {
      q: 'Quy trình đặt lịch hẹn tại Primecare diễn ra như thế nào?',
      a: 'Bạn chỉ cần nhấn vào nút "Đặt lịch hẹn" trên thanh điều hướng hoặc gọi Hotline +84 123456789. Hệ thống sẽ tự động xác nhận và sắp xếp bác sĩ phù hợp trong khung giờ bạn mong muốn.',
    },
    {
      q: 'Khám và lấy cao răng tại nha khoa có bị đau hoặc chảy máu không?',
      a: 'Primecare sử dụng thiết bị rung siêu âm hiện đại hạn chế tối đa cảm giác ê buốt và tổn thương mô nướu. Toàn bộ thao tác đều được thực hiện nhẹ nhàng bởi bác sĩ chuyên khoa.',
    },
    {
      q: 'Phòng khám có hỗ trợ bảo hiểm y tế hoặc trả góp 0% không?',
      a: 'Có. Chúng tôi liên kết với hơn 20 hãng bảo hiểm lớn và có chương trình trả góp linh hoạt 0% lãi suất qua thẻ tín dụng cho các dịch vụ Niềng răng, Implant và Sứ thẩm mỹ.',
    },
    {
      q: 'Thời gian bảo hành các dịch vụ Răng sứ và Cấy ghép Implant là bao lâu?',
      a: 'Các dòng sứ thẩm mỹ chính hãng được bảo hành từ 7 - 15 năm, riêng trụ Implant nhập khẩu Thụy Sĩ/Hàn Quốc được cấp thẻ bảo hành chính hãng trọn đời.',
    },
  ];

  return (
    <div className="prime-home-page" id="home">
      {/* ============================================================
          1. HERO SECTION (Matched to Reference Image 1)
          ============================================================ */}
      <section className="prime-hero-section">
        {/* Subtle grid background overlay */}
        <div className="prime-hero-grid-pattern" />

        <div className="prime-container hero-container-inner">
          {/* Left Text Column */}
          <div className="hero-content-col">
            <h1 className="hero-headline">
              <span>Vì nụ cười của bạn</span>{' '}
              <span className="hero-inline-badge badge-tooth">
                <span className="badge-icon-tooth">🦷</span>
                <span className="badge-subtext">Khoẻ đẹp</span>
              </span>
              <span className="hero-desktop-break"><br /></span>
              <span className="hero-headline-line2">
                Chăm sóc nha khoa <span className="hero-nowrap">chuyên nghiệp</span>
              </span>{' '}
              <span className="hero-desktop-break"><br /></span>
              <span>cho một ngày mai rạng rỡ</span>
            </h1>

            <p className="hero-lead-text">
              Trải nghiệm dịch vụ chăm sóc nha khoa chất lượng hàng đầu, tập trung vào sức khỏe
              và vẻ đẹp của nụ cười. Hãy cùng chúng tôi tạo nên một ngày mai tươi sáng và mạnh
              khỏe hơn.
            </p>

            {/* Quick Actions */}
            <div className="hero-cta-buttons">
              <button className="btn-prime-gradient" onClick={onRegisterClick}>
                <Calendar size={18} />
                <span>Đặt Lịch Ngay</span>
              </button>
              <button
                className="btn-prime-outline-light"
                onClick={() => {
                  const el = document.getElementById('services');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <span>Xem Dịch Vụ</span>
                <ArrowRight size={16} />
              </button>
            </div>

            {/* Stats Counter Row */}
            <div className="hero-metrics-row">
              <div className="metric-item">
                <div className="metric-number">24X7</div>
                <div className="metric-title">Dịch Vụ Hỗ Trợ Khẩn Cấp</div>
              </div>
              <div className="metric-item">
                <div className="metric-number">25K</div>
                <div className="metric-title">Bệnh Nhân Đã Hồi Phục</div>
              </div>
              <div className="metric-item">
                <div className="metric-number">15+</div>
                <div className="metric-title">Năm Kinh Nghiệm Nha Khoa</div>
              </div>
            </div>
          </div>

          {/* Right Image Column with Rounded Doctor Image & 5-Star Card */}
          <div className="hero-media-col">
            <div className="hero-image-wrapper">
              {/* Main Rounded Image */}
              <img
                src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1000&q=80"
                alt="Bác sĩ nha khoa điều trị chuyên nghiệp"
                className="hero-dentist-img"
              />

              {/* Floating 5-Star Review Card */}
              <div className="hero-floating-review-card">
                <div className="review-stars-row">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={17} className="star-fill-purple" fill="#6366F1" />
                  ))}
                </div>
                <h4 className="review-card-title">Dịch Vụ Tiêu Chuẩn 5 Sao</h4>
                <p className="review-card-desc">
                  Phòng khám nha khoa tốt là cơ sở cho một xã hội văn minh, tươi đẹp.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          2. SERVICES SECTION (Matched to Reference Image 2)
          ============================================================ */}
      <section className="prime-section prime-services-section" id="services">
        <div className="prime-container">
          {/* Section Header */}
          <div className="services-section-header">
            <div className="section-title-wrap">
              <div className="section-pill-tag">
                <Heart size={14} className="tag-icon" />
                <span>DỊCH VỤ CỦA CHÚNG TÔI</span>
              </div>
              <h2 className="section-main-heading">
                Dịch vụ chăm sóc răng miệng vì một nụ cười tươi sáng
              </h2>
            </div>

            <button
              className="btn-prime-pill"
              onClick={() => setShowAllServices(!showAllServices)}
            >
              <span>{showAllServices ? 'Thu Gọn Dịch Vụ' : 'Xem Tất Cả Dịch Vụ'}</span>
              <Plus size={16} className={`pill-plus-icon ${showAllServices ? 'rotated' : ''}`} />
            </button>
          </div>

          {/* Service Cards Grid */}
          <div className="services-cards-grid">
            {(showAllServices ? [...mainServices, ...extraServices] : mainServices).map((service) => (
              <div key={service.id} className="service-card-modern">
                {/* Top Row: Icon + Title + Arrow */}
                <div className="service-card-top">
                  <div className="service-card-title-group">
                    <div
                      className="service-icon-box"
                      style={{ backgroundColor: service.iconBg }}
                    >
                      {service.icon}
                    </div>
                    <h3 className="service-card-name">{service.title}</h3>
                  </div>
                  <button
                    className="service-card-arrow-btn"
                    onClick={onRegisterClick}
                    aria-label={`Xem chi tiết ${service.title}`}
                  >
                    {service.arrowType === 'right' ? (
                      <ArrowRight size={20} />
                    ) : (
                      <ArrowUpRight size={20} />
                    )}
                  </button>
                </div>

                {/* Description */}
                <p className="service-card-text">{service.desc}</p>

                {/* Image at Bottom */}
                <div className="service-card-photo-wrap">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="service-card-img"
                    loading="lazy"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          3. ABOUT US SECTION (Matched to Reference Image 3)
          ============================================================ */}
      <section className="prime-section prime-about-section" id="about">
        <div className="prime-container about-container-grid">
          {/* Left Column: Images */}
          <div className="about-media-col">
            <div className="about-media-stack">
              {/* Primary Large Image */}
              <div className="about-large-img-card">
                <img
                  src="https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=900&q=80"
                  alt="Phòng khám trang thiết bị hiện đại"
                  className="about-large-img"
                />
              </div>

              {/* Overlapping Badge Card */}
              <div className="about-overlapping-badge">
                <div className="overlapping-img-backdrop">
                  <img
                    src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=500&q=80"
                    alt="Bác sĩ giàu kinh nghiệm"
                    className="overlapping-photo"
                  />
                  <div className="overlapping-gradient-overlay" />
                  <div className="overlapping-text-box">
                    <div className="exp-years-large">25+</div>
                    <div className="exp-description">
                      Năm kinh nghiệm trong lĩnh vực sức khỏe răng miệng
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Content */}
          <div className="about-content-col">
            <div className="section-pill-tag">
              <SmilePlus size={14} className="tag-icon" />
              <span>VỀ CHÚNG TÔI</span>
            </div>

            <h2 className="about-main-heading">
              Cam kết tuyệt đối với sức khỏe và vẻ đẹp nơi nụ cười của bạn
            </h2>

            <p className="about-body-paragraph">
              Với số lượng phòng khám trải dài trên thế giới, mục tiêu của phòng khám chúng tôi là
              cung cấp dịch vụ nha khoa thân thiện, chu đáo và mức độ cao nhất về các phương
              pháp điều trị nha khoa tổng quát, thẩm mỹ và chuyên khoa.
            </p>

            {/* Performance Stats */}
            <div className="about-metrics-row">
              <div className="about-stat-item">
                <div className="stat-percentage">98%</div>
                <div className="stat-label">
                  Thành Công Trong<br />Điều Trị Invisalign
                </div>
              </div>
              <div className="stat-separator" />
              <div className="about-stat-item">
                <div className="stat-percentage">100%</div>
                <div className="stat-label">Khách Hàng Hài Lòng</div>
              </div>
            </div>

            {/* Action & Founder Profile */}
            <div className="about-actions-row">
              <button className="btn-prime-pill" onClick={onRegisterClick}>
                <span>Tìm Hiểu Thêm</span>
                <Plus size={16} />
              </button>

              <div className="about-founder-card">
                <img
                  src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=140&q=80"
                  alt="TS. BS. Nguyễn Hoàng Nam"
                  className="founder-avatar"
                />
                <div className="founder-info">
                  <div className="founder-name">TS. BS. Nguyễn Hoàng Nam</div>
                  <div className="founder-role">Đồng sáng lập & Giám đốc Chuyên môn</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          4. DOCTORS / SPECIALISTS SECTION
          ============================================================ */}
      <section className="prime-section prime-doctors-section" id="doctors">
        <div className="prime-container">
          <div className="section-center-header">
            <div className="section-pill-tag">
              <UserCheck size={14} className="tag-icon" />
              <span>ĐỘI NGŨ BÁC SĨ CHUYÊN KHOA</span>
            </div>
            <h2 className="section-main-heading">
              Bác sĩ chuyên gia giàu kinh nghiệm & y đức
            </h2>
            <p className="section-subtitle-text">
              100% bác sĩ tại Primecare tốt nghiệp chính quy các trường Y khoa danh tiếng và tu
              nghiệp chuyên sâu tại nước ngoài.
            </p>
          </div>

          <div className="doctors-grid">
            {doctors.map((doc, idx) => (
              <div key={idx} className="doctor-card-modern">
                <div className="doctor-photo-wrap">
                  <img
                    src={doc.image}
                    alt={doc.name}
                    className="doctor-img"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80';
                    }}
                  />
                  <span className="doctor-badge-chip">{doc.badge}</span>
                </div>
                <div className="doctor-card-body">
                  <h3 className="doctor-name">{doc.name}</h3>
                  <p className="doctor-role">{doc.role}</p>
                  <div className="doctor-details">
                    <div className="doctor-degree">{doc.degree}</div>
                    <div className="doctor-exp">
                      <Clock size={12} />
                      <span>{doc.exp}</span>
                    </div>
                  </div>
                  <button className="btn-doc-book" onClick={onRegisterClick}>
                    <span>Đặt lịch tư vấn</span>
                    <Calendar size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ============================================================
          6. REVIEWS / TESTIMONIALS SECTION
          ============================================================ */}
      <section className="prime-section prime-reviews-section" id="reviews">
        <div className="prime-container">
          <div className="section-center-header">
            <div className="section-pill-tag">
              <Star size={14} className="tag-icon" />
              <span>CẢM NHẬN KHÁCH HÀNG</span>
            </div>
            <h2 className="section-main-heading">Hàng ngàn nụ cười đã được thắp sáng</h2>
            <p className="section-subtitle-text">
              Lắng nghe câu chuyện thực tế từ những bệnh nhân đã tin tưởng gửi gắm nụ cười tại
              Primecare.
            </p>
          </div>

          <div className="reviews-grid">
            {testimonials.map((item, idx) => (
              <div key={idx} className="review-card-modern">
                <div className="review-card-stars">
                  {[...Array(item.stars)].map((_, sIdx) => (
                    <Star key={sIdx} size={16} className="star-fill-gold" fill="#F59E0B" />
                  ))}
                </div>
                <p className="review-card-comment">"{item.content}"</p>
                <div className="review-card-patient">
                  <img src={item.avatar} alt={item.name} className="patient-avatar" />
                  <div>
                    <h4 className="patient-name">{item.name}</h4>
                    <span className="patient-service">{item.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          7. FAQ ACCORDION SECTION
          ============================================================ */}
      <section className="prime-section prime-faq-section" id="faq">
        <div className="prime-container faq-container">
          <div className="section-center-header">
            <div className="section-pill-tag">
              <Award size={14} className="tag-icon" />
              <span>CÂU HỎI THƯỜNG GẶP</span>
            </div>
            <h2 className="section-main-heading">Giải đáp thắc mắc về khám & điều trị</h2>
          </div>

          <div className="faq-list">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className={`faq-item-card ${isOpen ? 'open' : ''}`}>
                  <button
                    className="faq-question-btn"
                    onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                    aria-expanded={isOpen}
                  >
                    <span>{faq.q}</span>
                    <span className="faq-chevron-wrap">
                      {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </span>
                  </button>
                  {isOpen && <div className="faq-answer-content">{faq.a}</div>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================
          8. CALL TO ACTION BANNER
          ============================================================ */}
      <section className="prime-cta-section">
        <div className="prime-container cta-banner-inner">
          <div className="cta-banner-content">
            <span className="cta-badge">ƯU ĐÃI THÁNG NÀY</span>
            <h2 className="cta-title">Sẵn sàng để sở hữu nụ cười rạng ngời tự tin?</h2>
            <p className="cta-desc">
              Đăng ký ngay hôm nay để nhận gói khám và chụp phim X-Quang miễn phí 100% cùng đội
              ngũ bác sĩ chuyên gia tại Primecare.
            </p>
            <div className="cta-buttons-wrap">
              <button className="btn-cta-white" onClick={onRegisterClick}>
                <Calendar size={18} />
                <span>Đặt Lịch Khám Miễn Phí</span>
              </button>
              <a href="tel:+84123456789" className="btn-cta-phone">
                <PhoneCall size={18} />
                <span>Hotline: +84 123456789</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

