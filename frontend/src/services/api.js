import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        // Add auth token if available
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Handle errors globally
        if (error.response) {
            // Server responded with error status
            console.error('API Error:', error.response.status, error.response.data);

            switch (error.response.status) {
                case 401:
                    // Unauthorized - redirect to login
                    console.warn('Unauthorized access - please login');
                    break;
                case 403:
                    // Forbidden
                    console.warn('Access forbidden');
                    break;
                case 404:
                    // Not found
                    console.warn('Resource not found');
                    break;
                case 500:
                    // Server error
                    console.error('Server error');
                    break;
                default:
                    console.error('An error occurred');
            }
        } else if (error.request) {
            // Request made but no response
            console.error('No response from server');
        } else {
            // Error in request setup
            console.error('Request setup error:', error.message);
        }

        return Promise.reject(error);
    }
);

export default api;
