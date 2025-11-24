#!/bin/bash

echo "================================================================================"
echo "🔧 RUNNING MIGRATION ON RAILWAY POSTGRESQL"
echo "================================================================================"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable not set"
    echo ""
    echo "To run this migration, you need to:"
    echo "1. Get the DATABASE_URL from Railway dashboard"
    echo "2. Export it: export DATABASE_URL='your-database-url'"
    echo "3. Run this script again"
    exit 1
fi

echo "📊 Database: $(echo $DATABASE_URL | sed 's/.*@//' | sed 's/\/.*//')"
echo ""
echo "Running migration..."
echo ""

# Run the migration using psql
psql "$DATABASE_URL" << 'SQL'
-- Step 1: Make added_by nullable
ALTER TABLE hypothesis_evidence 
ALTER COLUMN added_by DROP NOT NULL;

-- Step 2: Update existing records
UPDATE hypothesis_evidence 
SET added_by = NULL 
WHERE added_by = 'ai_triage';

-- Step 3: Verify
SELECT 
    COUNT(*) as total_evidence_links,
    COUNT(added_by) as links_with_user,
    COUNT(*) - COUNT(added_by) as links_without_user
FROM hypothesis_evidence;
SQL

echo ""
echo "================================================================================"
echo "✅ MIGRATION COMPLETE"
echo "================================================================================"
