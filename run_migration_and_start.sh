#!/bin/bash

# Run database migration before starting the server
echo "🗄️ Running database migration..."
python3 migrations/add_article_summary_columns.py upgrade

# Start the FastAPI server
echo "🚀 Starting FastAPI server..."
exec python -m uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}

