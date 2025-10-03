# Use Python 3.11 (more stable than 3.12 for Railway)
FROM python:3.11-slim

# Force rebuild - cache bust - METHODS FIXED LOCALLY
ARG CACHE_BUST=2025-10-03-10-15-METHODS-WORKING-LOCALLY

# Set working directory
WORKDIR /app

# Install system dependencies and Python packages in one layer
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies and clean up in one layer
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt \
    && pip cache purge

# Copy application code (excluding large model cache due to .dockerignore)
COPY . .

# Make startup script executable
RUN chmod +x railway_startup.sh

# Create non-root user for security
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Expose port (Railway will set PORT env var)
EXPOSE $PORT

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:$PORT/health || exit 1

# Start command using Railway startup script
CMD ["./railway_startup.sh"]
