#!/bin/bash

# GCE VM Deployment Script for R&D Agent
set -e

PROJECT_ID="r-and-d-agent-mvp"
ZONE="us-central1-a"
INSTANCE_NAME="rd-agent-vm"
MACHINE_TYPE="e2-standard-2"
IMAGE_FAMILY="ubuntu-2204-lts"
IMAGE_PROJECT="ubuntu-os-cloud"

echo "🚀 Deploying R&D Agent to GCE VM..."

# Create VM instance if it doesn't exist
if ! gcloud compute instances describe $INSTANCE_NAME --zone=$ZONE --project=$PROJECT_ID &>/dev/null; then
    echo "Creating GCE VM instance..."
    gcloud compute instances create $INSTANCE_NAME \
        --project=$PROJECT_ID \
        --zone=$ZONE \
        --machine-type=$MACHINE_TYPE \
        --network-interface=network-tier=PREMIUM,stack-type=IPV4_ONLY,subnet=default \
        --maintenance-policy=MIGRATE \
        --provisioning-model=STANDARD \
        --service-account=default \
        --scopes=https://www.googleapis.com/auth/cloud-platform \
        --tags=http-server,https-server \
        --create-disk=auto-delete=yes,boot=yes,device-name=$INSTANCE_NAME,image=projects/$IMAGE_PROJECT/global/images/family/$IMAGE_FAMILY,mode=rw,size=20,type=projects/$PROJECT_ID/zones/$ZONE/diskTypes/pd-balanced \
        --no-shielded-secure-boot \
        --shielded-vtpm \
        --shielded-integrity-monitoring \
        --labels=environment=staging,app=rd-agent \
        --reservation-affinity=any
    
    echo "Waiting for VM to be ready..."
    sleep 30
fi

# Create firewall rules if they don't exist
if ! gcloud compute firewall-rules describe allow-rd-agent-http --project=$PROJECT_ID &>/dev/null; then
    echo "Creating firewall rules..."
    gcloud compute firewall-rules create allow-rd-agent-http \
        --project=$PROJECT_ID \
        --direction=INGRESS \
        --priority=1000 \
        --network=default \
        --action=ALLOW \
        --rules=tcp:80,tcp:443,tcp:8080 \
        --source-ranges=0.0.0.0/0 \
        --target-tags=http-server
fi

# Get VM external IP
EXTERNAL_IP=$(gcloud compute instances describe $INSTANCE_NAME --zone=$ZONE --project=$PROJECT_ID --format="get(networkInterfaces[0].accessConfigs[0].natIP)")
echo "VM External IP: $EXTERNAL_IP"

# Setup script to run on VM
cat > setup-vm.sh << 'EOF'
#!/bin/bash
set -e

echo "🔧 Setting up Docker and Docker Compose..."

# Update system
sudo apt-get update

# Install Docker
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
fi

# Install Docker Compose
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Install git if not present
sudo apt-get install -y git curl

echo "✅ VM setup complete!"
EOF

# Copy setup script and run it
echo "Setting up VM environment..."
gcloud compute scp setup-vm.sh $INSTANCE_NAME:~/setup-vm.sh --zone=$ZONE --project=$PROJECT_ID
gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --project=$PROJECT_ID --command="chmod +x ~/setup-vm.sh && ~/setup-vm.sh"

# Clone repository and deploy
echo "Deploying application..."
gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --project=$PROJECT_ID --command="
    # Clone or update repository
    if [ -d 'R-D_Agent' ]; then
        cd R-D_Agent && git pull
    else
        git clone https://github.com/Fredjr/R-D_Agent.git
        cd R-D_Agent
    fi
    
    # Copy environment file (you'll need to set this up manually)
    if [ ! -f .env ]; then
        echo 'Please create .env file from .env.example with your API keys'
        cp .env.example .env
    fi
    
    # Build and start services
    sudo docker-compose down || true
    sudo docker-compose build
    sudo docker-compose up -d
    
    echo '🎉 Deployment complete!'
    echo 'Application should be available at: http://$EXTERNAL_IP'
    echo 'Health check: http://$EXTERNAL_IP/health'
"

echo "🎉 GCE VM deployment complete!"
echo "VM IP: $EXTERNAL_IP"
echo "Application URL: http://$EXTERNAL_IP"
echo "Health check: http://$EXTERNAL_IP/health"
echo ""
echo "Next steps:"
echo "1. SSH to VM: gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --project=$PROJECT_ID"
echo "2. Configure .env file with your API keys"
echo "3. Restart services: sudo docker-compose restart"
