FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY frontend/package*.json ./
RUN npm install

# Copy frontend source code
COPY frontend/ ./

# Expose Vite's default port
EXPOSE 5173

# Run Vite and expose to host network
CMD ["npm", "run", "dev", "--", "--host"]
