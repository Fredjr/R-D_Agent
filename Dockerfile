FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Install dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY . .

# Cloud Run listens on $PORT
ENV PORT=8080
EXPOSE 8080

CMD ["sh","-c","uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}"]

