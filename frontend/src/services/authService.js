import { reactive, computed } from 'vue';
import api from './api';

// Simple reactive state for auth
const state = reactive({
    user: JSON.parse(localStorage.getItem('user')) || null,
    accessToken: localStorage.getItem('token') || null,
    loading: false,
    error: null
});

const authService = {
    // Getters
    user: computed(() => state.user),
    isAuthenticated: computed(() => !!state.accessToken),
    isAdmin: computed(() => state.user?.role === 'admin'),
    userStatus: computed(() => state.user?.status),
    loading: computed(() => state.loading),
    error: computed(() => state.error),

    /**
     * Login user
     */
    async login(email, password) {
        state.loading = true;
        state.error = null;
        try {
            const response = await api.post('/auth/login', { email, password });
            const { accessToken, refreshToken, user } = response.data;

            this.setSession(accessToken, refreshToken, user);
            return user;
        } catch (err) {
            state.error = err.response?.data?.message || 'Login failed';
            throw err;
        } finally {
            state.loading = false;
        }
    },

    /**
     * Register user
     */
    async register(email, password, passwordConfirm, profile = {}) {
        state.loading = true;
        state.error = null;
        try {
            const response = await api.post('/auth/register', {
                email,
                password,
                passwordConfirm,
                profile
            });
            return response.data;
        } catch (err) {
            state.error = err.response?.data?.message || 'Registration failed';
            throw err;
        } finally {
            state.loading = false;
        }
    },

    /**
     * Logout user
     */
    async logout() {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
            try {
                await api.post('/auth/logout', { refreshToken });
            } catch (err) {
                console.error('Logout error:', err);
            }
        }
        this.clearSession();
    },

    /**
     * Refresh the access token
     */
    async refreshTokens() {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
            this.clearSession();
            throw new Error('No refresh token available');
        }

        try {
            const response = await api.post('/auth/refresh', { refreshToken });
            const { accessToken } = response.data;

            state.accessToken = accessToken;
            localStorage.setItem('token', accessToken);

            return accessToken;
        } catch (err) {
            this.clearSession();
            throw err;
        }
    },

    /**
     * Set the authentication session
     */
    setSession(accessToken, refreshToken, user) {
        state.accessToken = accessToken;
        state.user = user;

        localStorage.setItem('token', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));
    },

    /**
     * Clear the authentication session
     */
    clearSession() {
        state.accessToken = null;
        state.user = null;

        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
    }
};

export default authService;
