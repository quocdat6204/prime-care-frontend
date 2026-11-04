import { useState, useEffect, useCallback, useMemo } from 'react';
import { userService } from '../../services/userService';
import { useToast } from '../../context/ToastContext';
import {
  Search, Plus, Lock, Unlock, Trash2, Edit, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, Users, Stethoscope, Shield, Award, HeartPulse,
  RefreshCw, ArrowUpDown, Calendar
} from 'lucide-react';
import CreateUserModal from './CreateUserModal';
import EditUserModal from './EditUserModal';
import UserAppointmentsModal from './UserAppointmentsModal';

const roleLabels = { ADMIN: 'Admin', DOCTOR: 'Bác sĩ', PATIENT: 'Bệnh nhân', USER: 'User' };
const statusLabels = { ACTIVE: 'Hoạt động', INACTIVE: 'Chưa kích hoạt', LOCKED: 'Đã khóa' };
const rankLabels = { PROFESSOR: 'Giáo sư', DOCTORATE: 'Tiến sĩ', MASTER: 'Thạc sĩ' };

export default function UserManagement() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [roleFilter, setRoleFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [sortDirection, setSortDirection] = useState('ASC');
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewAppointmentsUser, setViewAppointmentsUser] = useState(null);

  // Debounce search input to avoid spamming the backend API on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(searchTerm.trim());
      setPage(0);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, size, direction: sortDirection };
      if (roleFilter) params.role = roleFilter;
      if (debouncedKeyword) params.keyword = debouncedKeyword;
      const res = await userService.getUsers(params);
      const data = res.data.result;
      setUsers(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      toast.error('Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  }, [page, size, roleFilter, debouncedKeyword, sortDirection, toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleLock = async (id) => {
    if (!window.confirm('Bạn có chắc muốn khóa tài khoản này?')) return;
    try {
      await userService.lockUser(id);
      toast.success('Đã khóa tài khoản');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Khóa tài khoản thất bại');
    }
  };

  const handleUnlock = async (id) => {
    try {
      await userService.unlockUser(id);
      toast.success('Đã mở khóa tài khoản');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Mở khóa thất bại');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa người dùng này? Hành động này không thể hoàn tác!')) return;
    try {
      await userService.deleteUser(id);
      toast.success('Đã xóa người dùng');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xóa thất bại');
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'DOCTOR':
        return <Stethoscope size={13} />;
      case 'ADMIN':
        return <Shield size={13} />;
      default:
        return <HeartPulse size={13} />;
    }
  };

  // Generate pagination page numbers smart range
  const paginationRange = useMemo(() => {
    if (totalPages <= 1) return [0];
    const range = [];
    const maxVisible = 5;
    let start = Math.max(0, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages - 1, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(0, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      range.push(i);
    }
    return range;
  }, [page, totalPages]);

  return (
    <div>
      {/* Page Title & Stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.65rem' }}>Quản lý người dùng</h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--gray-500)' }}>
            Quản trị danh sách Bác sĩ nha khoa, Bệnh nhân và phân quyền toàn hệ thống
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="btn btn-outline" onClick={fetchUsers} title="Tải lại danh sách" disabled={loading}>
            <RefreshCw size={15} className={loading ? 'spin-slow' : ''} />
            <span>Làm mới</span>
          </button>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} /> <span>Thêm người dùng</span>
          </button>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="management-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div className="management-filters" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Quick Search */}
          <div style={{ position: 'relative', width: 260 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Tìm theo tên, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: 36, height: 38, fontSize: '0.875rem' }}
            />
          </div>

          {/* Role Filter */}
          <select
            className="form-select"
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(0);
            }}
            style={{ minWidth: 160, height: 38, fontSize: '0.875rem' }}
          >
            <option value="">Tất cả vai trò</option>
            <option value="PATIENT">Bệnh nhân (PATIENT)</option>
            <option value="DOCTOR">Bác sĩ Nha khoa (DOCTOR)</option>
            <option value="ADMIN">Quản trị viên (ADMIN)</option>
          </select>

          <span style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', marginLeft: 4 }}>
            Tổng số: <strong style={{ color: 'var(--gray-800)' }}>{totalElements}</strong> tài khoản
          </span>
        </div>
      </div>

      {/* Table Card */}
      <div className="card" style={{ overflow: 'hidden', border: '1px solid #ede9fe', borderRadius: 16 }}>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th
                  onClick={() => setSortDirection(prev => prev === 'ASC' ? 'DESC' : 'ASC')}
                  style={{ cursor: 'pointer', userSelect: 'none', width: 85 }}
                  title={`Sắp xếp theo ID: hiện tại ${sortDirection === 'ASC' ? 'Tăng dần (1-N)' : 'Giảm dần (N-1)'}. Nhấn để đổi chiều.`}
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <span>#ID</span>
                    <ArrowUpDown size={13} style={{ color: '#7c3aed' }} />
                  </div>
                </th>
                <th>Người dùng</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Số điện thoại</th>
                <th>Thông tin riêng</th>
                <th style={{ textAlign: 'right', minWidth: 140 }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 48 }}>
                    <div className="spinner" style={{ margin: '0 auto' }} />
                    <p style={{ marginTop: 12, fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                      Đang tải danh sách người dùng...
                    </p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 48, color: 'var(--gray-400)' }}>
                    {debouncedKeyword
                      ? `Không tìm thấy người dùng nào phù hợp với từ khóa "${debouncedKeyword}"`
                      : 'Không tìm thấy người dùng nào phù hợp'}
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isPatient = u.role === 'PATIENT' || u.role === 'USER';
                  return (
                    <tr key={u.id} style={{ transition: 'background 0.2s' }}>
                      {/* ID cell */}
                      <td style={{ fontWeight: 700, color: '#6d28d9', fontSize: '0.875rem' }}>
                        #{u.id}
                      </td>
                      {/* User info cell: Bệnh nhân click xem lịch khám; Bác sĩ / Admin click xem sửa thông tin */}
                      <td
                        onClick={() => (isPatient ? setViewAppointmentsUser(u) : setSelectedUser(u))}
                        style={{ cursor: 'pointer' }}
                        title={
                          isPatient
                            ? `Nhấn để xem các lịch khám của ${u.fullName || u.username}`
                            : `Nhấn để xem và chỉnh sửa thông tin của ${u.fullName || u.username}`
                        }
                      >
                      <div className="user-cell">
                        {u.ava ? (
                          <img src={u.ava} alt="" className="avatar avatar-sm" />
                        ) : (
                          <div
                            className="avatar-placeholder avatar-sm"
                            style={{
                              width: 34,
                              height: 34,
                              fontSize: '0.75rem',
                              background: '#ede9fe',
                              color: '#6d28d9',
                              fontWeight: 700,
                            }}
                          >
                            {u.fullName?.charAt(0) || u.username?.charAt(0) || 'U'}
                          </div>
                        )}
                        <div>
                          <div
                            className="user-cell-name"
                            style={{ fontWeight: 600, color: 'var(--primary-700)', textDecoration: 'underline text-decoration-color: #cbd5e1' }}
                          >
                            {u.fullName || u.username}
                          </div>
                          <div className="user-cell-email" style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td>
                      <span className={`badge badge-${u.role?.toLowerCase()}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {getRoleIcon(u.role)}
                        <span>{roleLabels[u.role] || u.role}</span>
                      </span>
                    </td>

                    {/* Status */}
                    <td>
                      <span className={`badge badge-${u.status?.toLowerCase()}`}>
                        {statusLabels[u.status] || u.status}
                      </span>
                    </td>

                    {/* Phone */}
                    <td style={{ color: 'var(--gray-600)', fontSize: '0.8125rem' }}>
                      {u.phone || '—'}
                    </td>

                    {/* Specific details */}
                    <td style={{ fontSize: '0.8125rem', color: 'var(--gray-500)' }}>
                      {u.role === 'DOCTOR' && u.rank && (
                        <span className={`rank-badge rank-${u.rank.toLowerCase()}`} style={{ fontSize: '0.6875rem' }}>
                          <Award size={10} /> {rankLabels[u.rank] || u.rank}
                        </span>
                      )}
                      {u.role === 'PATIENT' && u.gender && (
                        <span>{u.gender === 'MALE' ? 'Nam' : u.gender === 'FEMALE' ? 'Nữ' : 'Khác'}</span>
                      )}
                      {u.role === 'ADMIN' && (
                        <span style={{ color: '#7c3aed', fontWeight: 600, fontSize: '0.75rem' }}>Toàn quyền Admin</span>
                      )}
                    </td>

                    {/* Action buttons */}
                    <td>
                      <div className="actions-cell" style={{ justifyContent: 'flex-end', gap: 4 }}>
                        {/* 0. Xem các lịch khám (CHỈ HIỂN THỊ CHO BỆNH NHÂN) */}
                        {isPatient && (
                          <button
                            className="btn btn-icon btn-sm btn-ghost"
                            title="Xem các lịch khám của bệnh nhân"
                            onClick={() => setViewAppointmentsUser(u)}
                            style={{ color: '#7c3aed' }}
                          >
                            <Calendar size={16} />
                          </button>
                        )}

                        {/* 1. Sửa người dùng */}
                        <button
                          className="btn btn-icon btn-sm btn-ghost"
                          title="Chỉnh sửa thông tin"
                          onClick={() => setSelectedUser(u)}
                          style={{ color: 'var(--primary-600)' }}
                        >
                          <Edit size={16} />
                        </button>

                        {/* 2. Khóa / Mở khóa */}
                        {u.role !== 'ADMIN' && (
                          u.status === 'LOCKED' ? (
                            <button
                              className="btn btn-icon btn-sm btn-ghost"
                              title="Mở khóa tài khoản"
                              onClick={() => handleUnlock(u.id)}
                            >
                              <Unlock size={16} color="var(--success)" />
                            </button>
                          ) : (
                            <button
                              className="btn btn-icon btn-sm btn-ghost"
                              title="Khóa tài khoản"
                              onClick={() => handleLock(u.id)}
                            >
                              <Lock size={16} color="var(--warning)" />
                            </button>
                          )
                        )}

                        {/* 3. Xóa */}
                        {u.role !== 'ADMIN' && (
                          <button
                            className="btn btn-icon btn-sm btn-ghost"
                            title="Xóa người dùng"
                            onClick={() => handleDelete(u.id)}
                          >
                            <Trash2 size={16} color="var(--danger)" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
            </tbody>
          </table>
        </div>

        {/* Complete, Responsive Pagination Bar */}
        <div className="table-pagination-footer">
          {/* Left: Rows per page & Range summary */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', color: 'var(--gray-600)' }}>
              <span>Hiển thị:</span>
              <select
                className="form-select"
                value={size}
                onChange={(e) => {
                  setSize(Number(e.target.value));
                  setPage(0);
                }}
                style={{ width: 'auto', padding: '4px 28px 4px 8px', height: 32, fontSize: '0.8125rem' }}
              >
                <option value={5}>5 dòng</option>
                <option value={10}>10 dòng</option>
                <option value={20}>20 dòng</option>
                <option value={50}>50 dòng</option>
              </select>
            </div>

            <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)' }}>
              Hiển thị{' '}
              <strong style={{ color: 'var(--gray-800)' }}>
                {totalElements === 0 ? 0 : page * size + 1} - {Math.min((page + 1) * size, totalElements)}
              </strong>{' '}
              trên tổng số <strong style={{ color: 'var(--gray-800)' }}>{totalElements}</strong> người dùng
            </div>
          </div>

          {/* Right: Page navigation buttons */}
          <div className="pagination" style={{ padding: 0 }}>
            {/* First Page */}
            <button
              className="pagination-btn"
              disabled={page === 0 || loading}
              onClick={() => setPage(0)}
              title="Trang đầu"
            >
              <ChevronsLeft size={16} />
            </button>

            {/* Prev Page */}
            <button
              className="pagination-btn"
              disabled={page === 0 || loading}
              onClick={() => setPage(page - 1)}
              title="Trang trước"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Page number buttons */}
            {paginationRange.map((p) => (
              <button
                key={p}
                className={`pagination-btn ${page === p ? 'active' : ''}`}
                onClick={() => setPage(p)}
                disabled={loading}
              >
                {p + 1}
              </button>
            ))}

            {/* Next Page */}
            <button
              className="pagination-btn"
              disabled={page >= totalPages - 1 || totalPages === 0 || loading}
              onClick={() => setPage(page + 1)}
              title="Trang tiếp"
            >
              <ChevronRight size={16} />
            </button>

            {/* Last Page */}
            <button
              className="pagination-btn"
              disabled={page >= totalPages - 1 || totalPages === 0 || loading}
              onClick={() => setPage(Math.max(0, totalPages - 1))}
              title="Trang cuối"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* 1. Modal Thêm người dùng mới */}
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            fetchUsers();
          }}
        />
      )}

      {/* 2. Modal Chỉnh sửa thông tin người dùng */}
      {selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onUpdated={(close) => {
            if (close) setSelectedUser(null);
            fetchUsers();
          }}
        />
      )}

      {/* 3. Modal Xem danh sách lịch khám của người dùng */}
      {viewAppointmentsUser && (
        <UserAppointmentsModal
          user={viewAppointmentsUser}
          onClose={() => setViewAppointmentsUser(null)}
        />
      )}
    </div>
  );
}
