# Stage 1: Build the Frontend
FROM node:20-alpine AS build-stage
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install --legacy-peer-deps
COPY frontend/ .
# Inject VITE_API_URL as /api for the build
ENV VITE_API_URL=/api
RUN npm run build

# Stage 2: Setup the Backend
FROM node:20-alpine
WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./
RUN npm install

# Copy backend application files
COPY backend/ .

# Copy built frontend from build-stage to backend/public
COPY --from=build-stage /app/frontend/dist ./public

# Copy shared certs into the image
COPY certs /app/certs

# Expose port
EXPOSE 3000

# Start application
# Note: Use node for production-like or nodemon for development
CMD ["npm", "run", "dev"]
