import { describe, it, expect } from 'vitest';

describe('Basic Test Setup', () => {
  it('should work', () => {
    expect(1 + 1).toBe(2);
  });

  it('should have working mocks', () => {
    // Test that our mocks are working
    const mockFn = () => 'test';
    expect(mockFn()).toBe('test');
  });
});
