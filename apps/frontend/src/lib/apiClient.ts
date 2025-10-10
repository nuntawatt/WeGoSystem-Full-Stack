import axios, {
  AxiosInstance,
  AxiosHeaders,
  InternalAxiosRequestConfig,
} from "axios";

export const api: AxiosInstance = axios.create({
  baseURL: "http://localhost:5000/api", // MongoDB API endpoint
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    
    if (token) {
      if (!config.headers) {
        config.headers = new AxiosHeaders();
      }

      if (config.headers instanceof AxiosHeaders) {
        config.headers.set("Authorization", `Bearer ${token}`);
        if (!config.headers.has("Content-Type")) {
          config.headers.set("Content-Type", "application/json");
        }
      } else {
        (config.headers as any)["Authorization"] = `Bearer ${token}`;
        if (!(config.headers as any)["Content-Type"]) {
          (config.headers as any)["Content-Type"] = "application/json";
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    if (response.data?.success === false) {
      return Promise.reject(new Error(response.data.message || 'เกิดข้อผิดพลาด'));
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - could redirect to login or refresh token
      localStorage.removeItem('token');
      window.location.href = '/auth/signin';
      return Promise.reject(new Error('กรุณาเข้าสู่ระบบใหม่อีกครั้ง'));
    }

    if (error.response?.status === 403) {
      return Promise.reject(new Error('คุณไม่มีสิทธิ์ในการดำเนินการนี้'));
    }

    if (error.response?.status === 404) {
      return Promise.reject(new Error('ไม่พบข้อมูลที่ต้องการ'));
    }

    if (error.response?.data?.message) {
      return Promise.reject(new Error(error.response.data.message));
    }

    return Promise.reject(new Error('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์'));
  }
);