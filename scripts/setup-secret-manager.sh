#!/bin/bash

# Google Secret Manager Setup Script
# This script sets up Google Secret Manager for secure API key storage

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

# Admin API Keys
echo -e "${BLUE}🔐 Setting up Admin API Keys...${NC}"
read -p "Enter Admin OpenAI API Key: " ADMIN_OPENAI_KEY
create_secret "admin-openai-key" "$ADMIN_OPENAI_KEY" "Admin OpenAI API key for premium features"

read -p "Enter Admin Google Maps API Key: " ADMIN_GOOGLE_MAPS_KEY
create_secret "admin-google-maps-key" "$ADMIN_GOOGLE_MAPS_KEY" "Admin Google Maps API key"

read -p "Enter Admin OpenWeather API Key: " ADMIN_OPENWEATHER_KEY
create_secret "admin-openweather-key" "$ADMIN_OPENWEATHER_KEY" "Admin OpenWeather API key"

read -p "Enter Admin Google Places API Key: " ADMIN_GOOGLE_PLACES_KEY
create_secret "admin-google-places-key" "$ADMIN_GOOGLE_PLACES_KEY" "Admin Google Places API key"

# User API Keys
echo -e "${BLUE}🔐 Setting up User API Keys...${NC}"
read -p "Enter User OpenAI API Key: " USER_OPENAI_KEY
create_secret "user-openai-key" "$USER_OPENAI_KEY" "User OpenAI API key for basic features"

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
create_secret "recaptcha-site-key" "$RECAPTCHA_SITE_KEY" "reCAPTCHA v3 site key"

read -p "Enter reCAPTCHA v3 Secret Key: " RECAPTCHA_SECRET_KEY
create_secret "recaptcha-secret-key" "$RECAPTCHA_SECRET_KEY" "reCAPTCHA v3 secret key"

# Set up IAM permissions
echo -e "${BLUE}🔐 Setting up IAM permissions...${NC}"

# Get the default service account
SERVICE_ACCOUNT=$(gcloud iam service-accounts list --filter="displayName:App Engine default service account" --format="value(email)")

if [ -z "$SERVICE_ACCOUNT" ]; then
    echo -e "${YELLOW}⚠️ Default service account not found, using project number${NC}"
    PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
    SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
fi

echo -e "${BLUE}Using service account: ${SERVICE_ACCOUNT}${NC}"

# Grant Secret Manager access
gcloud secrets add-iam-policy-binding admin-openai-key \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding user-openai-key \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding admin-google-maps-key \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding user-google-maps-key \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding admin-openweather-key \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding user-openweather-key \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding admin-google-places-key \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding user-google-places-key \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding phone-validation-key \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding tenor-key \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding recaptcha-site-key \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding recaptcha-secret-key \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/secretmanager.secretAccessor"

echo -e "${GREEN}✅ IAM permissions configured${NC}"

# List all secrets
echo -e "${BLUE}📋 Listing all secrets...${NC}"
gcloud secrets list --format="table(name,createTime,labels)"

# Create environment file for production
echo -e "${BLUE}📝 Creating production environment configuration...${NC}"
cat > .env.production << EOF
# Production Environment Variables
# These will be used when ENABLE_SECRET_MANAGER=true

# Enable Secret Manager
ENABLE_SECRET_MANAGER=true
GOOGLE_CLOUD_PROJECT=${PROJECT_ID}

# Firebase App Check (still needed for frontend)
REACT_APP_RECAPTCHA_V3_SITE_KEY=${RECAPTCHA_SITE_KEY}
REACT_APP_RECAPTCHA_V3_SECRET_KEY=${RECAPTCHA_SECRET_KEY}
EOF

echo -e "${GREEN}✅ Created .env.production file${NC}"

# Create rotation script
echo -e "${BLUE}🔄 Creating key rotation script...${NC}"
cat > scripts/rotate-keys.sh << 'EOF'
#!/bin/bash

# API Key Rotation Script
# This script rotates API keys in Google Secret Manager

set -e

PROJECT_ID="pack-1703-portal"

echo "🔄 Starting API key rotation..."

# Function to rotate a secret
rotate_secret() {
    local secret_name=$1
    local new_value=$2
    
    echo "Rotating secret: $secret_name"
    
    # Add new version
    gcloud secrets versions add $secret_name --data-file=- <<< "$new_value"
    
    # Get the latest version number
    LATEST_VERSION=$(gcloud secrets versions list $secret_name --limit=1 --format="value(name)" | cut -d'/' -f6)
    
    # Disable old versions (keep last 3)
    gcloud secrets versions list $secret_name --format="value(name)" | tail -n +4 | while read version; do
        VERSION_NUM=$(echo $version | cut -d'/' -f6)
        gcloud secrets versions disable $VERSION_NUM --secret=$secret_name
    done
    
    echo "✅ Rotated secret: $secret_name"
}

# Example usage (uncomment and modify as needed):
# rotate_secret "admin-openai-key" "new-admin-openai-key-value"
# rotate_secret "user-openai-key" "new-user-openai-key-value"

echo "🔄 Key rotation completed"
EOF

chmod +x scripts/rotate-keys.sh
echo -e "${GREEN}✅ Created key rotation script${NC}"

# Create monitoring script
echo -e "${BLUE}📊 Creating monitoring script...${NC}"
cat > scripts/monitor-keys.sh << 'EOF'
#!/bin/bash

# API Key Monitoring Script
# This script monitors API key usage and costs

set -e

PROJECT_ID="pack-1703-portal"

echo "📊 API Key Monitoring Report"
echo "=========================="

# List all secrets with metadata
echo "🔑 Secrets Overview:"
gcloud secrets list --format="table(name,createTime,labels)"

echo ""
echo "📈 Usage Statistics:"
echo "Note: Detailed usage statistics would be collected from API providers"
echo "and stored in monitoring dashboards."

echo ""
echo "💰 Cost Estimation:"
echo "Note: Actual costs should be monitored through:"
echo "- Google Cloud Billing"
echo "- OpenAI Usage Dashboard"
echo "- Google Maps Platform Console"
echo "- Other API provider dashboards"

echo ""
echo "🔄 Rotation Status:"
echo "Note: Check key age and rotation schedule in Secret Manager"

echo ""
echo "🚨 Security Alerts:"
echo "Note: Set up Cloud Monitoring alerts for:"
echo "- Unusual API usage patterns"
echo "- Cost threshold breaches"
echo "- Failed authentication attempts"
EOF

chmod +x scripts/monitor-keys.sh
echo -e "${GREEN}✅ Created monitoring script${NC}"

# Final instructions
echo ""
echo -e "${GREEN}🎉 Google Secret Manager setup completed!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Update your application to use Secret Manager:"
echo "   - Set ENABLE_SECRET_MANAGER=true in production"
echo "   - Deploy with the new secure key management"
echo ""
echo "2. Set up monitoring and alerts:"
echo "   - Configure Cloud Monitoring alerts"
echo "   - Set up cost budgets and alerts"
echo "   - Monitor API usage patterns"
echo ""
echo "3. Schedule key rotation:"
echo "   - Run scripts/rotate-keys.sh every 90 days"
echo "   - Set up automated rotation if needed"
echo ""
echo -e "${YELLOW}⚠️ Important Security Notes:${NC}"
echo "- Never commit API keys to version control"
echo "- Use different keys for different environments"
echo "- Monitor usage and costs regularly"
echo "- Rotate keys every 90 days"
echo "- Set up proper IAM permissions"
echo ""
echo -e "${GREEN}🔐 Your API keys are now securely stored in Google Secret Manager!${NC}"
