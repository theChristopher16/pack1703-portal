import React from 'react';
import { render, screen } from '@testing-library/react';

// Simple test component
const TestComponent: React.FC<{ title: string }> = ({ title }) => {
  return (
    <div data-testid="test-component">
      <h1>{title}</h1>
      <p>This is a test component</p>
    </div>
  );
};

describe('TestComponent', () => {
  it('renders with title', () => {
    render(<TestComponent title="Test Title" />);
    expect(screen.getByTestId('test-component')).toBeInTheDocument();
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('displays the test content', () => {
    render(<TestComponent title="Another Title" />);
    expect(screen.getByText('This is a test component')).toBeInTheDocument();
  });
});

// Test for utility functions
describe('Utility Functions', () => {
  it('should handle basic math operations', () => {
    expect(2 + 2).toBe(4);
    expect(10 - 5).toBe(5);
    expect(3 * 4).toBe(12);
    expect(15 / 3).toBe(5);
  });

  it('should handle string operations', () => {
    expect('hello' + ' world').toBe('hello world');
    expect('test'.toUpperCase()).toBe('TEST');
    expect('TEST'.toLowerCase()).toBe('test');
  });
});

// Test for async operations
describe('Async Operations', () => {
  it('should handle promises', async () => {
    const result = await Promise.resolve('success');
    expect(result).toBe('success');
  });

  it('should handle async/await', async () => {
    const asyncFunction = async () => {
      return new Promise<string>((resolve) => {
        setTimeout(() => resolve('delayed result'), 0);
      });
    };
    
    const result = await asyncFunction();
    expect(result).toBe('delayed result');
  });
});