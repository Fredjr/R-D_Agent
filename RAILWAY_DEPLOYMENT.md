# Railway Deployment Guide

## Quick Setup

1. **Connect Repository to Railway**
   - Go to [railway.app](https://railway.app)
   - Click "Deploy from GitHub repo"
   - Select this repository
   - Railway will auto-detect Python and use the configuration files

2. **Set Environment Variables**
   Copy these variables to Railway dashboard:
   ```
   SUPABASE_DATABASE_URL=postgresql://postgres.xxxxxxxxx:password@aws-0-us-west-1.pooler.supabase.com:6543/postgres
   GOOGLE_GENAI_API_KEY=your_google_ai_key_here
   PINECONE_API_KEY=your_pinecone_key_here
   PINECONE_INDEX=your_pinecone_index_here
   PINECONE_HOST=your_pinecone_host_here
   ALLOW_ORIGIN_REGEX=https://.*\.vercel\.app|https://.*\.railway\.app|http://localhost:3000
   PORT=8000
   ```

3. **Deploy**
   - Railway will automatically build and deploy
   - Your app will be available at: `https://your-app-name.railway.app`

## Configuration Files

- `railway.json` - Railway-specific configuration
- `Procfile` - Process definition for web server
- `requirements.txt` - Python dependencies (already exists)

## Testing Endpoints

Once deployed, test these endpoints:
- `GET /` - Health check
- `GET /test` - Simple test endpoint
- `POST /projects` - Project creation (main functionality)
- `GET /debug/database` - Database connection status

## Advantages over Cloud Run

- ✅ Simple deployment process
- ✅ Automatic HTTPS
- ✅ Built-in environment variable management
- ✅ No container configuration needed
- ✅ Reliable HTTP handling
- ✅ Free tier available

## Next Steps

1. Deploy to Railway
2. Test all endpoints
3. Update frontend to use Railway URL
4. Monitor performance and logs
