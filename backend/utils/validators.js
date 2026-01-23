/**
 * Validate email format
 */
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validate password strength
 */
export const isValidPassword = (password) => {
    // At least 6 characters
    if (password.length < 6) {
        return {
            valid: false,
            message: 'Password must be at least 6 characters long',
        };
    }

    return { valid: true };
};

/**
 * Validate topic name
 */
export const isValidTopicName = (name) => {
    if (!name || name.trim().length === 0) {
        return {
            valid: false,
            message: 'Topic name cannot be empty',
        };
    }

    if (name.length > 100) {
        return {
            valid: false,
            message: 'Topic name cannot exceed 100 characters',
        };
    }

    // Check for invalid characters
    const invalidChars = /[<>]/;
    if (invalidChars.test(name)) {
        return {
            valid: false,
            message: 'Topic name contains invalid characters',
        };
    }

    return { valid: true };
};

/**
 * Sanitize HTML content (basic)
 */
export const sanitizeContent = (content) => {
    if (!content) return '';

    return content
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .trim();
};

/**
 * Validate MongoDB ObjectId
 */
export const isValidObjectId = (id) => {
    return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Validate pagination parameters
 */
export const validatePagination = (page, limit) => {
    const parsedPage = parseInt(page) || 1;
    const parsedLimit = parseInt(limit) || 20;

    return {
        page: Math.max(1, parsedPage),
        limit: Math.min(100, Math.max(1, parsedLimit)), // Max 100 items per page
    };
};
