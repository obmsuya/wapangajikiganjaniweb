import axios from "axios";
import Cookies from "js-cookie";

export const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const getAccessToken = () => Cookies.get("access_token") ?? null;

const getRefreshToken = () => localStorage.getItem("refresh_token");

const refreshAccessToken = async () => {
  try {
    const refreshToken = getRefreshToken();
    if (!refreshToken) throw new Error("No refresh token available");

    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}api/token/refresh/`,
      { refresh: refreshToken }
    );

    const newAccessToken = response.data.access;

    localStorage.setItem("access_token", newAccessToken);
    Cookies.set("access_token", newAccessToken, { expires: 0.5, path: "/" });
    console.log("Token refreshed successfully");

    return newAccessToken;
  } catch (error) {
    console.error("Token refresh failed:", error);
    logoutUser();
    return null;
  }
};

const logoutUser = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  Cookies.remove("access_token");
  window.location.href = "/login";
};

API.interceptors.request.use(
  async (config) => {
    const token = getAccessToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    originalRequest._retry = originalRequest._retry || false;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      const newToken = await refreshAccessToken();

      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return API(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);

export default API;