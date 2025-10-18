#!/usr/bin/env python3
import subprocess
import sys
import os

def run_command(cmd):
    """Execute a command and return the result"""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        print(f"Command: {cmd}")
        print(f"Return code: {result.returncode}")
        if result.stdout:
            print(f"STDOUT: {result.stdout}")
        if result.stderr:
            print(f"STDERR: {result.stderr}")
        return result.returncode == 0
    except Exception as e:
        print(f"Error executing command: {e}")
        return False

def main():
    print("🚀 Starting deployment of n.Oficios...")
    
    # Change to project directory
    os.chdir("/home/resper/noficios/oficios-portal-frontend")
    
    # Deploy command
    deploy_cmd = """gcloud run deploy oficios-portal-frontend \
  --source . \
  --region southamerica-east1 \
  --platform managed \
  --allow-unauthenticated \
  --port 3000 \
  --memory 1Gi \
  --cpu 1 \
  --max-instances 10 \
  --set-env-vars \
    NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDi5a_bbt9UDmAPtIjPnADJJD9UV9X42GM,\
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=officio-474711.firebaseapp.com,\
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=officio-474711,\
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=officio-474711.firebasestorage.app,\
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=491078993287,\
    NEXT_PUBLIC_FIREBASE_APP_ID=1:491078993287:web:b123a486df583bd2693f22"""
    
    print("📦 Deploying to Cloud Run...")
    success = run_command(deploy_cmd)
    
    if success:
        print("✅ Deployment completed successfully!")
        print("🔧 Next steps:")
        print("1. Get the Cloud Run URL from the output above")
        print("2. Add the domain to Firebase Authorized Domains")
        print("3. Configure OAuth Consent Screen")
        print("4. Test the application")
    else:
        print("❌ Deployment failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()


