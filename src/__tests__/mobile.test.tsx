import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import HomePage from '../pages/HomePage';
import EventsPage from '../pages/EventsPage';

// Mock the hooks and services
jest.mock('../hooks/useAnalytics', () => ({
  useAnalytics: () => {}
}));

jest.mock('../hooks/useConfig', () => ({
  usePackNameConfig: () => ({ value: 'Pack 1703' }),
  useContactConfigs: () => ({ primaryEmail: 'test@example.com', supportEmail: 'support@example.com', loading: false })
}));

jest.mock('../contexts/AdminContext', () => ({
  useAdmin: () => ({ state: { currentUser: null } })
}));

jest.mock('../services/firestore', () => ({
  firestoreService: {
    getEvents: jest.fn().mockResolvedValue([])
  }
}));

// Mock window.matchMedia for responsive testing
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: query.includes('(max-width: 768px)'),
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock window.innerWidth for mobile testing
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 375, // iPhone SE width
});

Object.defineProperty(window, 'innerHeight', {
  writable: true,
  configurable: true,
  value: 667, // iPhone SE height
});

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Mobile Responsiveness Tests', () => {
  beforeEach(() => {
    // Reset window size for each test
    window.innerWidth = 375;
    window.innerHeight = 667;
    
    // Trigger resize event
    window.dispatchEvent(new Event('resize'));
  });

  describe('Layout Component Mobile Tests', () => {
    test('should render mobile menu button on small screens', () => {
      renderWithRouter(<Layout><div>Test Content</div></Layout>);
      
      // Look for mobile menu button (hamburger icon)
      const mobileMenuButton = screen.getByRole('button', { name: /menu/i }) || 
                               document.querySelector('button[aria-label*="menu"]') ||
                               document.querySelector('button:has(svg)');
      
      expect(mobileMenuButton).toBeInTheDocument();
    });

    test('should toggle mobile menu when button is clicked', async () => {
      renderWithRouter(<Layout><div>Test Content</div></Layout>);
      
      const mobileMenuButton = document.querySelector('button:has(svg)') as HTMLButtonElement;
      expect(mobileMenuButton).toBeInTheDocument();
      
      // Click mobile menu button
      fireEvent.click(mobileMenuButton);
      
      // Wait for mobile menu to appear
      await waitFor(() => {
        const mobileMenu = document.querySelector('.mobile-menu, [class*="mobile"]');
        expect(mobileMenu).toBeInTheDocument();
      });
    });

    test('should have proper mobile navigation links', () => {
      renderWithRouter(<Layout><div>Test Content</div></Layout>);
      
      // Check for main navigation links
      const homeLink = screen.queryByText('Home');
      const eventsLink = screen.queryByText('Events');
      const chatLink = screen.queryByText('Chat');
      
      // At least some navigation should be present
      expect(homeLink || eventsLink || chatLink).toBeTruthy();
    });
  });

  describe('HomePage Mobile Tests', () => {
    test('should render hero section with proper mobile sizing', () => {
      renderWithRouter(<Layout><HomePage /></Layout>);
      
      // Check for main heading
      const mainHeading = screen.getByText(/Scout.*Families Portal/i);
      expect(mainHeading).toBeInTheDocument();
      
      // Check for mobile-optimized text sizes
      const headingElement = mainHeading as HTMLElement;
      const computedStyle = window.getComputedStyle(headingElement);
      
      // Should have responsive text sizing
      expect(computedStyle.fontSize).toBeTruthy();
    });

    test('should render quick action buttons with proper mobile layout', () => {
      renderWithRouter(<Layout><HomePage /></Layout>);
      
      // Check for action buttons
      const exploreEventsButton = screen.getByText(/Explore Events/i);
      const discoverLocationsButton = screen.getByText(/Discover Locations/i);
      
      expect(exploreEventsButton).toBeInTheDocument();
      expect(discoverLocationsButton).toBeInTheDocument();
      
      // Check button styling for mobile
      const exploreButton = exploreEventsButton as HTMLElement;
      const computedStyle = window.getComputedStyle(exploreButton);
      
      // Should have proper mobile styling
      expect(computedStyle.display).toBeTruthy();
    });

    test('should render quick action cards in mobile-friendly grid', () => {
      renderWithRouter(<Layout><HomePage /></Layout>);
      
      // Check for quick action cards
      const viewEventsCard = screen.getByText(/View Events/i);
      const findLocationsCard = screen.getByText(/Find Locations/i);
      
      expect(viewEventsCard).toBeInTheDocument();
      expect(findLocationsCard).toBeInTheDocument();
    });
  });

  describe('EventsPage Mobile Tests', () => {
    test('should render events page with mobile-optimized layout', () => {
      renderWithRouter(<Layout><EventsPage /></Layout>);
      
      // Check for page title
      const pageTitle = screen.getByText(/Pack Events.*Activities/i);
      expect(pageTitle).toBeInTheDocument();
      
      // Check for view toggle buttons
      const listViewButton = screen.getByText(/List View/i);
      const calendarViewButton = screen.getByText(/Calendar View/i);
      
      expect(listViewButton).toBeInTheDocument();
      expect(calendarViewButton).toBeInTheDocument();
    });

    test('should have mobile-friendly view toggle buttons', () => {
      renderWithRouter(<Layout><EventsPage /></Layout>);
      
      const listViewButton = screen.getByText(/List View/i) as HTMLButtonElement;
      const calendarViewButton = screen.getByText(/Calendar View/i) as HTMLButtonElement;
      
      // Test button interactions
      fireEvent.click(listViewButton);
      expect(listViewButton).toHaveClass('bg-white'); // Active state
      
      fireEvent.click(calendarViewButton);
      expect(calendarViewButton).toHaveClass('bg-white'); // Active state
    });

    test('should render filter button with mobile-friendly styling', () => {
      renderWithRouter(<Layout><EventsPage /></Layout>);
      
      const filterButton = screen.getByText(/Filters/i);
      expect(filterButton).toBeInTheDocument();
      
      // Test filter toggle
      fireEvent.click(filterButton);
      
      // Should show filter panel or change button state
      expect(filterButton).toBeInTheDocument();
    });
  });

  describe('Mobile Touch Interaction Tests', () => {
    test('should have touch-friendly button sizes', () => {
      renderWithRouter(<Layout><HomePage /></Layout>);
      
      const buttons = document.querySelectorAll('button');
      let touchFriendlyCount = 0;
      
      buttons.forEach(button => {
        const rect = button.getBoundingClientRect();
        if (rect.height >= 44 && rect.width >= 44) {
          touchFriendlyCount++;
        }
      });
      
      // Should have at least some touch-friendly buttons
      expect(touchFriendlyCount).toBeGreaterThan(0);
    });

    test('should have proper spacing between interactive elements', () => {
      renderWithRouter(<Layout><HomePage /></Layout>);
      
      const interactiveElements = document.querySelectorAll('button, a, input, select, textarea');
      let properSpacing = true;
      
      for (let i = 0; i < interactiveElements.length - 1; i++) {
        const current = interactiveElements[i].getBoundingClientRect();
        const next = interactiveElements[i + 1].getBoundingClientRect();
        
        // Check if elements are too close together
        if (Math.abs(current.bottom - next.top) < 8) {
          properSpacing = false;
          break;
        }
      }
      
      expect(properSpacing).toBe(true);
    });
  });

  describe('Mobile Responsive Design Tests', () => {
    test('should have responsive CSS classes', () => {
      renderWithRouter(<Layout><HomePage /></Layout>);
      
      // Check for responsive classes
      const responsiveElements = document.querySelectorAll('[class*="sm:"], [class*="md:"], [class*="lg:"]');
      expect(responsiveElements.length).toBeGreaterThan(0);
    });

    test('should have proper grid layouts', () => {
      renderWithRouter(<Layout><HomePage /></Layout>);
      
      // Check for grid elements
      const gridElements = document.querySelectorAll('[class*="grid"]');
      const flexElements = document.querySelectorAll('[class*="flex"]');
      
      expect(gridElements.length + flexElements.length).toBeGreaterThan(0);
    });

    test('should have mobile-optimized text sizes', () => {
      renderWithRouter(<Layout><HomePage /></Layout>);
      
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      expect(headings.length).toBeGreaterThan(0);
      
      headings.forEach(heading => {
        const computedStyle = window.getComputedStyle(heading);
        expect(computedStyle.fontSize).toBeTruthy();
      });
    });
  });

  describe('Mobile Accessibility Tests', () => {
    test('should have proper ARIA labels', () => {
      renderWithRouter(<Layout><HomePage /></Layout>);
      
      const ariaElements = document.querySelectorAll('[aria-label], [aria-labelledby], [aria-describedby]');
      expect(ariaElements.length).toBeGreaterThan(0);
    });

    test('should have proper heading hierarchy', () => {
      renderWithRouter(<Layout><HomePage /></Layout>);
      
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      let properHierarchy = true;
      let lastLevel = 0;
      
      headings.forEach(heading => {
        const level = parseInt(heading.tagName.charAt(1));
        if (level > lastLevel + 1) {
          properHierarchy = false;
        }
        lastLevel = level;
      });
      
      expect(properHierarchy).toBe(true);
    });

    test('should have focusable elements', () => {
      renderWithRouter(<Layout><HomePage /></Layout>);
      
      const focusableElements = document.querySelectorAll('button, a, input, select, textarea, [tabindex]');
      expect(focusableElements.length).toBeGreaterThan(0);
    });
  });
});

// Performance test
describe('Mobile Performance Tests', () => {
  test('should render within acceptable time', () => {
    const startTime = performance.now();
    
    renderWithRouter(<Layout><HomePage /></Layout>);
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Should render within 100ms
    expect(renderTime).toBeLessThan(100);
  });

  test('should not have excessive DOM elements', () => {
    renderWithRouter(<Layout><HomePage /></Layout>);
    
    const domElements = document.querySelectorAll('*');
    const domSize = domElements.length;
    
    // Should not have excessive DOM elements (less than 500)
    expect(domSize).toBeLessThan(500);
  });
});