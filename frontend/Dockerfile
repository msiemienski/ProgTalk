FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY frontend/package*.json ./

# Install dependencies (allow legacy peer deps to resolve conflicts)
RUN npm install --legacy-peer-deps

# Copy application files
COPY frontend/. .
# Copy shared certs into the image at /app/certs so Vite can load them
COPY certs /app/certs

# Expose port
EXPOSE 5173

# Start Vite dev server
CMD ["npm", "run", "dev"]
