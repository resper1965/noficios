#!/bin/bash

# Deploy script for oficios-portal-frontend
# Execute this script from the project root directory

set -e

echo "🚀 Starting deployment of oficios-portal-frontend..."

# Navigate to frontend directory
cd oficios-portal-frontend

# Deploy to Cloud Run
echo "📦 Deploying to Cloud Run..."
gcloud run deploy oficios-portal-frontend \
  --source . \
  --region southamerica-east1 \
  --platform managed \
  --allow-unauthenticated \
  --port 3000 \
  --memory 1Gi \
  --cpu 1 \
  --max-instances 10 \
  --set-env-vars="NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCrE-O9tnox14nsbtkWpbbnCs42_3ewo9M,NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=officio-474711.firebaseapp.com,NEXT_PUBLIC_FIREBASE_PROJECT_ID=officio-474711,NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=officio-474711.firebasestorage.app,NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=491078993287,NEXT_PUBLIC_FIREBASE_APP_ID=1:491078993287:web:b123a486df583bd2693f22"

echo "✅ Deployment completed!"

# Get the service URL
echo "🔗 Getting service URL..."
SERVICE_URL=$(gcloud run services describe oficios-portal-frontend --region southamerica-east1 --format="value(status.url)")

echo "🌐 Service URL: $SERVICE_URL"
echo "📋 Next steps:"
echo "1. Access the URL above"
echo "2. If you see Firebase auth errors, add the domain to Firebase Console"
echo "3. Test the login functionality"