# 🏕️ **Pack 1703 & Smith Station - Multi-Domain RSVP System**

A multi-domain web application system that serves two different organizations with separate frontends but shared backend services. Built with Docker, Traefik, MongoDB, and Node.js.

## 🎯 **What This System Does**

### **Domain 1: sfpack1703.com**
- **Purpose**: Scouting organization RSVP system with enterprise security
- **Frontend**: React 18 + TypeScript app for Pack 1703 events and activities
- **Features**: Event registration, meal preferences, scout rank tracking, real-time updates
- **Security**: Enterprise-grade validation, XSS prevention, rate limiting, App Check

### **Domain 2: smithstation.io**
- **Purpose**: General organization website
- **Frontend**: React app for Smith Station organization
- **Features**: General information, contact forms

### **Shared Backend**
- **RSVP API**: Secure form submissions with comprehensive validation
- **Database**: MongoDB + Firebase Firestore for data persistence
- **Security**: Multi-layered protection with DOMPurify, Zod validation, rate limiting
- **Authentication**: Admin panel for user management

### **AI-Powered Features (NEW)**
- **LLM Integration**: Server-side AI content generation (GPT-4, Claude, Google AI)
- **MCP Protocol**: Model Context Protocol for secure admin tool access
- **Content Generation**: AI-assisted announcements, FAQ answers, translations
- **Smart Automation**: Volunteer gap analysis, theme proposals, content optimization
- **Security**: Admin-only access, comprehensive audit logging, content moderation

## 🏗️ **System Architecture**

```
Internet → Cloudflare Tunnel → Traefik (Reverse Proxy) → Docker Containers
                                                           ├── sfpack1703 (Frontend)
                                                           ├── my-app (Frontend)
                                                           ├── rsvp-backend (API)
                                                           ├── MongoDB (Database)
                                                           └── Traefik (Load Balancer)
```

## 🚀 **Quick Start**

### **Prerequisites**
- Docker & Docker Compose
- Ubuntu server (tested on AWS EC2)
- Cloudflare account with tunnel setup

### **1. Clone & Setup**
```bash
git clone <repository-url>
cd dissertation
chmod +x deploy.sh destroy.sh
```

### **2. Deploy Infrastructure**
```bash
./deploy.sh
```

### **3. Start Applications**
```bash
cd app
docker compose up -d
```

### **4. Access Applications**
- **sfpack1703.com**: Main scouting app
- **smithstation.io**: Smith Station website
- **API**: `/rsvp/*` endpoints on both domains

## 📁 **Project Structure**

```
dissertation/
├── tofu/                    # OpenTofu infrastructure code
├── ansible/                 # Ansible configuration management
├── app/                     # Application code
│   ├── docker-compose.yml  # Main application stack
│   ├── sfpack1703app/      # Pack 1703 frontend
│   ├── my-app/             # Smith Station frontend
│   ├── rsvp-backend/       # Shared API backend
│   └── mongodb-data/       # Database persistence
├── deploy.sh               # Infrastructure deployment script
├── destroy.sh              # Infrastructure cleanup script
└── README.md               # This file
```

## 🔧 **Key Technologies**

- **Infrastructure**: OpenTofu, Ansible
- **Containerization**: Docker, Docker Compose
- **Reverse Proxy**: Traefik v3
- **Database**: MongoDB 8.0
- **Backend**: Node.js, Express, Mongoose
- **Frontend**: React (both apps)
- **Networking**: Cloudflare Tunnel

## 🌐 **Domain Configuration**

### **Traefik Routing Rules**
- **sfpack1703.com** → `sfpack1703` container (root path `/`)
- **smithstation.io** → `my-app` container (root path `/`)
- **Both domains** → `rsvp-backend` container (`/rsvp/*` paths)

### **Port Configuration**
- **Traefik**: Port 80 (HTTP)
- **MongoDB**: Port 27017
- **Mongo Express**: Port 8081 (admin interface)

## 📊 **API Endpoints**

### **RSVP Backend** (`/rsvp/*`)
- `GET /` - Health check
- `POST /submit_rsvp` - Submit new RSVP
- `GET /rsvp_counts` - Get RSVP statistics
- `POST /submit_volunteer` - Submit volunteer form
- `POST /submit_feedback` - Submit feedback

### **Authentication Endpoints**
- `POST /login` - User login
- `POST /register` - User registration
- `GET /users` - List users (admin only)

## 🗄️ **Database Schema**

### **RSVP Collection**
```json
{
  "event": "string",
  "firstName": "string",
  "lastName": "string",
  "numAttendees": "number",
  "email": "string",
  "phoneNumber": "string",
  "meal": ["string"],
  "scoutRank": "string",
  "timestamp": "date"
}
```

