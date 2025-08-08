import axios from "axios";
import { toast } from "react-toastify";

// Environment-based API URL configuration
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV
    ? "http://localhost:5000/api" // Local development fallback
    : "https://backend-billingsoftware.onrender.com/api"); // Production backend URL fallback

// Debug logging
console.log("Environment:", import.meta.env.DEV ? "development" : "production");
console.log("API Base URL:", API_BASE_URL);

// Application configured for real-time data only
export const MOCK_MODE = false;

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 90000, // 15 seconds timeout
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("admin_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle timeout errors
    if (error.code === "ECONNABORTED") {
      toast.error("Request timed out. Please try again.");
      return Promise.reject(error);
    }

    // Handle network errors
    if (!error.response) {
      toast.error("Network error. Please check your connection and try again.");
      return Promise.reject(error);
    }

    // Handle authentication errors
    if (error.response?.status === 401) {
      // Only redirect if not already on login page to avoid conflicts with auto-logout
      if (window.location.pathname !== "/login") {
        sessionStorage.removeItem("admin_token");
        sessionStorage.removeItem("admin_user");
        window.location.href = "/login";
        toast.error("Session expired. Please login again.");
      }
    }
    // Handle server errors
    else if (error.response?.status >= 500) {
      toast.error("Server error. Please try again later.");
    }
    // Handle other errors
    else {
      const message = error.response?.data?.message || "An error occurred";
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

// Add a retry mechanism for failed requests
export const retryRequest = async (
  apiCall: () => Promise<any>,
  maxRetries = 3
) => {
  let retries = 0;

  while (retries < maxRetries) {
    try {
      return await apiCall();
    } catch (error) {
      retries++;
      if (retries >= maxRetries) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      await new Promise((resolve) => setTimeout(resolve, 1000 * retries));
    }
  }
};

// Shop Details API
export const fetchShopDetails = async () => {
  try {
    const response = await api.get("/shop-details");
    return response.data;
  } catch (error) {
    console.error("Error fetching shop details:", error);
    // Return default shop details as fallback
    return {
      shopName: "GOLDEN JEWELLERY",
      location: "Salem, Tamil Nadu",
      address: "123 Main Street, Jewelry District, City - 500001",
      phone: "+91 9876543210",
      email: "info@goldenjewellery.com",
      gstNumber: "29ABCDE1234F1Z5",
      licenseNumber: "JWL/2024/001",
    };
  }
};

export default api;
