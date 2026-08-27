import axios from "axios";
import { clearToken, getToken } from "../auth/authStorage";

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 10000,
});

// Her istekte geçerli JWT varsa Authorization header'ına eklenir.
apiClient.interceptors.request.use((config) => {
    const token = getToken();

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

// 401 Unauthorized durumunda yerel token'ı temizler ve korunan sayfalardan login'e yönlendirir.
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (
            axios.isAxiosError(error) &&
            error.response?.status === 401 &&
            !window.location.pathname.startsWith("/login") &&
            !window.location.pathname.startsWith("/register") &&
            !window.location.pathname.startsWith("/forms/")
        ) {
            clearToken();
            const currentPath = window.location.pathname + window.location.search;
            window.location.href = `/login?returnUrl=${encodeURIComponent(currentPath)}`;
        }

        return Promise.reject(error);
    },
);

export default apiClient;