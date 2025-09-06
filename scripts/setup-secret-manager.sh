#!/bin/bash

# Google Secret Manager Setup Script
# This script sets up Google Secret Manager for secure API key storage
# Updated to remove OpenAI (now using Firebase AI Logic with Gemini)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project configuration
PROJECT_ID="pack-1703-portal"
REGION="us-central1"

echo -e "${BLUE}🔐 Google Secret Manager Setup Script${NC}"
echo "=================================="
echo -e "${YELLOW}Note: OpenAI has been removed - using Firebase AI Logic (Gemini)${NC}"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ Google Cloud CLI is not installed${NC}"
    echo "Please install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${YELLOW}⚠️ Not authenticated with Google Cloud${NC}"
    echo "Please run: gcloud auth login"
    exit 1
fi

# Set the project
echo -e "${BLUE}📋 Setting project to: ${PROJECT_ID}${NC}"
gcloud config set project $PROJECT_ID

# Enable Secret Manager API
echo -e "${BLUE}🔧 Enabling Secret Manager API...${NC}"
gcloud services enable secretmanager.googleapis.com

# Create secrets
echo -e "${BLUE}🔑 Creating API key secrets...${NC}"

# Function to create secret
create_secret() {
    local secret_name=$1
    local secret_value=$2
    local description=$3
    
    echo -e "${YELLOW}Creating secret: ${secret_name}${NC}"
    
    # Create the secret
    gcloud secrets create $secret_name \
        --replication-policy="automatic" \
        --labels="type=api-key,environment=production" \
        --data-file=- <<< "$secret_value" || {
        echo -e "${YELLOW}Secret ${secret_name} already exists, updating...${NC}"
        gcloud secrets versions add $secret_name --data-file=- <<< "$secret_value"
    }
    
    echo -e "${GREEN}✅ Created secret: ${secret_name}${NC}"
}

# Admin API Keys (OpenAI removed - using Firebase AI Logic with Gemini)
echo -e "${BLUE}🔐 Setting up Admin API Keys...${NC}"
echo -e "${YELLOW}Note: OpenAI removed - using Firebase AI Logic (Gemini) for AI features${NC}"

read -p "Enter Admin Google Maps API Key: " ADMIN_GOOGLE_MAPS_KEY
create_secret "admin-google-maps-key" "$ADMIN_GOOGLE_MAPS_KEY" "Admin Google Maps API key"

read -p "Enter Admin OpenWeather API Key: " ADMIN_OPENWEATHER_KEY
create_secret "admin-openweather-key" "$ADMIN_OPENWEATHER_KEY" "Admin OpenWeather API key"

read -p "Enter Admin Google Places API Key: " ADMIN_GOOGLE_PLACES_KEY
create_secret "admin-google-places-key" "$ADMIN_GOOGLE_PLACES_KEY" "Admin Google Places API key"

# User API Keys (OpenAI removed - using Firebase AI Logic with Gemini)
echo -e "${BLUE}🔐 Setting up User API Keys...${NC}"
echo -e "${YELLOW}Note: OpenAI removed - using Firebase AI Logic (Gemini) for AI features${NC}"

read -p "Enter User Google Maps API Key: " USER_GOOGLE_MAPS_KEY
create_secret "user-google-maps-key" "$USER_GOOGLE_MAPS_KEY" "User Google Maps API key"

read -p "Enter User OpenWeather API Key: " USER_OPENWEATHER_KEY
create_secret "user-openweather-key" "$USER_OPENWEATHER_KEY" "User OpenWeather API key"

read -p "Enter User Google Places API Key: " USER_GOOGLE_PLACES_KEY
create_secret "user-google-places-key" "$USER_GOOGLE_PLACES_KEY" "User Google Places API key"

# Shared API Keys
echo -e "${BLUE}🔐 Setting up Shared API Keys...${NC}"
read -p "Enter Phone Validation API Key: " PHONE_VALIDATION_KEY
create_secret "phone-validation-key" "$PHONE_VALIDATION_KEY" "Phone validation API key"

read -p "Enter Tenor API Key: " TENOR_KEY
create_secret "tenor-key" "$TENOR_KEY" "Tenor GIF API key"

read -p "Enter reCAPTCHA v3 Site Key: " RECAPTCHA_SITE_KEY
create_secret "recaptcha-v3-site-key" "$RECAPTCHA_SITE_KEY" "reCAPTCHA v3 Site Key"

read -p "Enter reCAPTCHA v3 Secret Key: " RECAPTCHA_SECRET_KEY
create_secret "recaptcha-v3-secret-key" "$RECAPTCHA_SECRET_KEY" "reCAPTCHA v3 Secret Key"

# Grant access to Firebase Functions service account
echo -e "${BLUE}🔐 Granting access to Firebase Functions service account...${NC}"

# Get the Firebase Functions service account
FUNCTIONS_SERVICE_ACCOUNT="${PROJECT_ID}@appspot.gserviceaccount.com"

echo -e "${YELLOW}Granting Secret Accessor role to: ${FUNCTIONS_SERVICE_ACCOUNT}${NC}"

# List of secrets to grant access to
SECRETS=(
    "admin-google-maps-key"
    "admin-openweather-key"
    "admin-google-places-key"
    "user-google-maps-key"
    "user-openweather-key"
    "user-google-places-key"
    "phone-validation-key"
    "tenor-key"
    "recaptcha-v3-site-key"
    "recaptcha-v3-secret-key"
)

for secret in "${SECRETS[@]}"; do
    echo -e "${YELLOW}Granting access to secret: ${secret}${NC}"
    gcloud secrets add-iam-policy-binding $secret \
        --member="serviceAccount:${FUNCTIONS_SERVICE_ACCOUNT}" \
        --role="roles/secretmanager.secretAccessor" \
        --quiet || echo -e "${YELLOW}Warning: Could not grant access to ${secret}${NC}"
done

echo ""
echo -e "${GREEN}🎉 Google Secret Manager setup complete!${NC}"
echo ""
echo -e "${BLUE}📋 Summary:${NC}"
echo "✅ Secret Manager API enabled"
echo "✅ All API keys stored securely"
echo "✅ Firebase Functions service account granted access"
echo "✅ OpenAI removed (using Firebase AI Logic with Gemini)"
echo ""
echo -e "${BLUE}🔧 Next Steps:${NC}"
echo "1. Update your Firebase Functions to use Secret Manager"
echo "2. Test the secrets are accessible from your functions"
echo "3. Remove API keys from environment variables"
echo ""
echo -e "${BLUE}🔍 Verify secrets:${NC}"
echo "gcloud secrets list"
echo ""
echo -e "${BLUE}📖 Documentation:${NC}"
echo "https://cloud.google.com/secret-manager/docs"