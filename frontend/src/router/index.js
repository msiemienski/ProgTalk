import { createRouter, createWebHistory } from 'vue-router';
import authService from '../services/authService';

const routes = [
    {
        path: '/',
        name: 'Home',
        component: () => import('../views/Home.vue'),
    },
    {
        path: '/login',
        name: 'Login',
        component: () => import('../views/Login.vue'),
        meta: { guest: true }
    },
    {
        path: '/register',
        name: 'Register',
        component: () => import('../views/Register.vue'),
        meta: { guest: true }
    },
    {
        path: '/profile',
        name: 'Profile',
        component: () => import('../views/Profile.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/admin',
        name: 'Admin',
        component: () => import('../views/AdminDashboard.vue'),
        meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
        path: '/topics/:id',
        name: 'TopicDetails',
        component: () => import('../views/TopicView.vue'),
    },
    {
        path: '/about',
        name: 'About',
        component: () => import('../views/About.vue'),
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

router.beforeEach((to, from, next) => {
    const isAuthenticated = authService.isAuthenticated.value;
    const isAdmin = authService.isAdmin.value;

    if (to.meta.requiresAuth && !isAuthenticated) {
        return next('/login');
    }

    if (to.meta.requiresAdmin && !isAdmin) {
        return next('/');
    }

    if (to.meta.guest && isAuthenticated) {
        return next('/');
    }

    next();
});

export default router;
