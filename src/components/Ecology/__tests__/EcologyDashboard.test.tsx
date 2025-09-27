import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EcologyDashboard from '../EcologyDashboard';

// Mock recharts components to avoid issues in tests
jest.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
}));

describe('EcologyDashboard', () => {
  beforeEach(() => {
    // Mock Date.now to ensure consistent test results
    jest.spyOn(Date, 'now').mockImplementation(() => 1640995200000); // 2022-01-01
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the ecology dashboard with all sensor cards', () => {
    render(<EcologyDashboard />);
    
    // Check for main heading
    expect(screen.getByText('Ecology Dashboard')).toBeInTheDocument();
    
    // Check for all sensor cards
    expect(screen.getByText('Temperature')).toBeInTheDocument();
    expect(screen.getByText('Humidity')).toBeInTheDocument();
    expect(screen.getByText('Pressure')).toBeInTheDocument();
    expect(screen.getByText('Air Quality')).toBeInTheDocument();
    expect(screen.getByText('Light Level')).toBeInTheDocument();
    expect(screen.getAllByText('Soil Moisture')).toHaveLength(2); // Sensor card + chart title
  });

  it('displays current sensor readings', () => {
    render(<EcologyDashboard />);
    
    // Check that sensor values are displayed (should have units)
    expect(screen.getAllByText(/°C/)).toHaveLength(4); // Sensor card + educational ranges
    expect(screen.getAllByText(/%/)).toHaveLength(6); // Humidity and Soil Moisture + ranges + percentages
    expect(screen.getAllByText(/hPa/)).toHaveLength(3); // Sensor card + educational ranges
    expect(screen.getAllByText(/AQI/)).toHaveLength(2); // Sensor card + educational range
    expect(screen.getAllByText(/lux/)).toHaveLength(3); // Sensor card + educational ranges
  });

  it('shows live status when live mode is enabled', () => {
    render(<EcologyDashboard />);
    
    // Check for live status indicator
    expect(screen.getByText(/Live Data/)).toBeInTheDocument();
    expect(screen.getByText('Live')).toBeInTheDocument();
  });

  it('toggles live mode when pause/play button is clicked', async () => {
    render(<EcologyDashboard />);
    
    const liveButton = screen.getByText('Live');
    fireEvent.click(liveButton);
    
    await waitFor(() => {
      expect(screen.getByText('Paused')).toBeInTheDocument();
    });
  });

  it('toggles raw data display when show/hide button is clicked', async () => {
    render(<EcologyDashboard />);
    
    const showDataButton = screen.getByText('Show Data');
    fireEvent.click(showDataButton);
    
    await waitFor(() => {
      expect(screen.getByText('Hide Data')).toBeInTheDocument();
    });
  });

  it('displays educational content for kids', () => {
    render(<EcologyDashboard />);
    
    // Check for educational section (now includes emoji)
    expect(screen.getByText(/What We're Learning/)).toBeInTheDocument();
    
    // Check for educational content
    expect(screen.getByText(/Plants grow best between/)).toBeInTheDocument();
    expect(screen.getByText(/Humidity affects how much water/)).toBeInTheDocument();
    expect(screen.getByText(/Clean air helps plants grow/)).toBeInTheDocument();
  });

  it('displays charts for temperature and humidity', () => {
    render(<EcologyDashboard />);
    
    // Check for chart titles
    expect(screen.getByText('Temperature Trends')).toBeInTheDocument();
    expect(screen.getByText('Humidity Trends')).toBeInTheDocument();
    
    // Check for chart components (we have multiple charts now)
    expect(screen.getAllByTestId('line-chart')).toHaveLength(2); // Temperature and Pressure
    expect(screen.getAllByTestId('area-chart')).toHaveLength(3); // Humidity, Air Quality, Soil Moisture
    expect(screen.getAllByTestId('bar-chart')).toHaveLength(1); // Light level
  });

  it('shows location information', () => {
    render(<EcologyDashboard />);
    
    expect(screen.getByText('📍 Pack 1703 Scout Garden')).toBeInTheDocument();
  });

  it('has refresh functionality', () => {
    render(<EcologyDashboard />);
    
    const refreshButton = screen.getByText('Refresh');
    expect(refreshButton).toBeInTheDocument();
    
    // Click should not throw error
    fireEvent.click(refreshButton);
  });
});
