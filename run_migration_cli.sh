#!/bin/bash

# Migration script to add timeline_events column to project_summaries table
# This uses Railway CLI to execute SQL directly on the production database

echo "======================================================================"
echo "🗄️  Migration 008: Add timeline_events to project_summaries"
echo "======================================================================"
echo "📅 Date: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI is not installed"
    echo "Install it with: npm i -g @railway/cli"
    exit 1
fi

echo "✅ Railway CLI found"
echo ""

# Check if logged in
echo "🔐 Checking Railway authentication..."
if ! railway whoami &> /dev/null; then
    echo "❌ Not logged in to Railway"
    echo "Run: railway login"
    exit 1
fi

RAILWAY_USER=$(railway whoami 2>/dev/null | head -1)
echo "✅ Logged in as: $RAILWAY_USER"
echo ""

# Check if project is linked
echo "🔗 Checking project link..."
if ! railway status &> /dev/null; then
    echo "❌ No Railway project linked"
    echo "Run: railway link"
    exit 1
fi

PROJECT_INFO=$(railway status 2>/dev/null)
echo "✅ Project linked:"
echo "$PROJECT_INFO"
echo ""

# Run the migration SQL
echo "🔄 Running migration SQL..."
echo ""

SQL_COMMAND="ALTER TABLE project_summaries ADD COLUMN IF NOT EXISTS timeline_events JSON DEFAULT '[]'::json;"

echo "SQL: $SQL_COMMAND"
echo ""

# Execute SQL using Railway CLI
# We need to connect to the Postgres service and run psql
echo "Executing migration..."
railway run --service Postgres psql \$DATABASE_URL -c "$SQL_COMMAND"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration executed successfully!"
    echo ""
    
    # Verify the column was added
    echo "🔍 Verifying migration..."
    VERIFY_SQL="SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'project_summaries' AND column_name = 'timeline_events';"
    
    railway run --service Postgres psql \$DATABASE_URL -c "$VERIFY_SQL"
    
    echo ""
    echo "======================================================================"
    echo "🎉 Migration 008 completed successfully!"
    echo "======================================================================"
    echo ""
    echo "📋 Next steps:"
    echo "1. Go to your R&D Agent application"
    echo "2. Navigate to Summaries tab"
    echo "3. Click 'Regenerate' button"
    echo "4. Verify timeline appears with chronological events"
    echo "5. Test Insights tab - should work without errors"
    echo ""
else
    echo ""
    echo "======================================================================"
    echo "❌ Migration failed!"
    echo "======================================================================"
    echo ""
    echo "Troubleshooting:"
    echo "1. Make sure you're connected to the right project"
    echo "2. Check that the Postgres service is running"
    echo "3. Verify you have permissions to modify the database"
    echo ""
    exit 1
fi

