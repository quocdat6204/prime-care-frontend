import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL !== undefined ? import.meta.env.VITE_API_URL : '';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag to prevent multiple refresh calls
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor: Attach access token
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Auto refresh token on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip refresh logic for auth endpoints themselves
    if (
      originalRequest.url?.includes('/authenticate/login') ||
      originalRequest.url?.includes('/authenticate/register') ||
      originalRequest.url?.includes('/authenticate/refresh') ||
      originalRequest.url?.includes('/authenticate/verify-otp') ||
      originalRequest.url?.includes('/authenticate/generate-otp') ||
      originalRequest.url?.includes('/authenticate/forgot-password')
    ) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue the request until the refresh is done
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        // No refresh token → force logout
        clearAuthStorage();
        window.location.href = '/';
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_URL}/authenticate/refresh`, {
          refreshToken,
        });

        const { accessToken: newAccess, refreshToken: newRefresh } =
          response.data.result;

        localStorage.setItem('accessToken', newAccess);
        // API /authenticate/refresh chỉ trả accessToken (không trả refreshToken mới).
        // Chỉ ghi đè khi có giá trị, nếu không localStorage sẽ lưu chuỗi "undefined" và lần làm mới sau sẽ thất bại -> bị đăng xuất.
        if (newRefresh) {
          localStorage.setItem('refreshToken', newRefresh);
        }

        api.defaults.headers.common.Authorization = `Bearer ${newAccess}`;
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;

        processQueue(null, newAccess);

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAuthStorage();
        window.location.href = '/';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

function clearAuthStorage() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('role');
  localStorage.removeItem('user');
}

export default api;
