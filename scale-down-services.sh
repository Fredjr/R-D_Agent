# Scale all Cloud Run services to zero instances
gcloud run services update rd-agent-staging --region=us-central1 --min-instances=0 --max-instances=1
gcloud run services update rd-agent-staging-v2 --region=us-central1 --min-instances=0 --max-instances=1  
gcloud run services update rd-backend --region=us-central1 --min-instances=0 --max-instances=1
gcloud run services update rd-backend-new --region=us-central1 --min-instances=0 --max-instances=1
gcloud run services update rd-frontend --region=us-central1 --min-instances=0 --max-instances=1

# Delete duplicate/unused services (optional - more aggressive)
# gcloud run services delete rd-agent-staging-v2 --region=us-central1 --quiet
# gcloud run services delete rd-backend --region=us-central1 --quiet  
# gcloud run services delete rd-frontend --region=us-central1 --quiet
