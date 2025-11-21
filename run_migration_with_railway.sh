#!/bin/bash

# Script to run database migration using Railway CLI
# This script gets the DATABASE_URL from Railway and runs the migration

echo "🔄 Getting DATABASE_URL from Railway..."

# Get DATABASE_URL from Railway
DATABASE_URL=$(railway variables --json 2>/dev/null | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('DATABASE_URL', ''))" 2>/dev/null)

if [ -z "$DATABASE_URL" ]; then
    echo "❌ Could not get DATABASE_URL from Railway"
    echo ""
    echo "Please run the migration manually:"
    echo "1. Go to https://railway.app"
    echo "2. Select project: ingenious-reprieve"
    echo "3. Select service: Postgres"
    echo "4. Click 'Data' tab → 'Query'"
    echo "5. Copy and paste the contents of backend/migrations/003_enhance_protocols.sql"
    echo "6. Click 'Run Query'"
    exit 1
fi

echo "✅ Got DATABASE_URL"
echo "🔄 Running migration..."

# Run the migration
python3 run_migration_003.py "$DATABASE_URL"

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Migration completed successfully!"
    echo "✅ You can now extract context-aware protocols"
else
    echo ""
    echo "❌ Migration failed"
    echo "Please try the manual method described above"
    exit 1
fi

