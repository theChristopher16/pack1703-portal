interface Event {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  description?: string;
  location?: {
    name: string;
    address: string;
  };
  category?: string;
  denTags?: string[];
}

interface ICSFeedOptions {
  categories?: string[];
  dens?: string[];
  startDate?: string;
  endDate?: string;
  includeDescription?: boolean;
  includeLocation?: boolean;
}

/**
 * Generate ICS content for a single event
 */
export const generateEventICS = (event: Event): string => {
  const startDate = new Date(`${event.date}T${event.startTime}`);
  const endDate = new Date(`${event.date}T${event.endTime}`);
  
  // Format dates for ICS (YYYYMMDDTHHMMSSZ)
  const formatICSDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };
  
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Pack 1703//Event Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.id}@pack1703.com`,
    `DTSTAMP:${formatICSDate(new Date())}`,
    `DTSTART:${formatICSDate(startDate)}`,
    `DTEND:${formatICSDate(endDate)}`,
    `SUMMARY:${event.title}`,
    event.description ? `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}` : '',
    event.location ? `LOCATION:${event.location.name}, ${event.location.address}` : '',
    event.category ? `CATEGORIES:${event.category}` : '',
    event.denTags && event.denTags.length > 0 ? `CATEGORIES:${event.denTags.join(',')}` : '',
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(line => line !== '').join('\r\n');
  
  return icsContent;
};

/**
 * Generate ICS content for multiple events (feed)
 */
export const generateEventsICS = (events: Event[], options: ICSFeedOptions = {}): string => {
  const {
    categories = [],
    dens = [],
    startDate,
    endDate,
    includeDescription = true,
    includeLocation = true
  } = options;
  
  // Filter events based on options
  let filteredEvents = events;
  
  if (categories.length > 0) {
    filteredEvents = filteredEvents.filter(event => 
      event.category && categories.includes(event.category)
    );
  }
  
  if (dens.length > 0) {
    filteredEvents = filteredEvents.filter(event => 
      event.denTags && event.denTags.some(den => dens.includes(den))
    );
  }
  
  if (startDate) {
    filteredEvents = filteredEvents.filter(event => 
      new Date(event.date) >= new Date(startDate)
    );
  }
  
  if (endDate) {
    filteredEvents = filteredEvents.filter(event => 
      new Date(event.date) <= new Date(endDate)
    );
  }
  
  // Sort events by date
  filteredEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Generate ICS content
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Pack 1703//Event Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Pack 1703 Events',
    'X-WR-CALDESC:Pack 1703 Family Events and Activities',
    'X-WR-TIMEZONE:America/Chicago'
  ];
  
  // Add timezone information
  icsContent.push(
    'BEGIN:VTIMEZONE',
    'TZID:America/Chicago',
    'BEGIN:STANDARD',
    'DTSTART:19671105T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU',
    'TZOFFSETFROM:-0500',
    'TZOFFSETTO:-0600',
    'TZNAME:CST',
    'END:STANDARD',
    'BEGIN:DAYLIGHT',
    'DTSTART:19670312T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU',
    'TZOFFSETFROM:-0600',
    'TZOFFSETTO:-0500',
    'TZNAME:CDT',
    'END:DAYLIGHT',
    'END:VTIMEZONE'
  );
  
  // Add events
  filteredEvents.forEach(event => {
    const startDate = new Date(`${event.date}T${event.startTime}`);
    const endDate = new Date(`${event.date}T${event.endTime}`);
    
    const formatICSDate = (date: Date): string => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    icsContent.push(
      'BEGIN:VEVENT',
      `UID:${event.id}@pack1703.com`,
      `DTSTAMP:${formatICSDate(new Date())}`,
      `DTSTART;TZID=America/Chicago:${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}`,
      `DTEND;TZID=America/Chicago:${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}`,
      `SUMMARY:${event.title}`,
      includeDescription && event.description ? `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}` : '',
      includeLocation && event.location ? `LOCATION:${event.location.name}, ${event.location.address}` : '',
      event.category ? `CATEGORIES:${event.category}` : '',
      event.denTags && event.denTags.length > 0 ? `CATEGORIES:${event.denTags.join(',')}` : '',
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      'END:VEVENT'
    );
  });
  
  icsContent.push('END:VCALENDAR');
  
  return icsContent.filter(line => line !== '').join('\r\n');
};

/**
 * Download ICS file
 */
export const downloadICS = (icsContent: string, filename: string): void => {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.ics') ? filename : `${filename}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Generate ICS feed using Cloud Function
 */
export const generateICSFeedURL = async (options: ICSFeedOptions = {}): Promise<string> => {
  try {
    // Import Firebase Functions
    const { getFunctions, httpsCallable } = await import('firebase/functions');
    const functions = getFunctions();
    const icsFeed = httpsCallable(functions, 'icsFeed');
    
    // Call the Cloud Function with options
    const result = await icsFeed({
      categories: options.categories,
      denTags: options.dens,
      startDate: options.startDate,
      endDate: options.endDate
    });
    
    const data = result.data as any;
    if (data.success && data.icsContent) {
      // Create and download the ICS file
      const blob = new Blob([data.icsContent], { type: 'text/calendar' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pack1703-events-${new Date().toISOString().split('T')[0]}.ics`;
      link.click();
      URL.revokeObjectURL(url);
      
      return `ICS feed generated with ${data.eventCount} events`;
    } else {
      throw new Error('Failed to generate ICS feed');
    }
  } catch (error) {
    console.error('Error generating ICS feed:', error);
    throw error;
  }
};

/**
 * Validate ICS content
 */
export const validateICS = (icsContent: string): boolean => {
  const requiredSections = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'END:VCALENDAR'
  ];
  
  return requiredSections.every(section => icsContent.includes(section));
};

/**
 * Parse ICS content back to events (basic implementation)
 */
export const parseICS = (icsContent: string): Event[] => {
  const events: Event[] = [];
  const lines = icsContent.split('\r\n');
  
  let currentEvent: Partial<Event> = {};
  let inEvent = false;
  
  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      currentEvent = {};
    } else if (line === 'END:VEVENT') {
      if (inEvent && currentEvent.id && currentEvent.title && currentEvent.date) {
        events.push(currentEvent as Event);
      }
      inEvent = false;
    } else if (inEvent) {
      const [key, value] = line.split(':', 2);
      if (key && value) {
        switch (key) {
          case 'UID':
            currentEvent.id = value.replace('@pack1703.com', '');
            break;
          case 'SUMMARY':
            currentEvent.title = value;
            break;
          case 'DTSTART':
            // Parse date from ICS format
            const dateStr = value.replace(/[TZ]/g, ' ').trim();
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
              currentEvent.date = date.toISOString().split('T')[0];
            }
            break;
          case 'DESCRIPTION':
            currentEvent.description = value.replace(/\\n/g, '\n');
            break;
          case 'LOCATION':
            const [name, address] = value.split(', ', 2);
            currentEvent.location = { name, address: address || '' };
            break;
        }
      }
    }
  }
  
  return events;
};
