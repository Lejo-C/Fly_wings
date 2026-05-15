FROM python:3.10-slim

# Install system dependencies, RTL-SDR Linux drivers, and Node.js
RUN apt-get update && apt-get install -y \
    curl \
    librtlsdr-dev \
    rtl-sdr \
    build-essential \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies (including the newly added ones)
COPY requirement.txt .
RUN pip install --no-cache-dir -r requirement.txt
RUN pip install pyrtlsdr==0.2.93 scipy

# Install Node.js backend dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm install

# Copy all project files
COPY . .

# Start the Express server
WORKDIR /app/backend
CMD ["node", "server.js"]
