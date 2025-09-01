# 🗄️ Google Cloud SQL Setup for R&D Agent

Complete setup guide for Google Cloud SQL PostgreSQL database with GitHub integration and Vercel connection.

## 📋 **Prerequisites**
- Google Cloud Project (already have: your Cloud Run is deployed)
- Google Cloud Console access
- Billing enabled on the project

---

## 🚀 **STEP 1: Create Google Cloud SQL PostgreSQL Instance**

### **Option A: Google Cloud Console (Recommended)**

1. **Go to Google Cloud Console**:
   - Visit: [Google Cloud SQL Console](https://console.cloud.google.com/sql)
   - Select your existing project

2. **Create Instance**:
   - Click: "CREATE INSTANCE"
   - Choose: **PostgreSQL**
   - Click: "Next"

3. **Configure Instance**:
   ```
   Instance ID: rd-agent-postgres
   Password: [Generate secure password - save it!]
   Database version: PostgreSQL 15
   Cloud SQL edition: Enterprise
   Preset: Development (1 vCPU, 3.75 GB RAM)
   Region: us-central1 (same as your Cloud Run)
   Zone: Any
   ```

4. **Configure Connections**:
   ```
   Public IP: ✅ Enable
   Authorized networks: 0.0.0.0/0 (temporary - we'll restrict later)
   Private IP: ❌ Disable (for now)
   ```

5. **Configure Backups**:
   ```
   Automated backups: ✅ Enable
   Backup window: Choose preferred time
   Point-in-time recovery: ✅ Enable
   ```

6. **Click "CREATE INSTANCE"** (takes 5-10 minutes)

### **Option B: gcloud CLI (Alternative)**
```bash
gcloud sql instances create rd-agent-postgres \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --root-password=[YOUR_PASSWORD]
```

---

## 🔐 **STEP 2: Create Database and User**

### **After Instance Creation:**

1. **Go to your instance**: `rd-agent-postgres`

2. **Create Database**:
   - Go to "Databases" tab
   - Click "CREATE DATABASE"
   ```
   Database name: rd_agent
   ```

3. **Create User** (Optional - can use postgres user):
   - Go to "Users" tab  
   - Click "ADD USER ACCOUNT"
   ```
   Username: rd_agent_user
   Password: [Generate secure password]
   ```

4. **Get Connection Details**:
   - Go to "Overview" tab
   - Note the **Public IP address**
   - Note the **Connection name** (project:region:instance)

---

## 🔗 **STEP 3: Configure Cloud Run Connection**

### **Database URL Format:**
```
DATABASE_URL=postgresql://[USER]:[PASSWORD]@[PUBLIC_IP]:5432/rd_agent
```

### **Example:**
```
DATABASE_URL=postgresql://postgres:YourSecurePassword123@34.123.45.67:5432/rd_agent
```

### **Set Environment Variable in Cloud Run:**

1. **Go to Cloud Run Console**:
   - Visit: [Google Cloud Run Console](https://console.cloud.google.com/run)
   - Click: `rd-backend-new`

2. **Edit & Deploy New Revision**:
   - Click: "EDIT & DEPLOY NEW REVISION"
   - Go to: "Variables & Secrets" tab

3. **Add Environment Variable**:
   ```
   Name: DATABASE_URL
   Value: postgresql://postgres:[YOUR_PASSWORD]@[PUBLIC_IP]:5432/rd_agent
   ```

4. **Deploy**: Click "DEPLOY"

---

## 🧪 **STEP 4: Test Connection**

### **Test from Cloud Run:**
After deployment, test the connection:
```
curl https://rd-backend-new-537209831678.us-central1.run.app/debug/database
```

Should return:
```json
{
  "database_type": "PostgreSQL",
  "database_url_env": "postgresql://postgres:***@34.123.45.67:5432/rd_agent",
  "effective_database_url": "postgresql://postgres:***@34.123.45.67:5432/rd_agent"
}
```

---

## 🔒 **STEP 5: Security Improvements (Production)**

### **Restrict Network Access:**
1. **Go to SQL instance** → **Connections** → **Networking**
2. **Remove 0.0.0.0/0** from authorized networks
3. **Add specific IP ranges**:
   - Google Cloud Run IP ranges for us-central1
   - Your development IP (if needed)

### **Use Private IP (Advanced):**
For maximum security, configure Private IP connection between Cloud Run and Cloud SQL.

---

## 📊 **STEP 6: Monitoring & Maintenance**

### **Enable Monitoring:**
1. **Cloud SQL Insights**: Monitor performance
2. **Cloud Logging**: Track connection logs
3. **Alerting**: Set up alerts for high CPU/memory

### **Regular Maintenance:**
- **Automated backups**: Already configured
- **Security updates**: Automatic
- **Performance monitoring**: Check Cloud Console

---

## 🚀 **Quick Setup Commands**

### **Create Instance:**
```bash
# Create the instance
gcloud sql instances create rd-agent-postgres \
  --database-version=POSTGRES_15 \
  --tier=db-g1-small \
  --region=us-central1

# Create database
gcloud sql databases create rd_agent --instance=rd-agent-postgres

# Get connection info
gcloud sql instances describe rd-agent-postgres
```

### **Update Cloud Run:**
```bash
# Set environment variable
gcloud run services update rd-backend-new \
  --region=us-central1 \
  --set-env-vars="DATABASE_URL=postgresql://postgres:[PASSWORD]@[IP]:5432/rd_agent"
```

---

## 🎯 **Expected Results**

After complete setup:

### **✅ Data Persistence:**
- Users persist across sessions and deployments
- Projects save permanently to database  
- Dossiers linked to projects and users
- Deep dive analyses stored with full metadata

### **✅ Cross-Device Access:**
- Login from any device and see your projects
- Collaborate on projects with team members
- Access research history from anywhere

### **✅ Production Ready:**
- Automated backups and recovery
- High availability and scalability
- Secure connections and authentication
- Performance monitoring and alerts

---

## 🆘 **Troubleshooting**

### **Connection Issues:**
```bash
# Test from local machine
psql "postgresql://postgres:[PASSWORD]@[PUBLIC_IP]:5432/rd_agent"

# Check Cloud Run logs
gcloud logs tail rd-backend-new --region=us-central1
```

### **Common Issues:**
1. **Authentication**: Check username/password
2. **Network**: Verify authorized networks include 0.0.0.0/0
3. **Database**: Ensure database `rd_agent` exists
4. **SSL**: Cloud SQL requires SSL connections

---

## 💰 **Cost Optimization**

### **Development Setup:**
- **Instance**: db-f1-micro ($7-10/month)
- **Storage**: 10GB SSD ($1.70/month)  
- **Backups**: 7-day retention (minimal cost)

### **Production Optimization:**
- Use committed use discounts for sustained workloads
- Monitor usage and scale instance size as needed
- Consider regional persistent disks for cost savings

**Total estimated cost: $10-15/month for development setup**
