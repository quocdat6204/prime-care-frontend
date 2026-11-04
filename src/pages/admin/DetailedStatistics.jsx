import { useState, useEffect, useCallback } from 'react';
import { statisticService } from '../../services/statisticService';
import { useToast } from '../../context/ToastContext';
import {
  TrendingUp, DollarSign, Calendar, Users, Stethoscope,
  Activity, Pill, CreditCard, RefreshCw, Layers,
  ChevronRight, Award, ArrowUpRight, BarChart3, PieChart
} from 'lucide-react';
import { formatDoctorRank } from '../../utils/doctorRank';

export default function DetailedStatistics() {
  const toast = useToast();

  // Helper date calculations: default to last 30 days
  const getDefaultDates = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    return {
      from: start.toISOString().split('T')[0],
      to: end.toISOString().split('T')[0],
    };
  };

  const defaultDates = getDefaultDates();
  const [dateRange, setDateRange] = useState({
    from: defaultDates.from,
    to: defaultDates.to,
  });
  const [groupBy, setGroupBy] = useState('DAY'); // 'DAY' | 'MONTH'

  // Loading states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 9 APIs State
  const [revenueData, setRevenueData] = useState(null);               // API 2
  const [serviceTypeRevenue, setServiceTypeRevenue] = useState(null); // API 3
  const [appointmentStats, setAppointmentStats] = useState(null);     // API 4
  const [shiftStats, setShiftStats] = useState(null);                 // API 5
  const [doctorPerf, setDoctorPerf] = useState(null);                 // API 6
  const [patientGrowth, setPatientGrowth] = useState(null);           // API 7
  const [topServices, setTopServices] = useState(null);               // API 8
  const [topMedications, setTopMedications] = useState(null);         // API 9
  const [paymentSummary, setPaymentSummary] = useState(null);         // API 10

  const fetchAllStatistics = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    const { from, to } = dateRange;
    const params = { from, to };

    try {
      const [
        revRes,
        srvTypeRes,
        appRes,
        shiftRes,
        docRes,
        patRes,
        topSrvRes,
        topMedRes,
        payRes,
      ] = await Promise.allSettled([
        statisticService.getRevenue({ ...params, groupBy }),
        statisticService.getRevenueByServiceType(params),
        statisticService.getAppointmentStats({ ...params, groupBy }),
        statisticService.getAppointmentsByShift(params),
        statisticService.getDoctorPerformance(params),
        statisticService.getPatientGrowth({ ...params, groupBy: groupBy === 'DAY' ? 'DAY' : 'MONTH' }),
        statisticService.getTopServices({ ...params, limit: 6 }),
        statisticService.getTopMedications({ ...params, limit: 6 }),
        statisticService.getPaymentSummary(params),
      ]);

      if (revRes.status === 'fulfilled') setRevenueData(revRes.value.data.result);
      if (srvTypeRes.status === 'fulfilled') setServiceTypeRevenue(srvTypeRes.value.data.result);
      if (appRes.status === 'fulfilled') setAppointmentStats(appRes.value.data.result);
      if (shiftRes.status === 'fulfilled') setShiftStats(shiftRes.value.data.result);
      if (docRes.status === 'fulfilled') setDoctorPerf(docRes.value.data.result);
      if (patRes.status === 'fulfilled') setPatientGrowth(patRes.value.data.result);
      if (topSrvRes.status === 'fulfilled') setTopServices(topSrvRes.value.data.result);
      if (topMedRes.status === 'fulfilled') setTopMedications(topMedRes.value.data.result);
      if (payRes.status === 'fulfilled') setPaymentSummary(payRes.value.data.result);
    } catch (err) {
      toast.error('Không thể tải toàn bộ dữ liệu thống kê chi tiết');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dateRange, groupBy, toast]);

  useEffect(() => {
    fetchAllStatistics();
  }, [fetchAllStatistics]);

  // Quick preset ranges
  const applyPreset = (preset) => {
    const end = new Date();
    let start = new Date();

    if (preset === 'THIS_MONTH') {
      start = new Date(end.getFullYear(), end.getMonth(), 1);
    } else if (preset === 'LAST_MONTH') {
      start = new Date(end.getFullYear(), end.getMonth() - 1, 1);
      end.setDate(0); // Last day of last month
    } else if (preset === '30_DAYS') {
      start.setDate(end.getDate() - 30);
    } else if (preset === '90_DAYS') {
      start.setDate(end.getDate() - 90);
    }

    setDateRange({
      from: start.toISOString().split('T')[0],
      to: end.toISOString().split('T')[0],
    });
  };

  const formatVND = (amount) => {
    return (Number(amount) || 0).toLocaleString('vi-VN') + ' đ';
  };

  const getServiceTypeBadge = (type) => {
    switch (type) {
      case 'DENTAL':
        return { label: 'Nha khoa điều trị', bg: '#eff6ff', color: '#1d4ed8' };
      case 'IMAGING':
        return { label: 'Chẩn đoán hình ảnh', bg: '#ede9fe', color: '#6d28d9' };
      case 'LAB_TEST':
        return { label: 'Xét nghiệm', bg: '#fff7ed', color: '#c2410c' };
      default:
        return { label: type || 'Khác', bg: '#f1f5f9', color: '#475569' };
    }
  };

  return (
    <div className="management-page" style={{ maxWidth: 1320, margin: '0 auto' }}>
      {/* 1. Header with Controls */}
      <div
        className="card"
        style={{
          padding: '20px 24px',
          marginBottom: 24,
          borderRadius: 16,
          background: '#fff',
          border: '1px solid #ede9fe',
          boxShadow: '0 4px 20px rgba(124, 58, 237, 0.05)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 6px 14px rgba(124, 58, 237, 0.3)',
              }}
            >
              <BarChart3 size={24} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 800, color: 'var(--gray-900)' }}>
                Báo cáo & Thống kê Chi tiết
              </h1>
              <p style={{ margin: '4px 0 0', color: 'var(--gray-500)', fontSize: '0.875rem' }}>
                Phân tích dòng tiền, lượt khám, hiệu suất bác sĩ, tăng trưởng bệnh nhân và dược phẩm
              </p>
            </div>
          </div>

          <button
            onClick={() => fetchAllStatistics(true)}
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 40 }}
            disabled={loading || refreshing}
          >
            <RefreshCw size={15} className={refreshing ? 'spin-slow' : ''} />
            <span>{refreshing ? 'Đang cập nhật...' : 'Làm mới báo cáo'}</span>
          </button>
        </div>

        {/* Date Filter & GroupBy Row */}
        <div
          style={{
            marginTop: 20,
            paddingTop: 16,
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          {/* Presets */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--gray-500)', marginRight: 4 }}>
              Kỳ báo cáo:
            </span>
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={() => applyPreset('30_DAYS')}
              style={{ fontSize: '0.8rem', height: 32 }}
            >
              30 ngày qua
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={() => applyPreset('THIS_MONTH')}
              style={{ fontSize: '0.8rem', height: 32 }}
            >
              Tháng này
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={() => applyPreset('LAST_MONTH')}
              style={{ fontSize: '0.8rem', height: 32 }}
            >
              Tháng trước
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={() => applyPreset('90_DAYS')}
              style={{ fontSize: '0.8rem', height: 32 }}
            >
              90 ngày qua
            </button>
          </div>

          {/* Date Range Inputs & GroupBy */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>Từ:</span>
              <input
                type="date"
                className="form-input"
                value={dateRange.from}
                onChange={(e) => setDateRange((prev) => ({ ...prev, from: e.target.value }))}
                style={{ height: 34, padding: '4px 8px', fontSize: '0.8125rem' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>Đến:</span>
              <input
                type="date"
                className="form-input"
                value={dateRange.to}
                onChange={(e) => setDateRange((prev) => ({ ...prev, to: e.target.value }))}
                style={{ height: 34, padding: '4px 8px', fontSize: '0.8125rem' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>Gom nhóm:</span>
              <select
                className="form-select"
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value)}
                style={{ height: 34, padding: '4px 24px 4px 8px', fontSize: '0.8125rem', width: 'auto' }}
              >
                <option value="DAY">Theo Ngày</option>
                <option value="MONTH">Theo Tháng</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ padding: 60, textAlign: 'center', borderRadius: 16 }}>
          <div className="spinner" style={{ margin: '0 auto', width: 36, height: 36 }} />
          <p style={{ marginTop: 16, color: 'var(--gray-500)', fontSize: '0.9rem' }}>
            Đang tổng hợp số liệu phân tán từ 3 microservices qua OpenFeign...
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* ========================================================= */}
          {/* SECTION 1: DOANH THU & DÒNG TIỀN (API 2, API 3, API 10)  */}
          {/* ========================================================= */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
            {/* API 2: Doanh thu theo chuỗi thời gian */}
            <div className="card" style={{ padding: 22, borderRadius: 16, border: '1px solid #ede9fe' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--gray-900)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <DollarSign size={18} color="#059669" />
                    <span>Doanh thu theo thời gian (API 2)</span>
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--gray-500)' }}>
                    Tách riêng tiền khám ban đầu & tiền dịch vụ chỉ định
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', fontWeight: 600 }}>Tổng doanh thu kỳ này</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669' }}>
                    {formatVND(revenueData?.totalRevenue)}
                  </div>
                </div>
              </div>

              {/* Data Rows preview */}
              <div style={{ maxHeight: 250, overflowY: 'auto' }}>
                <table className="data-table" style={{ fontSize: '0.8125rem' }}>
                  <thead>
                    <tr>
                      <th>Thời gian</th>
                      <th>Tiền khám</th>
                      <th>Dịch vụ</th>
                      <th style={{ textAlign: 'right' }}>Tổng cộng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(!revenueData?.data || revenueData.data.length === 0) ? (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 20 }}>
                          Không có giao dịch trong khoảng thời gian này
                        </td>
                      </tr>
                    ) : (
                      revenueData.data.slice(-10).map((row, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600 }}>{row.label}</td>
                          <td style={{ color: '#2563eb' }}>{formatVND(row.examination)}</td>
                          <td style={{ color: '#7c3aed' }}>{formatVND(row.services)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: '#059669' }}>
                            {formatVND(row.total)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* API 3: Cơ cấu doanh thu theo nhóm dịch vụ */}
            <div className="card" style={{ padding: 22, borderRadius: 16, border: '1px solid #ede9fe' }}>
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--gray-900)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <PieChart size={18} color="#7c3aed" />
                  <span>Cơ cấu doanh thu dịch vụ (API 3)</span>
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--gray-500)' }}>
                  Tỷ trọng đóng góp: Xét nghiệm, Chẩn đoán hình ảnh, Nha khoa điều trị...
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {(!serviceTypeRevenue?.data || serviceTypeRevenue.data.length === 0) ? (
                  <div style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 30 }}>
                    Chưa có số liệu phân bổ dịch vụ
                  </div>
                ) : (
                  serviceTypeRevenue.data.map((item, idx) => {
                    const badge = getServiceTypeBadge(item.serviceType);
                    return (
                      <div key={idx} style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span className="badge" style={{ background: badge.bg, color: badge.color, fontWeight: 700, fontSize: '0.75rem' }}>
                            {badge.label}
                          </span>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#059669' }}>
                            {formatVND(item.revenue)} ({item.percentage}%)
                          </span>
                        </div>
                        {/* Progress Bar */}
                        <div style={{ height: 6, background: '#e2e8f0', borderRadius: 9999, overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${Math.min(100, item.percentage || 0)}%`,
                              background: badge.color,
                              height: '100%',
                              borderRadius: 9999,
                            }}
                          />
                        </div>
                        <div style={{ marginTop: 4, fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                          Đã thực hiện: <strong>{item.count}</strong> lượt chỉ định
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* API 10: Tổng kết Thanh toán & Cổng VNPay */}
          <div className="card" style={{ padding: 22, borderRadius: 16, border: '1px solid #ede9fe' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--gray-900)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CreditCard size={18} color="#2563eb" />
                  <span>Tổng kết Cổng Thanh toán VNPAY (API 10)</span>
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--gray-500)' }}>
                  Tỷ lệ thanh toán thành công, trạng thái hóa đơn và top ngân hàng
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="badge" style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', fontSize: '0.8rem', padding: '4px 10px' }}>
                  Tỷ lệ thành công: <strong>{paymentSummary?.paymentSuccessRate || 0}%</strong>
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
              <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', fontWeight: 600 }}>Tổng số hóa đơn</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--gray-900)', marginTop: 2 }}>
                  {paymentSummary?.totalInvoices || 0}
                </div>
              </div>
              <div style={{ background: '#f0fdf4', padding: 14, borderRadius: 10, border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: 600 }}>Hóa đơn đã thanh toán</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#15803d', marginTop: 2 }}>
                  {paymentSummary?.paidInvoices || 0}
                </div>
              </div>
              <div style={{ background: '#fffbeb', padding: 14, borderRadius: 10, border: '1px solid #fde68a' }}>
                <div style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 600 }}>Đang chờ thanh toán</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#b45309', marginTop: 2 }}>
                  {paymentSummary?.pendingInvoices || 0}
                </div>
              </div>
              <div style={{ background: '#fef2f2', padding: 14, borderRadius: 10, border: '1px solid #fecaca' }}>
                <div style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 600 }}>Hóa đơn đã hủy</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#dc2626', marginTop: 2 }}>
                  {paymentSummary?.cancelledInvoices || 0}
                </div>
              </div>
            </div>

            {/* Top Banks */}
            {paymentSummary?.topBanks && paymentSummary.topBanks.length > 0 && (
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--gray-700)', marginBottom: 8 }}>
                  Top ngân hàng được bệnh nhân thanh toán nhiều nhất:
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {paymentSummary.topBanks.map((b, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '6px 12px',
                        background: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        borderRadius: 8,
                        fontSize: '0.8rem',
                        color: '#1e40af',
                        fontWeight: 600,
                      }}
                    >
                      🏦 {b.bankCode}: <strong>{b.count}</strong> giao dịch ({formatVND(b.totalAmount)})
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* SECTION 2: LƯỢT KHÁM & CA TRỰC (API 4, API 5)             */}
          {/* ========================================================= */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
            {/* API 4: Lượt khám qua thời gian */}
            <div className="card" style={{ padding: 22, borderRadius: 16, border: '1px solid #ede9fe' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--gray-900)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Calendar size={18} color="#2563eb" />
                    <span>Lượt khám theo thời gian (API 4)</span>
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--gray-500)' }}>
                    Phân bổ: Đã khám, Đã hủy, Quá hạn giữ chỗ
                  </p>
                </div>
                <span className="badge" style={{ background: '#ede9fe', color: '#6d28d9', fontWeight: 700 }}>
                  Tổng: {appointmentStats?.totalAppointments || 0} ca
                </span>
              </div>

              <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                <table className="data-table" style={{ fontSize: '0.8125rem' }}>
                  <thead>
                    <tr>
                      <th>Thời gian</th>
                      <th>Tổng ca</th>
                      <th>Hoàn thành</th>
                      <th>Đã hủy</th>
                      <th>Quá hạn</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(!appointmentStats?.data || appointmentStats.data.length === 0) ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 20 }}>
                          Không có dữ liệu ca khám trong khoảng thời gian này
                        </td>
                      </tr>
                    ) : (
                      appointmentStats.data.slice(-8).map((row, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600 }}>{row.label}</td>
                          <td style={{ fontWeight: 700 }}>{row.total}</td>
                          <td style={{ color: '#15803d', fontWeight: 600 }}>{row.completed}</td>
                          <td style={{ color: '#dc2626' }}>{row.cancelled}</td>
                          <td style={{ color: '#d97706' }}>{row.expired}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* API 5: Phân bổ theo Ca trực Sáng / Chiều */}
            <div className="card" style={{ padding: 22, borderRadius: 16, border: '1px solid #ede9fe' }}>
              <div style={{ marginBottom: 14 }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--gray-900)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Activity size={18} color="#d97706" />
                  <span>Hiệu suất theo Ca trực Sáng / Chiều (API 5)</span>
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--gray-500)' }}>
                  So sánh mật độ bệnh nhân ca Sáng (MORNING) và ca Chiều (AFTERNOON)
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {(!shiftStats?.data || shiftStats.data.length === 0) ? (
                  <div style={{ colSpan: 2, textAlign: 'center', color: 'var(--gray-400)', padding: 20 }}>
                    Chưa có số liệu ca trực
                  </div>
                ) : (
                  shiftStats.data.map((shift, idx) => {
                    const isMorning = shift.shift === 'MORNING';
                    return (
                      <div
                        key={idx}
                        style={{
                          background: isMorning ? '#fffbeb' : '#f0f9ff',
                          border: `1px solid ${isMorning ? '#fde68a' : '#bae6fd'}`,
                          borderRadius: 12,
                          padding: 14,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, color: isMorning ? '#b45309' : '#0369a1', marginBottom: 8 }}>
                          <span>{isMorning ? '🌅 CA SÁNG' : '🌇 CA CHIỀU'}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.8125rem' }}>
                          <div>Số ca trực mở: <strong>{shift.totalSessions}</strong></div>
                          <div>Tổng lượt đăng ký: <strong>{shift.totalAppointments}</strong></div>
                          <div>Khám hoàn tất: <strong style={{ color: '#15803d' }}>{shift.completedAppointments}</strong></div>
                          <div style={{ marginTop: 4, paddingTop: 4, borderTop: '1px dashed #cbd5e1', fontWeight: 700, color: '#475569' }}>
                            Mật độ TB: {shift.avgPatientsPerSession} BN/ca
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* SECTION 3: HIỆU SUẤT BÁC SĨ (API 6)                       */}
          {/* ========================================================= */}
          <div className="card" style={{ padding: 22, borderRadius: 16, border: '1px solid #ede9fe' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--gray-900)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Stethoscope size={18} color="#2563eb" />
                  <span>Báo cáo Hiệu suất Bác sĩ (API 6)</span>
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--gray-500)' }}>
                  Xếp hạng số lượng ca khám, tỷ lệ hoàn tất và doanh thu đóng góp của từng bác sĩ
                </p>
              </div>
            </div>

            <div className="table-responsive">
              <table className="data-table" style={{ fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th>Bác sĩ</th>
                    <th>Học vị / Chuyên khoa</th>
                    <th>Số ca trực</th>
                    <th>Lượt tiếp nhận</th>
                    <th>Khám hoàn tất</th>
                    <th>TB BN/Ca</th>
                    <th style={{ textAlign: 'right' }}>Doanh thu đóng góp</th>
                  </tr>
                </thead>
                <tbody>
                  {(!doctorPerf?.data || doctorPerf.data.length === 0) ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 24 }}>
                        Không có số liệu ca khám bác sĩ trong khoảng thời gian này
                      </td>
                    </tr>
                  ) : (
                    doctorPerf.data.map((doc, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 700, color: 'var(--gray-900)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                background: '#ede9fe',
                                color: '#6d28d9',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '0.75rem',
                              }}
                            >
                              {doc.doctorName?.charAt(0) || 'D'}
                            </div>
                            <span>{doc.doctorName}</span>
                          </div>
                        </td>
                        <td style={{ color: 'var(--gray-600)', fontSize: '0.8rem' }}>
                          {formatDoctorRank(doc.rank) || 'Bác sĩ chuyên khoa'}
                        </td>
                        <td style={{ fontWeight: 600 }}>{doc.totalSessions}</td>
                        <td>{doc.totalAppointments}</td>
                        <td style={{ color: '#15803d', fontWeight: 700 }}>{doc.completedAppointments}</td>
                        <td style={{ fontWeight: 600, color: '#475569' }}>{doc.avgPatientsPerSession}</td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: '#059669' }}>
                          {formatVND(doc.revenue)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ========================================================= */}
          {/* SECTION 4: TĂNG TRƯỞNG BỆNH NHÂN (API 7)                  */}
          {/* ========================================================= */}
          <div className="card" style={{ padding: 22, borderRadius: 16, border: '1px solid #ede9fe' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--gray-900)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Users size={18} color="#0d9488" />
                  <span>Tốc độ Tăng trưởng Bệnh nhân mới (API 7)</span>
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--gray-500)' }}>
                  Lượng bệnh nhân đăng ký mới và đường tích lũy quy mô khách hàng
                </p>
              </div>
              <span className="badge" style={{ background: '#ccfbf1', color: '#0f766e', fontWeight: 700, fontSize: '0.8rem' }}>
                Tổng quy mô tích lũy: {patientGrowth?.totalPatients || 0} bệnh nhân
              </span>
            </div>

            <div className="table-responsive">
              <table className="data-table" style={{ fontSize: '0.8125rem' }}>
                <thead>
                  <tr>
                    <th>Mốc thời gian</th>
                    <th>Bệnh nhân mới đăng ký</th>
                    <th>Quy mô tích lũy (Lũy kế)</th>
                  </tr>
                </thead>
                <tbody>
                  {(!patientGrowth?.data || patientGrowth.data.length === 0) ? (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 20 }}>
                        Chưa có số liệu tăng trưởng bệnh nhân
                      </td>
                    </tr>
                  ) : (
                    patientGrowth.data.map((row, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>{row.label}</td>
                        <td>
                          <span className="badge" style={{ background: '#dcfce7', color: '#15803d', fontWeight: 700 }}>
                            +{row.newPatients} bệnh nhân
                          </span>
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--gray-800)' }}>
                          {row.cumulativeTotal} hồ sơ
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ========================================================= */}
          {/* SECTION 5: TOP DỊCH VỤ & TOP THUỐC (API 8, API 9)         */}
          {/* ========================================================= */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
            {/* API 8: Top Dịch vụ nha khoa */}
            <div className="card" style={{ padding: 22, borderRadius: 16, border: '1px solid #ede9fe' }}>
              <div style={{ marginBottom: 14 }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--gray-900)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Award size={18} color="#f59e0b" />
                  <span>Top Dịch vụ Nha khoa chỉ định nhiều (API 8)</span>
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--gray-500)' }}>
                  Xếp hạng theo số lượt chỉ định cận lâm sàng & thủ thuật
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(!topServices?.data || topServices.data.length === 0) ? (
                  <div style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 24 }}>
                    Chưa có dịch vụ nào được chỉ định trong kỳ
                  </div>
                ) : (
                  topServices.data.map((srv, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: 10,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            background: idx === 0 ? '#fef3c7' : '#f1f5f9',
                            color: idx === 0 ? '#b45309' : '#64748b',
                            fontWeight: 800,
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {idx + 1}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--gray-900)' }}>
                            {srv.serviceName}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                            Đã làm: <strong>{srv.usageCount}</strong> lần
                          </div>
                        </div>
                      </div>

                      <div style={{ fontWeight: 800, color: '#059669', fontSize: '0.85rem' }}>
                        {formatVND(srv.revenue)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* API 9: Top Thuốc kê đơn */}
            <div className="card" style={{ padding: 22, borderRadius: 16, border: '1px solid #ede9fe' }}>
              <div style={{ marginBottom: 14 }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--gray-900)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Pill size={18} color="#7c3aed" />
                  <span>Top Thuốc Kê Đơn nhiều nhất (API 9)</span>
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--gray-500)' }}>
                  Dược phẩm, kháng sinh & giảm đau xuất kho nhiều nhất
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(!topMedications?.data || topMedications.data.length === 0) ? (
                  <div style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 24 }}>
                    Chưa có đơn thuốc nào được kê trong kỳ
                  </div>
                ) : (
                  topMedications.data.map((med, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: 10,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            background: idx === 0 ? '#ede9fe' : '#f1f5f9',
                            color: idx === 0 ? '#6d28d9' : '#64748b',
                            fontWeight: 800,
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {idx + 1}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--gray-900)' }}>
                            {med.medicineName}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                            Hàm lượng: <strong>{med.strength || 'Chuẩn'}</strong>
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, color: '#7c3aed', fontSize: '0.85rem' }}>
                          {med.prescriptionCount} đơn thuốc
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                          Xuất: <strong>{med.totalQuantity}</strong> viên/gói
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

