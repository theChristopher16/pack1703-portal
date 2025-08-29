# 🚀 **DEPLOYMENT GUIDE**

Complete step-by-step guide to deploy the Pack 1703 & Smith Station multi-domain RSVP system.

## 📋 **Prerequisites**

### **Required Software**
- [OpenTofu](https://opentofu.org) (Terraform alternative)
- [Ansible](https://ansible.com)
- [Docker](https://docker.com) & Docker Compose
- SSH client
- Git

### **Required Accounts & Paid Services**
- AWS account with EC2 access
- Cloudflare account with Zero Trust
- Domain names: `sfpack1703.com` and `smithstation.io`

### **📧 Email Services (Paid)**
- **Zoho Mail Professional** - Custom domain email hosting
  - **Account**: cubmaster@sfpack1703.com
  - **Cost**: ~$1/month per user
  - **Setup**: Manual configuration through Zoho web portal
  - **DNS Records**: MX, TXT (SPF), DKIM records configured in Cloudflare

### **🔐 Security & Authentication Services**
- **Firebase (Google Cloud)**
  - **Firestore Database**: NoSQL document database
  - **Authentication**: User login/registration system
  - **Cloud Functions**: Serverless backend functions
  - **App Check**: reCAPTCHA v3 integration (requires manual setup)
  - **Cost**: Free tier, pay-as-you-go for usage
  
### **🌐 Domain & DNS Services**
- **Domain Registration**: Annual renewal fees
- **Cloudflare**: Free tier with premium features available

### **System Requirements**
- Ubuntu 22.04+ server
- Minimum 2GB RAM
- 20GB+ storage
- Public IP address

## 📧 **Phase 0: Manual Service Configuration**

### **Step 0.1: Zoho Mail Setup**
1. **Register Domain Email**
   ```
   Go to: https://www.zoho.com/mail/
   Sign up for Zoho Mail Professional
   Add domain: sfpack1703.com
   Create email: cubmaster@sfpack1703.com
   ```

2. **Configure DNS Records in Cloudflare**
   ```
   MX Record: sfpack1703.com → mx.zoho.com (Priority: 10)
   MX Record: sfpack1703.com → mx2.zoho.com (Priority: 20)
   TXT Record: sfpack1703.com → "v=spf1 include:zoho.com ~all"
   CNAME Record: zb12345678._domainkey.sfpack1703.com → zb12345678.zoho._domainkey.com
   ```

3. **Verify Domain Ownership**
   - Add TXT verification record provided by Zoho
   - Wait for DNS propagation (24-48 hours)
   - Verify in Zoho admin panel

### **Step 0.2: Firebase Configuration**
1. **Create Firebase Project**
   ```
   Go to: https://console.firebase.google.com/
   Create new project: "pack-1703-portal"
   Enable Google Analytics (optional)
   ```

2. **Configure Firestore Database**
   ```
   Firestore Database → Create database
   Start in production mode
   Select region: us-central (Iowa)
   ```

3. **Setup Authentication**
   ```
   Authentication → Sign-in method
   Enable Email/Password
   Configure authorized domains: sfpack1703.com
   ```

4. **Configure App Check (Optional)**
   ```
   App Check → Apps → Web apps
   Register app: sfpack1703app
   Get reCAPTCHA v3 site key
   Add to environment: REACT_APP_RECAPTCHA_V3_SITE_KEY
   ```

### **Step 0.3: Domain Configuration**
1. **Point Domains to Server**
   ```
   Cloudflare DNS:
   A Record: sfpack1703.com → [SERVER_IP]
   A Record: www.sfpack1703.com → [SERVER_IP]
   CNAME Record: *.sfpack1703.com → sfpack1703.com
   ```

2. **SSL Certificate Setup**
   ```
   Cloudflare → SSL/TLS → Overview
   Set to "Full (strict)"
   Enable "Always Use HTTPS"
   ```

## 🏗️ **Phase 1: Infrastructure Deployment**

### **Step 1: Clone Repository**
```bash
git clone <repository-url>
cd dissertation
chmod +x deploy.sh destroy.sh
```

### **Step 2: Configure AWS Credentials**
```bash
# Set AWS credentials (choose one method)
export AWS_ACCESS_KEY_ID="your_access_key"
export AWS_SECRET_ACCESS_KEY="your_secret_key"
export AWS_DEFAULT_REGION="us-east-2"

# OR use AWS CLI
aws configure
```

### **Step 3: Deploy Infrastructure**
```bash
./deploy.sh
```

**What this does:**
- Creates EC2 instance via OpenTofu
- Installs Docker, Docker Compose, and dependencies
- Configures Cloudflare tunnel
- Sets up firewall rules
- Generates dynamic inventory for Ansible

**Expected Output:**
```
✅ Infrastructure deployed successfully!
🌐 Server IP: 13.59.253.201
🔑 SSH Key: ~/.ssh/stratus-play-ec2-keypair
```

### **Step 4: Verify Infrastructure**
```bash
# Check OpenTofu state
cd tofu
tofu show

# Check EC2 instance
aws ec2 describe-instances --filters "Name=tag:Name,Values=stratus-play"
```

## 🌐 **Phase 2: Cloudflare Tunnel Configuration**

### **Step 1: Access Cloudflare Dashboard**
1. Go to [https://dash.cloudflare.com](https://dash.cloudflare.com)
2. Navigate to **Zero Trust** → **Access** → **Tunnels**

### **Step 2: Configure Tunnel Routing**
Your tunnel should show as "Online". Click **Configure** and add these routes:

#### **For sfpack1703.com:**
- **Hostname**: `sfpack1703.com`
- **Service**: `http://YOUR_SERVER_IP:80`
- **Hostname**: `www.sfpack1703.com`
- **Service**: `http://YOUR_SERVER_IP:80`

#### **For smithstation.io:**
- **Hostname**: `smithstation.io`
- **Service**: `http://YOUR_SERVER_IP:80`
- **Hostname**: `www.smithstation.io`
- **Service**: `http://YOUR_SERVER_IP:80`

### **Step 3: Test Tunnel**
```bash
# Test from your local machine
curl -H "Host: sfpack1703.com" http://YOUR_SERVER_IP:80/
curl -H "Host: smithstation.io" http://YOUR_SERVER_IP:80/
```

## 🐳 **Phase 3: Application Deployment**

### **Step 1: SSH to Server**
```bash
ssh -i ~/.ssh/stratus-play-ec2-keypair ubuntu@YOUR_SERVER_IP
```

### **Step 2: Navigate to App Directory**
```bash
cd /home/ubuntu/app
```

### **Step 3: Start Application Stack**
```bash
# Start all services
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f
```

### **Step 4: Verify Services**
```bash
# Check container status
docker ps

# Test local connectivity
curl -H 'Host: sfpack1703.com' http://localhost:80/
curl -H 'Host: smithstation.io' http://localhost:80/
curl -H 'Host: sfpack1703.com' http://localhost:80/rsvp/
```

## 📊 **Current System Status** (January 2, 2025)

### **✅ Completed Features**
- **Frontend Application**: React 18 + TypeScript + Vite + Tailwind CSS
- **Admin Authentication**: Working login system with mock authentication
- **Admin Dashboard**: Functional admin panel with navigation
- **Admin Events Management**: Event listing and management interface
- **Security Implementation**: Zod validation, DOMPurify, rate limiting
- **Production Deployment**: Docker containerized, running on AWS EC2
- **Email Service**: cubmaster@sfpack1703.com configured through Zoho Mail

### **🔧 Admin System Details**
- **Login URL**: https://sfpack1703.com/admin/login
- **Demo Credentials**: admin@pack1703.com / any password
- **Authentication**: Mock system (Firebase Auth integration pending)
- **Features**: Dashboard, Events, Locations, News, More sections
- **Status**: Fully functional with proper routing and navigation

### **⚠️ Known Issues**
- **Text Visibility**: Some admin page text may appear invisible in certain browsers
  - **Workaround**: Use browser highlighting or inspect element
  - **Status**: Multiple CSS fixes applied, debugging in progress
  - **Root Cause**: CSS specificity conflicts with Tailwind classes
- **App Check**: Temporarily disabled (reCAPTCHA v3 setup pending)
- **Real Authentication**: Currently using mock login system

### **💰 Monthly Costs**
- **AWS EC2 t3.micro**: ~$8-12/month
- **Zoho Mail Professional**: ~$1/month per user
- **Domain Renewal**: ~$12-15/year (annual)
- **Firebase**: Free tier (pay-as-you-go for scale)
- **Cloudflare**: Free tier
- **Total Estimated**: ~$10-15/month + annual domain fees

## 🚀 **Phase 8: GCP Migration Planning (NEW)**

### **Migration Rationale**
Current VM/Docker infrastructure costs ~$10-15/month. GCP serverless architecture will reduce costs to ~$0.60/month (95% savings) while improving scalability and reducing maintenance overhead.

### **Current Infrastructure Analysis**
- **AWS EC2 t4g.large**: Always-on instance with Docker containers
- **15+ Services**: Traefik, MongoDB, React apps, APIs, monitoring
- **Manual Management**: Updates, security patches, monitoring, backups
- **Limited Scaling**: Manual intervention required for traffic spikes

### **Target GCP Architecture**
```
Internet → Cloudflare DNS → Firebase Hosting (CDN) → Cloud Functions → Firestore
                                                      ↓
                                              Cloud Storage (files)
                                              Cloud Scheduler (jobs)
                                              Pub/Sub (queues)
```

### **Migration Benefits**
- **Cost Reduction**: $10-15/month → $0.60/month
- **Auto-scaling**: Handle 10x traffic spikes automatically
- **Zero Maintenance**: No VM management or updates
- **Global Performance**: CDN edge locations worldwide
- **Security**: Managed SSL, DDoS protection, App Check

### **Migration Timeline**
- **Phase 8A (Weeks 1-2)**: GCP setup and OpenTofu modules
- **Phase 8B (Weeks 3-4)**: Backend migration to Cloud Functions
- **Phase 8C (Weeks 5-6)**: Frontend migration to Firebase Hosting
- **Phase 8D (Weeks 7-8)**: Data migration from MongoDB to Firestore
- **Phase 8E (Weeks 9-10)**: Testing and optimization
- **Phase 8F (Weeks 11-12)**: Production cutover and cleanup

### **Pre-Migration Checklist**
- [ ] **Data Backup**: Complete MongoDB backup and validation
- [ ] **Domain DNS**: Verify Cloudflare DNS configuration
- [ ] **SSL Certificates**: Ensure domain SSL is working
- [ ] **User Communication**: Plan maintenance window communication
- [ ] **Rollback Plan**: Document rollback procedures
- **Estimated Downtime**: 2-4 hours during cutover

### **Post-Migration Benefits**
- **Operational Costs**: ~$0.60/month (95% reduction)
- **Performance**: Global CDN, <500ms cold starts, <200ms warm responses
- **Scalability**: Automatic scaling to 1000+ concurrent users
- **Maintenance**: Zero VM management, automatic updates
- **Monitoring**: Comprehensive Cloud Monitoring and alerting

## 🔧 **Phase 4: Security Configuration & Testing**

### **Step 1: Configure Firebase App Check (CRITICAL)**
```bash
# 1. Go to Firebase Console: https://console.firebase.google.com/project/pack-1703-portal
# 2. Navigate to Project Settings → App Check
# 3. Register your web app
# 4. Enable reCAPTCHA v3 provider
# 5. Get your site key and add to environment:

# Create .env file in app/sfpack1703app/
echo "REACT_APP_RECAPTCHA_V3_SITE_KEY=your_site_key_here" >> app/sfpack1703app/.env
```

**Why Critical**: Without App Check, Cloud Functions will reject all requests in production.

### **Step 2: Security Verification**
```bash
# Test security features are working
cd app/sfpack1703app

# Verify build includes security
npm run build | grep -E "(287|KB|security)"

# Check that DOMPurify is included
grep -r "DOMPurify" build/static/js/
```

## 🔧 **Phase 5: Configuration & Testing**

### **Step 1: Verify Traefik Routing**
```bash
# Check Traefik dashboard
curl http://localhost:8080/api/http/routers

# Check service status
docker compose logs traefik
```

### **Step 2: Test MongoDB Connection**
```bash
# Connect to MongoDB
docker exec -it mongo mongosh

# Test basic operations
use rsvp_database
db.createCollection("test")
db.test.insertOne({test: "hello"})
db.test.find()
exit
```

### **Step 3: Test Secure RSVP API**
```bash
# Test RSVP submission with security validation
curl -X POST -H 'Host: sfpack1703.com' \
  -H 'Content-Type: application/json' \
  -d '{
    "data": {
      "eventId": "test-event",
      "familyName": "Test Family",
      "email": "test@example.com",
      "attendees": [{"name": "John Doe", "age": 35, "isAdult": true}]
    }
  }' \
  -H 'Content-Type: application/json' \
  -d '{"event":"test","firstName":"John","lastName":"Doe","numAttendees":2,"email":"test@example.com","phoneNumber":"123-456-7890","meal":["pizza"],"scoutRank":"Cub Scout"}' \
  http://localhost:80/rsvp/submit_rsvp

# Test RSVP retrieval
curl -H 'Host: sfpack1703.com' http://localhost:80/rsvp/rsvp_counts
```

## 🌍 **Phase 5: External Access Testing**

### **Step 1: Test Domain Access**
```bash
# From your local machine (not the server)
curl https://sfpack1703.com/
curl https://smithstation.io/
curl https://sfpack1703.com/rsvp/
```

### **Step 2: Test RSVP Submission from Internet**
```bash
# Submit RSVP from external network
curl -X POST -H 'Host: sfpack1703.com' \
  -H 'Content-Type: application/json' \
  -d '{"event":"online-test","firstName":"Jane","lastName":"Smith","numAttendees":3,"email":"jane@example.com","phoneNumber":"555-123-4567","meal":["hamburger"],"scoutRank":"Webelos"}' \
  https://sfpack1703.com/rsvp/submit_rsvp
```

## 📊 **Phase 6: Monitoring & Verification**

### **Step 1: Check Service Health**
```bash
# All services status
docker compose ps

# Service logs
docker compose logs --tail=50

# Resource usage
docker stats
```

### **Step 2: Verify Data Persistence**
```bash
# Check MongoDB data
docker exec -it mongo mongosh
use rsvp_database
show collections
db.rsvps.find()
db.rsvps.countDocuments()
```

### **Step 3: Test Both Domains**
```bash
# Test sfpack1703.com functionality
curl -H 'Host: sfpack1703.com' http://localhost:80/rsvp/rsvp_counts

# Test smithstation.io functionality  
curl -H 'Host: smithstation.io' http://localhost:80/rsvp/rsvp_counts
```

## 🧠 **Phase 7: LLM & MCP Deployment (NEW)**

### **Step 1: Configure LLM API Keys**
```bash
# Create functions environment file
cd app/sfpack1703app/functions
cp .env.example .env

# Add LLM API keys (REQUIRED for AI features)
echo "OPENAI_API_KEY=your_openai_api_key_here" >> .env
echo "ANTHROPIC_API_KEY=your_anthropic_api_key_here" >> .env
echo "GOOGLE_AI_API_KEY=your_google_ai_api_key_here" >> .env

# Add MCP server configuration
echo "MCP_SERVER_PORT=3001" >> .env
echo "MCP_ADMIN_DOMAIN_WHITELIST=admin.sfpack1703.com,admin.smithstation.io" >> .env

# Add security settings
echo "LLM_RATE_LIMIT_ENABLED=true" >> .env
echo "MCP_AUDIT_LOGGING_ENABLED=true" >> .env
echo "CONTENT_MODERATION_ENABLED=true" >> .env
```

### **Step 2: Deploy LLM/MCP Cloud Functions**
```bash
# Deploy Firebase Functions with LLM/MCP support
cd app/sfpack1703app
firebase deploy --only functions

# Verify deployment
firebase functions:list
```

**Expected Output**:
```
✅ Functions deployed successfully!
🧠 LLM integration active
🔧 MCP server running on port 3001
🛡️ Security features enabled
```

### **Step 3: Configure Admin Authentication**
```bash
# 1. Go to Firebase Console: https://console.firebase.google.com/project/pack-1703-portal
# 2. Navigate to Authentication → Users
# 3. Create admin users with custom claims
# 4. Set admin role: { "role": "admin", "permissions": ["crud", "llm", "mcp"] }
```

### **Step 4: Test LLM/MCP Integration**
```bash
# Test MCP server health
curl https://admin.sfpack1703.com/api/mcp/health

# Test LLM content generation (requires admin token)
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  -X POST https://admin.sfpack1703.com/api/llm/generate \
  -d '{"prompt":"Generate a simple event announcement"}'

# Test MCP tool access (requires admin token)
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  -X POST https://admin.sfpack1703.com/api/mcp/tools/list_resources \
  -d '{"resourceType":"events"}'
```

### **Step 5: Verify Security Features**
```bash
# Test rate limiting
for i in {1..25}; do
  curl -H "Authorization: Bearer $ADMIN_TOKEN" \
    -X POST https://admin.sfpack1703.com/api/mcp/tools/create_event \
    -d '{"title":"Test Event"}'
done
# 21st request should return rate limit error

# Test content moderation
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  -X POST https://admin.sfpack1703.com/api/llm/generate \
  -d '{"prompt":"Generate inappropriate content"}'
# Should return moderation warning
```

## 🚨 **Troubleshooting Common Issues**

### **Issue: Services Not Starting**
```bash
# Check container logs
docker compose logs <service-name>

# Check resource usage
docker system df
free -h
df -h

# Restart specific service
docker compose restart <service-name>
```

### **Issue: MongoDB Connection Failed**
```bash
# Check MongoDB status
docker compose logs mongo

# Test MongoDB connectivity
docker exec -it mongo mongosh --eval "db.adminCommand('ping')"

# Check MongoDB data directory
ls -la /home/ubuntu/app/mongodb-data/
```

### **Issue: Traefik Routing Not Working**
```bash
# Check Traefik configuration
docker compose logs traefik

# Verify Traefik labels
docker inspect <container-name> | grep -A 10 -B 5 Labels

# Test Traefik API
curl http://localhost:8080/api/http/routers
```

### **Issue: Cloudflare Tunnel Not Working**
```bash
# Check tunnel status on server
sudo systemctl status cloudflared

# Check tunnel logs
sudo journalctl -u cloudflared -f

# Verify tunnel configuration
sudo cat /etc/systemd/system/cloudflared.service
```

## 🔄 **Update & Maintenance**

### **Updating Application Code**
```bash
# 1. Copy updated files to server
scp -i ~/.ssh/stratus-play-ec2-keypair file ubuntu@YOUR_SERVER_IP:/path/

# 2. Rebuild and restart service
docker compose up -d --build <service-name>

# 3. Verify changes
docker compose logs <service-name>
```

### **Adding New Services**
1. Add service to `docker-compose.yml`
2. Configure Traefik labels for routing
3. Deploy: `docker compose up -d <new-service>`
4. Test routing and functionality

### **Database Backup**
```bash
# Create backup
docker exec mongo mongodump --out /backup/$(date +%Y%m%d)

# Copy backup to local machine
scp -i ~/.ssh/stratus-play-ec2-keypair -r ubuntu@YOUR_SERVER_IP:/backup/ ./local-backup/
```

## 🧹 **Cleanup & Destruction**

### **Stop Applications**
```bash
cd /home/ubuntu/app
docker compose down
```

### **Destroy Infrastructure**
```bash
# From your local machine
./destroy.sh

# This will:
# - Stop and terminate EC2 instance
# - Remove all AWS resources
# - Stop billing
# - Delete all data
```

## 📝 **Post-Deployment Checklist**

- [ ] Infrastructure deployed successfully
- [ ] Cloudflare tunnel configured and routing
- [ ] All Docker services running
- [ ] MongoDB connection working
- [ ] RSVP API responding
- [ ] Both domains accessible locally
- [ ] Both domains accessible externally
- [ ] RSVP submission working
- [ ] Data persistence verified
- [ ] Monitoring and logging configured

## 🆘 **Getting Help**

### **Debugging Steps**
1. Check service logs: `docker compose logs <service>`
2. Verify container status: `docker compose ps`
3. Test connectivity: `curl -H 'Host: domain.com' http://localhost:80/`
4. Check Traefik routing: Traefik dashboard
5. Verify Cloudflare tunnel: Dashboard status

### **Useful Commands**
```bash
# View all logs
docker compose logs -f

# Check specific service
docker compose logs -f rsvp-backend

# Restart everything
docker compose restart

# Check resource usage
docker stats
docker system df

# Access containers
docker exec -it <container-name> bash
```

---

**Last Updated**: August 27, 2025  
**Deployment Version**: 1.0.0
