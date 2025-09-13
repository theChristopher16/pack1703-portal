/**
 * Institutional Knowledge Service
 * 
 * This service provides foundational information about St. Francis Episcopal School
 * that the AI system can reference when creating events, announcements, and other content.
 */

export interface SchoolInfo {
  name: string;
  fullName: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    fullAddress: string;
  };
  contact: {
    phone: string;
    formattedPhone: string;
    website?: string;
    email?: string;
  };
  campus: {
    description: string;
    facilities: string[];
    notableBuildings: string[];
    recreationalAreas: string[];
  };
  scouting: {
    packNumber: string;
    packName: string;
    organization: string;
    meetingSchedule?: string;
    typicalMeetingLocation?: string;
  };
}

export interface LocationContext {
  school: SchoolInfo;
  nearbyFacilities: {
    medical: string[];
    emergency: string[];
    recreational: string[];
    dining: string[];
  };
  transportation: {
    parking: string[];
    publicTransit?: string[];
    accessibility: string[];
  };
}

class InstitutionalKnowledgeService {
  private schoolInfo: SchoolInfo = {
    name: "St. Francis Episcopal School",
    fullName: "St. Francis Episcopal School",
    address: {
      street: "335 Piney Point Rd",
      city: "Houston",
      state: "TX",
      zipCode: "77024",
      fullAddress: "335 Piney Point Rd, Houston, TX 77024"
    },
    contact: {
      phone: "7134586100",
      formattedPhone: "(713) 458-6100"
    },
    campus: {
      description: "A comprehensive Episcopal school campus featuring academic buildings, recreational facilities, and religious spaces.",
      facilities: [
        "Academic buildings",
        "The Crum Library & Technology Center",
        "St. Francis Episcopal Church",
        "Baseball field",
        "Parking lots",
        "Green spaces and landscaping"
      ],
      notableBuildings: [
        "St. Francis Episcopal School (main academic buildings)",
        "St. Francis Episcopal Church",
        "The Crum Library & Technology Center"
      ],
      recreationalAreas: [
        "Baseball field",
        "Green spaces",
        "Landscaped areas"
      ]
    },
    scouting: {
      packNumber: "1703",
      packName: "Pack 1703",
      organization: "Boy Scouts of America",
      meetingSchedule: "Typically meets on campus",
      typicalMeetingLocation: "St. Francis Episcopal School campus"
    }
  };

  private locationContext: LocationContext = {
    school: this.schoolInfo,
    nearbyFacilities: {
      medical: [
        "Houston Methodist West Hospital (approximately 2 miles)",
        "Memorial Hermann Memorial City Medical Center (approximately 3 miles)",
        "Texas Children's Hospital West Campus (approximately 4 miles)"
      ],
      emergency: [
        "Houston Police Department - Westside Division",
        "Houston Fire Department Station 45",
        "Emergency Services: 911"
      ],
      recreational: [
        "Memorial Park (approximately 3 miles)",
        "Buffalo Bayou Park (approximately 5 miles)",
        "Terry Hershey Park (approximately 2 miles)"
      ],
      dining: [
        "Various restaurants along Memorial Drive",
        "Westheimer Road dining options",
        "Memorial City Mall food court"
      ]
    },
    transportation: {
      parking: [
        "On-campus parking available",
        "Street parking along Piney Point Rd",
        "Designated visitor parking areas"
      ],
      accessibility: [
        "ADA compliant facilities",
        "Accessible parking spaces",
        "Wheelchair accessible entrances"
      ]
    }
  };

  /**
   * Get comprehensive school information
   */
  getSchoolInfo(): SchoolInfo {
    return { ...this.schoolInfo };
  }

  /**
   * Get location context including nearby facilities
   */
  getLocationContext(): LocationContext {
    return { ...this.locationContext };
  }

  /**
   * Get formatted school address
   */
  getFormattedAddress(): string {
    return this.schoolInfo.address.fullAddress;
  }

  /**
   * Get school contact information
   */
  getContactInfo(): { phone: string; formattedPhone: string } {
    return {
      phone: this.schoolInfo.contact.phone,
      formattedPhone: this.schoolInfo.contact.formattedPhone
    };
  }

  /**
   * Get scouting organization information
   */
  getScoutingInfo(): SchoolInfo['scouting'] {
    return { ...this.schoolInfo.scouting };
  }

  /**
   * Get campus facilities list
   */
  getCampusFacilities(): string[] {
    return [...this.schoolInfo.campus.facilities];
  }

  /**
   * Get nearby medical facilities
   */
  getNearbyMedicalFacilities(): string[] {
    return [...this.locationContext.nearbyFacilities.medical];
  }

  /**
   * Get emergency contact information
   */
  getEmergencyContacts(): string[] {
    return [...this.locationContext.nearbyFacilities.emergency];
  }

  /**
   * Get recreational areas near campus
   */
  getNearbyRecreation(): string[] {
    return [...this.locationContext.nearbyFacilities.recreational];
  }

  /**
   * Get parking information
   */
  getParkingInfo(): string[] {
    return [...this.locationContext.transportation.parking];
  }

  /**
   * Generate a comprehensive location summary for AI context
   */
  generateLocationSummary(): string {
    const school = this.schoolInfo;
    const context = this.locationContext;
    
    return `
SCHOOL INFORMATION:
- Name: ${school.fullName}
- Address: ${school.address.fullAddress}
- Phone: ${school.contact.formattedPhone}
- Pack: ${school.scouting.packName} (${school.scouting.packNumber})

CAMPUS FACILITIES:
${school.campus.facilities.map(facility => `- ${facility}`).join('\n')}

NEARBY MEDICAL FACILITIES:
${context.nearbyFacilities.medical.map(facility => `- ${facility}`).join('\n')}

EMERGENCY CONTACTS:
${context.nearbyFacilities.emergency.map(contact => `- ${contact}`).join('\n')}

PARKING INFORMATION:
${context.transportation.parking.map(info => `- ${info}`).join('\n')}

ACCESSIBILITY:
${context.transportation.accessibility.map(info => `- ${info}`).join('\n')}
    `.trim();
  }

  /**
   * Get context for event creation
   */
  getEventCreationContext(): string {
    return `
When creating events for ${this.schoolInfo.scouting.packName}, use this institutional knowledge:

SCHOOL DETAILS:
- Full Name: ${this.schoolInfo.fullName}
- Address: ${this.schoolInfo.address.fullAddress}
- Phone: ${this.schoolInfo.contact.formattedPhone}
- Pack Number: ${this.schoolInfo.scouting.packNumber}

CAMPUS LOCATIONS:
${this.schoolInfo.campus.notableBuildings.map(building => `- ${building}`).join('\n')}

RECREATIONAL AREAS:
${this.schoolInfo.campus.recreationalAreas.map(area => `- ${area}`).join('\n')}

NEARBY MEDICAL FACILITIES:
${this.locationContext.nearbyFacilities.medical.map(facility => `- ${facility}`).join('\n')}

PARKING OPTIONS:
${this.locationContext.transportation.parking.map(option => `- ${option}`).join('\n')}

IMPORTANT NOTES:
- Always include the school's phone number (${this.schoolInfo.contact.formattedPhone}) for contact information
- Reference the full address (${this.schoolInfo.address.fullAddress}) for location details
- Consider accessibility needs when planning events
- Include emergency contact information (911) in all event communications
    `.trim();
  }
}

// Export singleton instance
export const institutionalKnowledgeService = new InstitutionalKnowledgeService();
export default institutionalKnowledgeService;
