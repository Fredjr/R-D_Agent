# GCE VM Deployment with Docker Compose

This document describes how to deploy the R&D Agent application to a Google Compute Engine (GCE) VM using Docker Compose.

## Why GCE VM + Docker Compose?

This deployment method offers several advantages over Cloud Run:

- **No startup timeout constraints** - VMs don't have strict startup time limits
- **Full environment control** - Configure memory, CPU, and startup behavior as needed
- **Persistent storage** - Local volumes and attached disks for database persistence
- **Better debugging** - SSH access for direct troubleshooting
- **Cost efficiency** - More cost-effective for always-on services
- **No cold starts** - Application stays warm, eliminating cold start delays

## Architecture

```
Internet → Load Balancer → Nginx → Backend (FastAPI) → PostgreSQL
```

The setup includes:
- **Backend**: FastAPI application running in Docker
- **Database**: PostgreSQL container with persistent volume
- **Reverse Proxy**: Nginx for load balancing and SSL termination
- **Health Checks**: Automated health monitoring for all services

## Prerequisites

1. Google Cloud SDK installed and authenticated
2. Access to the `r-and-d-agent-mvp` GCP project
3. Required API keys (see `.env.example`)

## Quick Deployment

1. **Run the deployment script:**
   ```bash
   ./deploy-gce.sh
   ```

2. **Configure environment variables:**
   ```bash
   # SSH to the VM
   gcloud compute ssh rd-agent-vm --zone=us-central1-a --project=r-and-d-agent-mvp
   
   # Edit the environment file
   cd R-D_Agent
   sudo nano .env
   ```

3. **Restart services:**
   ```bash
   sudo docker-compose restart
   ```

## Manual Deployment Steps

### 1. Create VM Instance

```bash
gcloud compute instances create rd-agent-vm \
    --project=r-and-d-agent-mvp \
    --zone=us-central1-a \
    --machine-type=e2-standard-2 \
    --image-family=ubuntu-2204-lts \
    --image-project=ubuntu-os-cloud \
    --tags=http-server,https-server
```

### 2. Setup VM Environment

```bash
# SSH to VM
gcloud compute ssh rd-agent-vm --zone=us-central1-a

# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 3. Deploy Application

```bash
# Clone repository
git clone https://github.com/Fredjr/R-D_Agent.git
cd R-D_Agent

# Configure environment
cp .env.example .env
nano .env  # Add your API keys

# Start services
sudo docker-compose up -d
```

## Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
# Database
POSTGRES_PASSWORD=your_secure_password

# Google AI
GOOGLE_GENAI_API_KEY=your_gemini_api_key
GOOGLE_API_KEY=your_google_api_key

# Pinecone
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX=your_pinecone_index
PINECONE_HOST=your_pinecone_host

# Other APIs
UNPAYWALL_EMAIL=your_email@example.com
```

## Service Management

```bash
# View logs
sudo docker-compose logs -f backend
sudo docker-compose logs -f db

# Restart services
sudo docker-compose restart

# Update application
git pull
sudo docker-compose build backend
sudo docker-compose up -d backend

# Stop all services
sudo docker-compose down

# Start with fresh database
sudo docker-compose down -v
sudo docker-compose up -d
```

## Monitoring and Health Checks

- **Application Health**: `http://VM_IP/health`
- **Service Status**: `sudo docker-compose ps`
- **Resource Usage**: `sudo docker stats`

## Firewall Configuration

The deployment script automatically creates firewall rules:

```bash
gcloud compute firewall-rules create allow-rd-agent-http \
    --direction=INGRESS \
    --priority=1000 \
    --network=default \
    --action=ALLOW \
    --rules=tcp:80,tcp:443,tcp:8080 \
    --source-ranges=0.0.0.0/0 \
    --target-tags=http-server
```

## SSL/HTTPS Setup (Optional)

To enable HTTPS:

1. **Get SSL certificates** (Let's Encrypt recommended)
2. **Update nginx.conf** with SSL configuration
3. **Mount certificates** in docker-compose.yml
4. **Restart nginx service**

## Troubleshooting

### Check service status
```bash
sudo docker-compose ps
sudo docker-compose logs backend
```

### Database connection issues
```bash
sudo docker-compose exec db psql -U postgres -d rd_agent
```

### Application not responding
```bash
sudo docker-compose restart backend
curl -f http://localhost/health
```

### Resource constraints
```bash
# Check system resources
free -h
df -h
sudo docker stats
```

## Scaling Considerations

For production use, consider:

- **Load Balancer**: Use GCP Load Balancer for multiple VMs
- **Database**: Migrate to Cloud SQL for managed PostgreSQL
- **Monitoring**: Implement comprehensive logging and monitoring
- **Backup**: Regular database and application backups
- **Security**: Implement proper firewall rules and access controls

## Cost Optimization

- Use **Preemptible VMs** for development/staging
- **Schedule VM shutdown** during off-hours
- **Right-size** VM based on actual resource usage
- Consider **Spot VMs** for cost savings
