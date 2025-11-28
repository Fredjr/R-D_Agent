#!/bin/bash

# Phase 1 Production Migration Script
# Runs Phase 0 and Phase 1 migrations on Railway production database

echo "🚀 Phase 1 Production Migration Script"
echo "========================================"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable not set"
    echo "Please set DATABASE_URL to your Railway PostgreSQL connection string"
    echo ""
    echo "Example:"
    echo "export DATABASE_URL='postgresql://user:pass@host:port/dbname'"
    exit 1
fi

echo "✅ DATABASE_URL is set"
echo ""

# Run Phase 0 migration (create tables)
echo "📊 Step 1: Running Phase 0 Migration (Create Tables)..."
echo "--------------------------------------------------------"
python3 migrations/phase0_add_many_to_many_collections.py

if [ $? -ne 0 ]; then
    echo "❌ Phase 0 migration failed!"
    exit 1
fi

echo ""
echo "✅ Phase 0 migration complete!"
echo ""

# Run Phase 1 migration (backfill data)
echo "📊 Step 2: Running Phase 1 Migration (Backfill Data)..."
echo "--------------------------------------------------------"
python3 migrations/phase1_backfill_project_collections.py

if [ $? -ne 0 ]; then
    echo "❌ Phase 1 migration failed!"
    exit 1
fi

echo ""
echo "✅ Phase 1 migration complete!"
echo ""

echo "========================================"
echo "🎉 All migrations completed successfully!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Test production endpoints"
echo "2. Verify data consistency"
echo "3. Monitor logs for errors"

