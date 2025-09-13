// Mock aiAuthService for testing
export const aiAuthService = {
  getAIUser: jest.fn(() => ({ uid: 'ai_user', role: 'ai_assistant' })),
  canAIPerformAction: jest.fn(() => true),
  canAIAccessCollection: jest.fn(() => true),
  hasAIPermission: jest.fn(() => true),
};

export default aiAuthService;
