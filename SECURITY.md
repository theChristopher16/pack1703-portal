# 🛡️ **SECURITY IMPLEMENTATION GUIDE**

## 📋 **Security Overview**

The Pack 1703 & Smith Station RSVP system implements **enterprise-grade security** to protect user data and prevent attacks. This document details all security measures implemented.

## 🔒 **Security Features Implemented**

### **1. Input Validation (Zod Schemas)**
- **Purpose**: Prevent malicious input and ensure data integrity
- **Implementation**: Enhanced Zod validation schemas with security controls
- **Location**: `app/sfpack1703app/src/types/validation.ts`

**Features**:
- ✅ HTML tag injection blocking (`<script>`, `<iframe>`, etc.)
- ✅ JavaScript URL blocking (`javascript:` protocols)
- ✅ Data URL blocking (`data:` protocols)  
- ✅ Length limits to prevent DoS attacks
- ✅ Email format validation (RFC compliant)
- ✅ Phone number sanitization
- ✅ Age validation (0-120 years)

### **2. Content Sanitization (DOMPurify)**
- **Purpose**: Prevent XSS attacks and malicious content injection
- **Implementation**: DOMPurify with strict configuration
- **Location**: `app/sfpack1703app/src/services/security.ts`

**Features**:
- ✅ XSS prevention - All user content sanitized
- ✅ HTML stripping - Dangerous tags completely removed
- ✅ Attribute filtering - No dangerous attributes allowed
- ✅ Protocol validation - Only safe protocols permitted
- ✅ Script tag detection and blocking

### **3. Rate Limiting**
- **Purpose**: Prevent spam, abuse, and DoS attacks
- **Implementation**: Token bucket algorithm per IP hash per endpoint
- **Location**: `app/sfpack1703app/src/services/security.ts`

**Rate Limits**:
- **RSVP Forms**: 5 requests per minute per IP
- **Feedback Forms**: 3 requests per minute per IP
- **Volunteer Forms**: 10 requests per minute per IP
- **Default**: 10 requests per minute per IP

**Features**:
- ✅ Per-endpoint granular limits
- ✅ IP hash based (privacy-preserving)
- ✅ Token bucket algorithm (smooth rate limiting)
- ✅ Memory cleanup (prevents memory leaks)

### **4. App Check Enforcement**
- **Purpose**: Verify requests come from legitimate app instances
- **Implementation**: Firebase App Check with reCAPTCHA v3
- **Location**: `app/sfpack1703app/src/firebase/config.ts`

**Features**:
- ✅ Production protection - All Cloud Functions require App Check
- ✅ Development flexibility - Debug tokens for testing
- ✅ reCAPTCHA v3 integration - Bot protection
- ✅ Automatic token refresh

### **5. Secure Metadata Collection**
- **Purpose**: Track security events without storing PII
- **Implementation**: IP hashing with salt, user agent sanitization
- **Location**: `app/sfpack1703app/src/services/security.ts`

**Features**:
- ✅ IP address hashing (salted SHA-256)
- ✅ User agent sanitization
- ✅ Server timestamp enforcement
- ✅ No PII stored in security metadata

## 🧠 **LLM & MCP Security (NEW)**

### **6. LLM Integration Security**
- **Purpose**: Secure AI-powered content generation and MCP tool access
- **Implementation**: Server-side only LLM calls with comprehensive security controls
- **Location**: `functions/src/llm/` and `functions/src/mcp/`

**Features**:
- ✅ **Server-side only**: No client-side calls to paid LLM APIs
- ✅ **Admin-only access**: MCP tools require Firebase Auth custom claims
- ✅ **Rate limiting**: Stricter limits for destructive operations
- ✅ **Per-admin quotas**: Usage tracking and limits per admin user
- ✅ **Content sanitization**: All generated content sanitized before storage
- ✅ **Accessibility validation**: Generated content checked for WCAG 2.2 AA compliance

### **7. MCP Protocol Security**
- **Purpose**: Secure Model Context Protocol implementation with admin-only tools
- **Implementation**: MCP server with Firebase Auth integration and audit logging
- **Location**: `functions/src/mcp/server.ts`

**Security Controls**:
- ✅ **Authentication required**: All MCP tools require valid admin session
- ✅ **JSON-mode enforcement**: All LLM outputs must be valid JSON
- ✅ **Field mapping validation**: Explicit field mappings required for all operations
- ✅ **No direct Firestore access**: LLM agents can only use MCP tools → Cloud Functions
- ✅ **Audit logging**: All MCP operations logged with full context

### **8. Advanced Rate Limiting for LLM/MCP**
- **Purpose**: Prevent abuse of AI services and admin tools
- **Implementation**: Enhanced token bucket with per-admin quotas
- **Location**: `functions/src/security/rate-limiting.ts`

**Rate Limits**:
- **Content Generation**: 20 requests per hour per admin
- **CRUD Operations**: 100 requests per hour per admin
- **Destructive Operations**: 10 requests per hour per admin (delete, restore)
- **MCP Tool Calls**: 50 requests per hour per admin
- **Resource Queries**: 200 requests per hour per admin

