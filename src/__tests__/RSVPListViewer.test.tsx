import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RSVPListViewer from '../components/Admin/RSVPListViewer';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

// Mock Firebase
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
  orderBy: jest.fn(),
}));

// Mock Firebase config
jest.mock('../firebase/config', () => ({
  db: {},
}));

// Mock data
const mockRSVPData = [
  {
    id: 'rsvp1',
    eventId: 'event1',
    userId: 'user1',
    userEmail: 'admin@test.com',
    familyName: 'Smith Family',
    email: 'smith@test.com',
    phone: '555-1234',
    attendees: [
      {
        name: 'John Smith',
        age: 8,
        den: 'Wolves',
        isAdult: false
      },
      {
        name: 'Jane Smith',
        age: 35,
        den: 'Wolves',
        isAdult: true
      }
    ],
    dietaryRestrictions: 'No nuts',
    specialNeeds: 'Wheelchair accessible',
    notes: 'Looking forward to the event!',
    submittedAt: { toDate: () => new Date('2025-01-01T10:00:00Z') }
  },
  {
    id: 'rsvp2',
    eventId: 'event1',
    userId: 'user2',
    userEmail: 'parent@test.com',
    familyName: 'Johnson Family',
    email: 'johnson@test.com',
    phone: '555-5678',
    attendees: [
      {
        name: 'Mike Johnson',
        age: 7,
        den: 'Tigers',
        isAdult: false
      }
    ],
    submittedAt: { toDate: () => new Date('2025-01-01T11:00:00Z') }
  }
];

const mockEventData = {
  id: 'event1',
  title: 'Pack Camping Trip'
};

describe('RSVPListViewer', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (getDocs as jest.Mock).mockResolvedValue({
      forEach: (callback: any) => mockRSVPData.forEach(callback)
    });
  });

  it('renders loading state initially', () => {
    render(
      <RSVPListViewer
        eventId={mockEventData.id}
        eventTitle={mockEventData.title}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Loading RSVPs...')).toBeInTheDocument();
  });

  it('renders RSVP data after loading', async () => {
    render(
      <RSVPListViewer
        eventId={mockEventData.id}
        eventTitle={mockEventData.title}
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('RSVP List')).toBeInTheDocument();
      expect(screen.getByText('Pack Camping Trip')).toBeInTheDocument();
    });

    // Check for family names
    expect(screen.getByText('Smith Family')).toBeInTheDocument();
    expect(screen.getByText('Johnson Family')).toBeInTheDocument();

    // Check for attendee names
    expect(screen.getByText('John Smith')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Mike Johnson')).toBeInTheDocument();
  });

  it('displays correct statistics', async () => {
    render(
      <RSVPListViewer
        eventId={mockEventData.id}
        eventTitle={mockEventData.title}
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument(); // Total RSVPs
      expect(screen.getByText('3')).toBeInTheDocument(); // Total Attendees
      expect(screen.getByText('2')).toBeInTheDocument(); // Dens Represented
    });
  });

  it('shows dietary restrictions and special needs', async () => {
    render(
      <RSVPListViewer
        eventId={mockEventData.id}
        eventTitle={mockEventData.title}
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Dietary Restrictions:')).toBeInTheDocument();
      expect(screen.getByText('No nuts')).toBeInTheDocument();
      expect(screen.getByText('Special Needs:')).toBeInTheDocument();
      expect(screen.getByText('Wheelchair accessible')).toBeInTheDocument();
      expect(screen.getByText('Notes:')).toBeInTheDocument();
      expect(screen.getByText('Looking forward to the event!')).toBeInTheDocument();
    });
  });

  it('displays attendee age and den information', async () => {
    render(
      <RSVPListViewer
        eventId={mockEventData.id}
        eventTitle={mockEventData.title}
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Age 8 • Wolves')).toBeInTheDocument();
      expect(screen.getByText('Age 35 • Wolves')).toBeInTheDocument();
      expect(screen.getByText('Age 7 • Tigers')).toBeInTheDocument();
    });
  });

  it('shows adult badges for adult attendees', async () => {
    render(
      <RSVPListViewer
        eventId={mockEventData.id}
        eventTitle={mockEventData.title}
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Adult')).toBeInTheDocument();
    });
  });

  it('handles close button click', async () => {
    render(
      <RSVPListViewer
        eventId={mockEventData.id}
        eventTitle={mockEventData.title}
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);
    });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('handles refresh button click', async () => {
    render(
      <RSVPListViewer
        eventId={mockEventData.id}
        eventTitle={mockEventData.title}
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      fireEvent.click(refreshButton);
    });

    // Should call getDocs again
    expect(getDocs).toHaveBeenCalledTimes(2);
  });

  it('exports CSV when export button is clicked', async () => {
    // Mock URL.createObjectURL and URL.revokeObjectURL
    const mockCreateObjectURL = jest.fn().mockReturnValue('mock-url');
    const mockRevokeObjectURL = jest.fn();
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;

    // Mock document.createElement and click
    const mockClick = jest.fn();
    const mockLink = document.createElement('a');
    mockLink.click = mockClick;
    jest.spyOn(document, 'createElement').mockReturnValue(mockLink);

    render(
      <RSVPListViewer
        eventId={mockEventData.id}
        eventTitle={mockEventData.title}
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      const exportButton = screen.getByRole('button', { name: /export csv/i });
      fireEvent.click(exportButton);
    });

    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();
    expect(mockRevokeObjectURL).toHaveBeenCalled();
  });

  it('displays no RSVPs message when no data', async () => {
    (getDocs as jest.Mock).mockResolvedValue({
      forEach: () => {} // Empty data
    });

    render(
      <RSVPListViewer
        eventId={mockEventData.id}
        eventTitle={mockEventData.title}
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('No RSVPs Yet')).toBeInTheDocument();
      expect(screen.getByText('No one has RSVP\'d for this event yet.')).toBeInTheDocument();
    });
  });

  it('handles loading errors gracefully', async () => {
    (getDocs as jest.Mock).mockRejectedValue(new Error('Firestore error'));

    render(
      <RSVPListViewer
        eventId={mockEventData.id}
        eventTitle={mockEventData.title}
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load RSVPs')).toBeInTheDocument();
    });
  });

  it('formats dates correctly', async () => {
    render(
      <RSVPListViewer
        eventId={mockEventData.id}
        eventTitle={mockEventData.title}
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      // Check that dates are displayed (exact format may vary by locale)
      expect(screen.getByText(/1\/1\/2025/)).toBeInTheDocument();
    });
  });
});
