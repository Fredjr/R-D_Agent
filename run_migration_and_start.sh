#!/bin/bash

# Run database migrations before starting the server
echo "🗄️ Running database migrations..."

# Run existing migration (article summary columns)
echo "📊 Running migration: add_article_summary_columns..."
python3 migrations/add_article_summary_columns.py upgrade

# Run new migration (product pivot tables)
echo "🚀 Running migration: add_pivot_tables (Phase 1, Week 1)..."
python3 migrations/001_add_pivot_tables.py

echo "✅ All migrations completed successfully!"

# Start the FastAPI server
echo "🚀 Starting FastAPI server..."
exec python -m uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}