### **User Collection**
```json
{
  "username": "string",
  "passwordHash": "string",
  "role": "user|admin"
}
```

## 🔐 **Security & Authentication**

### **Current Status**
- **MongoDB**: Running without authentication (development mode)
- **Admin Panel**: Basic auth via Traefik
- **API**: No authentication required (public endpoints)

### **Production Considerations**
- Enable MongoDB authentication
- Implement JWT tokens for API
- Add rate limiting
- Enable HTTPS

## 🚨 **Important Notes**

### **MongoDB Authentication**
The system is currently running MongoDB without authentication for development/testing. **Do not use this configuration in production.**

### **Cloudflare Tunnel**
External access requires Cloudflare tunnel configuration in the dashboard:
1. Go to Zero Trust → Access → Tunnels
2. Configure hostname routing for both domains
3. Point to your server's IP address

### **Data Persistence**
- MongoDB data is stored in `./mongodb-data/`
- **Backup this directory** before major changes
- Data persists across container restarts

## 🛠️ **Maintenance & Operations**

### **Viewing Logs**
```bash
# All services
docker compose logs

# Specific service
docker compose logs rsvp-backend

# Follow logs
docker compose logs -f
```

### **Restarting Services**
```bash
# Restart specific service
docker compose restart rsvp-backend

# Restart all services
docker compose restart

# Rebuild and restart
docker compose up -d --build
```

### **Database Access**
```bash
# Connect to MongoDB
docker exec -it mongo mongosh

# View collections
show dbs
use rsvp_database
show collections
```

## 🆘 **Getting Help**

### **Common Issues**
- See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for setup steps
- Review [ARCHITECTURE.md](./ARCHITECTURE.md) for system design

### **Debugging Steps**
1. Check container status: `docker compose ps`
2. View service logs: `docker compose logs <service>`
3. Test connectivity: `curl -H 'Host: domain.com' http://localhost:80/`
4. Verify Traefik routing: Check Traefik dashboard

## 📝 **Development Workflow**

### **Making Changes**
1. Edit source code locally
2. Copy files to server: `scp file ubuntu@server:/path/`
3. Rebuild container: `docker compose up -d --build <service>`
4. Test changes

### **Adding New Services**
1. Add service to `docker-compose.yml`
2. Configure Traefik labels for routing
3. Update DNS/Cloudflare if needed
4. Deploy with `docker compose up -d`

## 🔄 **Deployment Process**

### **Initial Setup**
1. Run `./deploy.sh` to create infrastructure
2. Configure Cloudflare tunnel routing
3. Start applications with `docker compose up -d`
4. Test both domains

### **Updates**
1. Stop services: `docker compose down`
2. Update code/files
3. Restart: `docker compose up -d`
4. Verify functionality

### **Cleanup**
- Run `./destroy.sh` to remove infrastructure
- **Warning**: This will delete all data and stop billing

## 📞 **Support & Contact**

For issues or questions:
1. Check this documentation first
2. Review troubleshooting guide
3. Check service logs
4. Verify network connectivity

## 🛡️ **Security Features**

### **Enterprise-Grade Protection**
- **Input Validation**: Comprehensive Zod schemas with security controls
- **Content Sanitization**: DOMPurify prevents XSS attacks
- **Rate Limiting**: Token bucket algorithm per IP hash per endpoint
- **App Check**: Firebase App Check with reCAPTCHA v3 protection
- **Data Privacy**: IP hashing, minimal PII collection, secure metadata tracking

### **Security Validation**
- ✅ HTML tag injection blocked
- ✅ JavaScript URL injection blocked  
- ✅ Script tag execution prevented
- ✅ Rate limiting active (5 RSVP/min, 3 feedback/min, 10 volunteer/min)
- ✅ User agent sanitization
- ✅ Server timestamp enforcement

---

**Last Updated**: August 28, 2025  
**Version**: 1.3.0  
**Status**: Production Ready with Admin System + GCP Migration Planning 🛡️🚀

### **✅ Recently Completed**
- **Admin Authentication System**: Fully functional login and dashboard
- **Admin Event Management**: Event listing and management interface  
- **Text Visibility Fixes**: Multiple CSS approaches to ensure readable text
- **Email Integration**: cubmaster@sfpack1703.com configured via Zoho Mail
- **Production Deployment**: All features deployed and accessible

### **🚀 Next Phase: GCP Migration**
- **Migration Goal**: Transform to fully serverless GCP architecture
- **Cost Reduction**: $10-15/month → $0.60/month (95% savings)
- **Timeline**: 12 weeks for complete migration
- **Benefits**: Auto-scaling, zero maintenance, global performance
