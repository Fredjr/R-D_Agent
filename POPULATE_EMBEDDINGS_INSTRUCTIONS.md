# How to Populate Embeddings for Personalization

## 🎯 **Problem**

Personalization is failing because the production database has no paper embeddings.

## 📋 **Solution**

Use the Admin Embeddings API to populate embeddings in batches.

## 🚀 **Step-by-Step Instructions**

### **Step 1: Check Current Status**

```bash
curl -s "https://r-dagent-production.up.railway.app/api/v1/admin/embeddings/stats" \
  -H "User-ID: admin" | python3 -m json.tool
```

**Expected output:**
```json
{
  "status": "success",
  "total_articles": 1000,
  "articles_with_embeddings": 0,
  "articles_without_embeddings": 1000,
  "coverage_percent": 0.0
}
```

### **Step 2: Populate Embeddings (Small Batch)**

Start with a small batch to test:

```bash
curl -X POST "https://r-dagent-production.up.railway.app/api/v1/admin/embeddings/populate?limit=10" \
  -H "User-ID: admin" \
  -H "Content-Type: application/json"
```

**Expected output:**
```json
{
  "status": "success",
  "message": "Processed 10 papers",
  "total": 10,
  "success": 10,
  "skipped": 0,
  "failed": 0,
  "errors": []
}
```

**This will take 10-20 seconds** (OpenAI API calls)

### **Step 3: Populate More Embeddings**

Once the small batch works, populate more:

```bash
# Populate 50 papers (recommended for testing)
curl -X POST "https://r-dagent-production.up.railway.app/api/v1/admin/embeddings/populate?limit=50" \
  -H "User-ID: admin" \
  -H "Content-Type: application/json"
```

**This will take 30-60 seconds**

### **Step 4: Check Coverage**

```bash
curl -s "https://r-dagent-production.up.railway.app/api/v1/admin/embeddings/stats" \
  -H "User-ID: admin" | python3 -m json.tool
```

**Expected output:**
```json
{
  "status": "success",
  "total_articles": 1000,
  "articles_with_embeddings": 50,
  "articles_without_embeddings": 950,
  "coverage_percent": 5.0
}
```

### **Step 5: Test Personalization**

Run the quick test in browser console. With 50+ embeddings, personalization should start working!

## 🔄 **Populate All Embeddings (Optional)**

To populate embeddings for all papers:

```bash
# Populate in batches of 100 (repeat as needed)
for i in {1..10}; do
  echo "Batch $i..."
  curl -X POST "https://r-dagent-production.up.railway.app/api/v1/admin/embeddings/populate?limit=100" \
    -H "User-ID: admin" \
    -H "Content-Type: application/json"
  echo ""
  sleep 5  # Wait between batches
done
```

## ⚠️ **Important Notes**

1. **Cost**: Each embedding costs ~$0.00001 (OpenAI API)
   - 100 papers = ~$0.001
   - 1000 papers = ~$0.01
   
2. **Time**: ~0.5 seconds per paper
   - 100 papers = ~50 seconds
   - 1000 papers = ~8 minutes

3. **Caching**: Embeddings are cached, so subsequent calls are free

4. **Minimum for Testing**: 50 embeddings should be enough to see personalization working

## 🐛 **Troubleshooting**

### **Error: "Not Found"**

The admin API hasn't been deployed yet. Wait for Railway deployment or check:

```bash
curl -s https://r-dagent-production.up.railway.app/health | grep version
```

### **Error: "Internal Server Error"**

Check Railway logs for details. Common issues:
- OpenAI API key not set
- Database connection issues
- Rate limiting

### **Slow Response**

This is normal! Generating embeddings takes time. The API will respond when done.

## ✅ **Success Criteria**

After populating embeddings, the personalization test should show:

```
✅ Score Variance: 0.05+ (was 0.00)
✅ Unique Scores: 80%+ (was 10%)
✅ Explanation Variety: 100% (was 10%)
✅ Explanation Specificity: 70%+ (was 0%)
```

## 📊 **Alternative: Run Script Locally**

If the API doesn't work, you can run the population script locally:

```bash
cd /Users/fredericle/RD_Agent_XCode/R-D_Agent
python3 scripts/populate_embeddings.py --limit 50
```

This requires:
- Local database connection
- OpenAI API key in environment
- Python dependencies installed

---

## 🎯 **Quick Start**

Just run these three commands:

```bash
# 1. Check status
curl -s "https://r-dagent-production.up.railway.app/api/v1/admin/embeddings/stats" -H "User-ID: admin"

# 2. Populate 50 embeddings
curl -X POST "https://r-dagent-production.up.railway.app/api/v1/admin/embeddings/populate?limit=50" -H "User-ID: admin"

# 3. Test personalization (in browser console)
# Run QUICK_TEST_PERSONALIZATION.js
```

That's it! 🎉

