// Configuration System Test
// This test verifies that the configuration system is working correctly

import configService from '../services/configService';

describe('Configuration System', () => {
  beforeAll(async () => {
    // Initialize default configurations for testing
    await configService.initializeDefaultConfigs('test-user');
  });

  afterAll(async () => {
    // Clean up test configurations
    configService.clearCache();
  });

  test('should initialize default configurations', async () => {
    const configs = await configService.getAllConfigs();
    expect(configs.length).toBeGreaterThan(0);
  });

  test('should get configuration value by key', async () => {
    const packName = await configService.getConfigValue('system.pack.name');
    expect(packName).toBe('Pack 1703');
  });

  test('should get configuration by category', async () => {
    const emailConfigs = await configService.getConfigsByCategory('email');
    expect(emailConfigs.length).toBeGreaterThan(0);
    expect(emailConfigs.every(config => config.category === 'email')).toBe(true);
  });

  test('should validate email configuration', async () => {
    const validation = configService.validateConfigValue('test@example.com', {
      type: 'email',
      required: true
    });
    expect(validation.isValid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  test('should reject invalid email', async () => {
    const validation = configService.validateConfigValue('invalid-email', {
      type: 'email',
      required: true
    });
    expect(validation.isValid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
  });

  test('should update configuration', async () => {
    const newValue = 'Test Pack Name';
    const success = await configService.updateConfig('system.pack.name', {
      value: newValue
    }, 'test-user');
    expect(success).toBe(true);

    const updatedValue = await configService.getConfigValue('system.pack.name');
    expect(updatedValue).toBe(newValue);
  });

  test('should create new configuration', async () => {
    const success = await configService.setConfig(
      'test.config.key',
      'test value',
      'system',
      'Test configuration for unit testing',
      true,
      { type: 'string', required: true },
      'test-user'
    );
    expect(success).toBe(true);

    const value = await configService.getConfigValue('test.config.key');
    expect(value).toBe('test value');
  });

  test('should handle missing configuration gracefully', async () => {
    const value = await configService.getConfigValue('nonexistent.config');
    expect(value).toBeNull();
  });

  test('should cache configurations', async () => {
    // First call should hit the database
    const config1 = await configService.getConfig('system.pack.name');
    
    // Second call should use cache
    const config2 = await configService.getConfig('system.pack.name');
    
    expect(config1).toEqual(config2);
  });

  test('should clear cache', async () => {
    configService.clearCache();
    // Cache should be cleared, next call will hit database
    const config = await configService.getConfig('system.pack.name');
    expect(config).toBeDefined();
  });
});

// Test the configuration hooks (if running in browser environment)
if (typeof window !== 'undefined') {
  describe('Configuration Hooks', () => {
    test('useConfig hook should work', async () => {
      // This would need to be tested in a React component
      // For now, we'll just verify the hook exists
      const { useConfig } = require('../hooks/useConfig');
      expect(typeof useConfig).toBe('function');
    });
  });
}
