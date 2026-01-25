import { reactive } from 'vue';

const state = reactive({
    toasts: []
});

let toastId = 0;

const toastService = {
    get toasts() {
        return state.toasts;
    },

    /**
     * Add a new toast
     * @param {string} message 
     * @param {string} type 'success' | 'error' | 'info' | 'warning'
     * @param {number} duration in ms
     */
    add(message, type = 'info', duration = 3000) {
        const id = ++toastId;
        const toast = { id, message, type };

        state.toasts.push(toast);

        if (duration > 0) {
            setTimeout(() => {
                this.remove(id);
            }, duration);
        }
    },

    success(message, duration = 3000) {
        this.add(message, 'success', duration);
    },

    error(message, duration = 4000) {
        this.add(message, 'error', duration);
    },

    info(message, duration = 3000) {
        this.add(message, 'info', duration);
    },

    warning(message, duration = 3500) {
        this.add(message, 'warning', duration);
    },

    remove(id) {
        const index = state.toasts.findIndex(t => t.id === id);
        if (index !== -1) {
            state.toasts.splice(index, 1);
        }
    }
};

export default toastService;
