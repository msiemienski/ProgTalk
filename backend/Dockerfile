FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY backend/package*.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY backend/. .
# Copy shared certs into the image at /app/certs so backend can load them
COPY certs /app/certs

# Expose port
EXPOSE 3000

# Start application with nodemon for development
CMD ["npm", "run", "dev"]
