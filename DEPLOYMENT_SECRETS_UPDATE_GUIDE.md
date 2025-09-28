# 🔑 **DEPLOYMENT SECRETS UPDATE GUIDE**

## **CRITICAL: Update All Deployment Secrets**

You need to update the following deployment platforms with the new OpenAI API key:

**OpenAI API Key**: `sk-proj-ZkNv6maAxN2IDuhHye6b1i-t5bRcyepCQc8jaed5HfCgFB-Fw7N1oEmXEaiz-J9RcWrOpUs2ahT3FaP8ksZkhihl5VgJ0iUk2k5brDWbkrVgpSsosmYAe6PhA4kgtqtW4A`

---

## **1. 🚀 Railway Deployment**

### **Update Environment Variables:**
1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Select your R&D Agent backend project
3. Go to **Variables** tab
4. **Remove these old variables:**
   - `GOOGLE_GENAI_API_KEY`
   - `GOOGLE_API_KEY`
5. **Add new variable:**
   - `OPENAI_API_KEY` = `sk-proj-ZkNv6maAxN2IDuhHye6b1i-t5bRcyepCQc8jaed5HfCgFB-Fw7N1oEmXEaiz-J9RcWrOpUs2ahT3FaP8ksZkhihl5VgJ0iUk2k5brDWbkrVgpSsosmYAe6PhA4kgtqtW4A`

### **Trigger Redeploy:**
- Railway will automatically redeploy when you save the environment variables

---

## **2. ▲ Vercel Frontend**

### **Update Environment Variables:**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your frontend project
3. Go to **Settings** → **Environment Variables**
4. **No changes needed** - Frontend doesn't use LLM keys directly

---

## **3. 🐙 GitHub Secrets**

### **Update Repository Secrets:**
1. Go to your GitHub repository
2. Go to **Settings** → **Secrets and variables** → **Actions**
3. **Remove these old secrets:**
   - `GOOGLE_GENAI_API_KEY`
   - `GOOGLE_API_KEY`
4. **Add new secret:**
   - `OPENAI_API_KEY` = `sk-proj-ZkNv6maAxN2IDuhHye6b1i-t5bRcyepCQc8jaed5HfCgFB-Fw7N1oEmXEaiz-J9RcWrOpUs2ahT3FaP8ksZkhihl5VgJ0iUk2k5brDWbkrVgpSsosmYAe6PhA4kgtqtW4A`

---

## **4. 🗄️ PostgreSQL Database**

### **No Changes Required:**
- Database doesn't store API keys
- All API keys are environment variables only

---

## **5. ✅ Verification Steps**

### **After updating all secrets:**

1. **Test Railway Backend:**
   ```bash
   curl -s "https://r-dagent-production.up.railway.app/health" | jq '.'
   ```

2. **Test Deep Dive Analysis:**
   ```bash
   curl -X POST "https://frontend-psi-seven-85.vercel.app/api/proxy/deep-dive" \
     -H "Content-Type: application/json" \
     -d '{"pmid": "29622564", "title": "Test Article", "objective": "Test analysis"}'
   ```

3. **Check for OpenAI Model Errors:**
   - Look for "404 models/gemini-1.5-flash is not found" errors (should be gone)
   - Look for successful OpenAI model calls

---

## **6. 🔄 Expected Changes**

### **Before (Gemini):**
- Model: `gemini-1.5-flash`, `gemini-1.5-pro`
- Error: `404 models/gemini-1.5-flash is not found for API version v1beta`

### **After (OpenAI):**
- Model: `gpt-4o-mini`, `gpt-4o`
- Success: Rich content generation in deep dive analyses

---

## **7. 🚨 Immediate Impact**

Once secrets are updated and deployments complete:

✅ **Deep Dive Analysis for PMID 29622564 will work**
✅ **All subsequent deep dives will generate rich content**
✅ **Project Dashboard deep dives will work**
✅ **Network View deep dives will work**
✅ **Generate Review will continue working**

---

## **8. 📋 Deployment Checklist**

- [ ] Railway: Updated `OPENAI_API_KEY` environment variable
- [ ] Railway: Removed old `GOOGLE_GENAI_API_KEY` and `GOOGLE_API_KEY`
- [ ] GitHub: Updated `OPENAI_API_KEY` secret
- [ ] GitHub: Removed old `GOOGLE_GENAI_API_KEY` and `GOOGLE_API_KEY` secrets
- [ ] Tested backend health endpoint
- [ ] Tested deep dive analysis endpoint
- [ ] Verified PMID 29622564 analysis works

**🎉 Once all checkboxes are complete, your platform will be fully migrated to OpenAI!**
