import axios from "axios";
import { useAuthStore } from "../stores/newAuthStore";

export const axiosInstance = axios.create({
    baseURL: import.meta.env.MODE === "development" ? import.meta.env.VITE_API_URL || "http://localhost:5000/api" : "/api",
    withCredentials: true,
});

axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const authStore = useAuthStore.getState();
            authStore.logout();
        }
        return Promise.reject(error);
    }
);