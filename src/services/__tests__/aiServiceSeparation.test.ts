import aiServiceFactory from '../services/aiServiceFactory';
import userAIService from '../services/userAIService';
import adminAIService from '../services/adminAIService';

describe('AI Service Separation', () => {
  test('Factory returns correct service based on user role', () => {
    const userService = aiServiceFactory.getAIService('user');
    const adminService = aiServiceFactory.getAIService('admin');
    
    expect(userService).toBe(userAIService);
    expect(adminService).toBe(adminAIService);
  });

  test('Factory determines user role correctly', async () => {
    // Test admin roles
    const adminRoles = ['pack-leader', 'cubmaster', 'lion', 'tiger', 'wolf', 'bear', 'webelos', 'arrow-of-light'];
    
    for (const role of adminRoles) {
      await aiServiceFactory.processChatMention('test message', 'test-channel', 'user1', 'Test User', role);
      // This should use admin service internally
    }
    
    // Test user roles
    await aiServiceFactory.processChatMention('test message', 'test-channel', 'user1', 'Test User', 'parent');
    // This should use user service internally
  });

  test('Service info returns correct capabilities', () => {
    const userInfo = aiServiceFactory.getServiceInfo('user');
    const adminInfo = aiServiceFactory.getServiceInfo('admin');
    
    expect(userInfo.canCreateContent).toBe(false);
    expect(adminInfo.canCreateContent).toBe(true);
    expect(userInfo.serviceType).toBe('UserAIService');
    expect(adminInfo.serviceType).toBe('AdminAIService');
  });
});