import { describe, it, expect } from 'vitest';

describe('Basic Test Setup', () => {
  it('should work', () => {
    expect(1 + 1).toBe(2);
  });

  it('should have working mocks', () => {
    // Test that our mocks are working
    const mockFn = vi.fn(() => 'test');
    expect(mockFn()).toBe('test');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});
