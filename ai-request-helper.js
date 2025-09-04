
// AI Request Helper
// Use this to make authenticated AI requests to cloud functions

const AI_CONFIG = {
  "accountId": "A2h5xPN30P28hGyPEKXn",
  "email": "ai-assistant@sfpack1703.com",
  "secretToken": "54fbb4f56ae67850454e2f7c358aaf16798e92f0905c09462a3dd66e88535a00",
  "permissions": [
    "ai_content_generation",
    "ai_data_analysis",
    "ai_automation",
    "ai_system_integration",
    "ai_event_creation",
    "ai_announcement_creation",
    "ai_email_monitoring",
    "ai_system_commands",
    "read_content",
    "create_content",
    "update_content",
    "delete_content",
    "event_management",
    "announcement_management",
    "system_admin"
  ],
  "createdAt": "2025-09-04T20:37:49.166Z"
};

function makeAIRequest(functionName, data) {
  return fetch(`/api/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-ai-token': AI_CONFIG.secretToken,
      'x-ai-request-id': crypto.randomUUID()
    },
    body: JSON.stringify(data)
  });
}

// Example usage:
// makeAIRequest('aiGenerateContent', { type: 'event_description', prompt: 'Create a fun camping event' });