**Features**:
- ✅ **Per-admin tracking**: Individual quotas and usage monitoring
- ✅ **Operation-specific limits**: Different limits for different operation types
- ✅ **Quota enforcement**: Hard limits with graceful degradation
- ✅ **Usage analytics**: Detailed tracking for security monitoring

### **9. Content Moderation & Safety**
- **Purpose**: Ensure AI-generated content meets safety and quality standards
- **Implementation**: Multi-stage moderation pipeline with human review
- **Location**: `functions/src/moderation/pipeline.ts`

**Moderation Stages**:
- ✅ **Pre-generation validation**: Input validation before LLM calls
- ✅ **AI-powered analysis**: Content scoring and inappropriate content detection
- ✅ **Human review queue**: Flagged content sent for human review
- ✅ **Post-approval monitoring**: Continuous monitoring after approval
- ✅ **False positive handling**: Learning system to reduce false positives

### **10. Audit Logging & Compliance**
- **Purpose**: Comprehensive tracking of all AI and admin operations
- **Implementation**: Detailed audit logs with replay capabilities
- **Location**: `functions/src/audit/`

**Log Fields**:
- ✅ **Actor identification**: adminId, agentId, session details
- ✅ **Operation details**: tool, action, before/after state
- ✅ **Performance metrics**: tokenCounts, latency, schemaVersion
- ✅ **Security context**: allow/deny decisions, rate limit hits
- ✅ **Data references**: docIds, collection names, field changes

**Compliance Features**:
- ✅ **GDPR support**: Data export, deletion, consent management
- ✅ **CCPA compliance**: California privacy law requirements
- ✅ **Audit trail**: Complete history for compliance reporting
- ✅ **Replay helper**: Safe restore operations with full context

## 🔧 **Configuration Requirements**

### **Environment Variables**
Create `app/sfpack1703app/.env` with:
```bash
# Firebase App Check (REQUIRED for production)
REACT_APP_RECAPTCHA_V3_SITE_KEY=your_recaptcha_v3_site_key

# Security Settings
REACT_APP_ENABLE_APP_CHECK=true
REACT_APP_ENABLE_RATE_LIMITING=true
NODE_ENV=production
```

### **Firebase Console Setup**
1. **Go to Firebase Console**: https://console.firebase.google.com/project/pack-1703-portal
2. **Navigate to App Check**: Project Settings → App Check
3. **Register Web App**: Add your domain
4. **Enable reCAPTCHA v3**: Get site key and add to .env
5. **Deploy Cloud Functions**: `firebase deploy --only functions`

## 🧪 **Security Testing**

### **Validation Testing**
```javascript
// Test HTML injection blocking
const testInput = '<script>alert("xss")</script>Hello World';
// Expected output: 'Hello World' (script tags stripped)

// Test rate limiting
// Submit RSVP form 6 times quickly
// Expected: First 5 succeed, 6th returns "Too many requests"
```

### **Manual Security Tests**
```bash
# 1. Test XSS prevention
curl -X POST -H 'Content-Type: application/json' \
  -d '{"familyName": "<script>alert(1)</script>Test Family"}' \
  https://sfpack1703.com/api/submitRSVP

# Should return sanitized: "Test Family"

# 2. Test rate limiting
for i in {1..6}; do
  curl -X POST https://sfpack1703.com/api/submitRSVP
done
# 6th request should return rate limit error

# 3. Test App Check enforcement
curl -X POST https://sfpack1703.com/api/submitRSVP
# Should return "App Check verification required" without valid token
```

## 🔧 **LLM/MCP Configuration Requirements**

### **Environment Variables**
Add to `functions/.env`:
```bash
# LLM API Keys (REQUIRED for AI features)
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
GOOGLE_AI_API_KEY=your_google_ai_api_key

# MCP Server Configuration
MCP_SERVER_PORT=3001
MCP_ADMIN_DOMAIN_WHITELIST=admin.sfpack1703.com,admin.smithstation.io

# Security Settings
LLM_RATE_LIMIT_ENABLED=true
MCP_AUDIT_LOGGING_ENABLED=true
CONTENT_MODERATION_ENABLED=true
```

### **Firebase Console Setup for LLM/MCP**
1. **Go to Firebase Console**: https://console.firebase.google.com/project/pack-1703-portal
2. **Navigate to Authentication**: Users and permissions
3. **Create Admin Users**: Set custom claims for admin access
4. **Configure App Check**: Ensure all Functions require App Check
5. **Set Security Rules**: Configure Firestore rules for admin collections

## 🧪 **LLM/MCP Security Testing**

### **Authentication Testing**
```javascript
// Test admin-only access to MCP tools
const testMCPTool = async (toolName, payload) => {
  // Should fail without admin auth
  const response = await fetch('/api/mcp/tools/' + toolName, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  // Expected: 401 Unauthorized
};

// Test with valid admin auth
const adminResponse = await fetch('/api/mcp/tools/' + toolName, {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + adminToken },
  body: JSON.stringify(payload)
});
// Expected: 200 OK with proper validation
```

