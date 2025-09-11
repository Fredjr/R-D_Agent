# Keep only the 2 most recent images and delete the rest
gcloud artifacts docker images list us-central1-docker.pkg.dev/r-and-d-agent-mvp/rd-agent/backend --format='value(IMAGE)' --sort-by=~CREATE_TIME | tail -n +3 | head -20 | while read image; do
  echo "Deleting old image: $image"
  gcloud artifacts docker images delete "$image" --quiet
done

# Also clean up cloud-run-source-deploy repository (147GB)
gcloud artifacts docker images list us-central1-docker.pkg.dev/r-and-d-agent-mvp/cloud-run-source-deploy --format='value(IMAGE)' --sort-by=~CREATE_TIME | tail -n +3 | head -20 | while read image; do
  echo "Deleting old source image: $image"
  gcloud artifacts docker images delete "$image" --quiet
done
