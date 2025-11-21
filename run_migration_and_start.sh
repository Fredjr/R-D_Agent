#!/bin/bash

# Run database migrations before starting the server
echo "🗄️ Running database migrations..."

# Run existing migration (article summary columns)
echo "📊 Running migration: add_article_summary_columns..."
python3 migrations/add_article_summary_columns.py upgrade

# Run new migration (product pivot tables)
echo "🚀 Running migration: add_pivot_tables (Phase 1, Week 1)..."
python3 migrations/001_add_pivot_tables.py

# Run enhanced triage migration (Phase 1, Week 9+)
echo "🎯 Running migration: enhance_paper_triage (Phase 1, Week 9+)..."
python3 backend/migrations/002_enhance_paper_triage.py upgrade

# Run PDF text extraction migration (Week 19-20: Critical Fix)
echo "📄 Running migration: add_pdf_text_fields (Week 19-20)..."
python3 run_migration_006.py

echo "✅ All migrations completed successfully!"

# Start the FastAPI server
echo "🚀 Starting FastAPI server..."
exec python -m uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}