### **Rate Limiting Testing**
```bash
# Test admin rate limits
for i in {1..25}; do
  curl -H "Authorization: Bearer $ADMIN_TOKEN" \
    -X POST https://admin.sfpack1703.com/api/mcp/tools/create_event \
    -d '{"title":"Test Event"}'
done
# 21st request should return rate limit error
```

### **Content Safety Testing**
```bash
# Test content moderation
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  -X POST https://admin.sfpack1703.com/api/llm/generate \
  -d '{"prompt":"Generate content about inappropriate topics"}'
# Should return moderation warning or be blocked
```

## ⚠️ **Security Warnings**

### **Critical Security Rules**
1. **NEVER disable App Check** in production
2. **NEVER increase rate limits** without careful consideration
3. **NEVER store raw IP addresses** - always use hashed values
4. **ALWAYS validate and sanitize** user input
5. **NEVER trust client-side validation** alone

### **Production Checklist**
- [ ] App Check enabled and configured
- [ ] reCAPTCHA v3 site key configured
- [ ] Rate limiting active and tested
- [ ] Input validation working on all forms
- [ ] Content sanitization preventing XSS
- [ ] No sensitive data in client bundle
- [ ] All Cloud Functions require App Check
- [ ] Security headers configured in Cloudflare

## 🚨 **Security Incident Response**

### **If Security Issue Detected**
1. **Immediate**: Disable affected endpoint in Cloud Functions
2. **Investigate**: Check logs for attack patterns
3. **Mitigate**: Update validation rules or rate limits
4. **Deploy**: Push security fixes immediately
5. **Monitor**: Watch for continued attack attempts

### **Log Analysis**
```bash
# Check Cloud Function logs
firebase functions:log --only=submitRSVP,submitFeedback,claimVolunteerRole

# Check rate limiting events
grep "Rate limit exceeded" logs/

# Check validation failures
grep "HTML tags are not allowed" logs/
```

## 📊 **Security Metrics**

### **Key Performance Indicators**
- **Rate Limiting Effectiveness**: % of malicious requests blocked
- **Input Validation Success**: % of dangerous content caught
- **App Check Coverage**: % of requests with valid tokens
- **XSS Prevention**: Zero successful script injections

### **Monitoring Commands**
```bash
# Check security service status
docker exec app-sfpack1703-1 npm run security:check

# Monitor rate limiting
docker logs app-sfpack1703-1 | grep "rate limit"

# Check validation errors
docker logs app-sfpack1703-1 | grep "validation failed"
```

## ⚠️ **LLM/MCP Security Warnings**

### **Critical Security Rules**
1. **NEVER expose LLM APIs to public clients** - server-side only
2. **NEVER disable admin authentication** for MCP tools
3. **NEVER increase rate limits** without security review
4. **ALWAYS validate generated content** before storage
5. **ALWAYS log all AI operations** for audit purposes
6. **NEVER trust LLM outputs** without validation

### **Production Checklist for LLM/MCP**
- [ ] LLM API keys configured and secured
- [ ] MCP server authentication enabled
- [ ] Admin users created with proper claims
- [ ] Rate limiting active and tested
- [ ] Content moderation pipeline working
- [ ] Audit logging comprehensive and tested
- [ ] All generated content sanitized
- [ ] Accessibility validation active
- [ ] Compliance reporting functional

## 🚨 **LLM/MCP Security Incident Response**

### **If AI Security Issue Detected**
1. **Immediate**: Disable affected LLM endpoints and MCP tools
2. **Investigate**: Check audit logs for unauthorized access
3. **Mitigate**: Update rate limits, validation rules, or access controls
4. **Deploy**: Push security fixes immediately
5. **Monitor**: Watch for continued attack attempts
6. **Review**: Analyze incident for lessons learned

### **Audit Log Analysis**
```bash
# Check MCP tool usage
firebase functions:log --only=mcp_tool_call

# Check LLM API usage
firebase functions:log --only=llm_content_generation

# Check rate limiting events
grep "Rate limit exceeded" logs/

# Check content moderation
grep "Content flagged" logs/
```

## 📊 **LLM/MCP Security Metrics**

### **Key Performance Indicators**
- **Authentication Success Rate**: % of valid admin sessions
- **Rate Limiting Effectiveness**: % of malicious requests blocked
- **Content Moderation Success**: % of inappropriate content caught
- **Audit Log Completeness**: % of operations properly logged
- **AI Content Safety**: Zero inappropriate content generated

### **Monitoring Commands**
```bash
# Check MCP server status
curl https://admin.sfpack1703.com/api/mcp/health

# Monitor LLM usage
firebase functions:log --only=llm_api_call | grep "tokens_used"

# Check audit log health
curl https://admin.sfpack1703.com/api/audit/health

# Monitor rate limiting
grep "rate limit" logs/ | wc -l
```

---

**Last Updated**: August 28, 2025  
**Security Version**: 2.0.0  
**Status**: Enterprise-Grade Protection + LLM/MCP Security Active 🛡️🧠
