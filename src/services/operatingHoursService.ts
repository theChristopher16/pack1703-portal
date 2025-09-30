import { OperatingHours, DayHours, SpecialHours } from '../types/firestore';

export interface OperatingStatus {
  isOpen: boolean;
  currentHours?: DayHours;
  nextOpenTime?: string;
  nextCloseTime?: string;
  statusText: string;
  specialHours?: SpecialHours;
}

class OperatingHoursService {
  /**
   * Get current operating status for a location
   */
  getCurrentStatus(operatingHours: OperatingHours): OperatingStatus {
    const now = new Date();
    const currentDay = this.getDayName(now.getDay());
    const currentTime = this.formatTime(now);
    
    // Check for special hours first
    const specialHours = this.getSpecialHoursForDate(operatingHours, now);
    if (specialHours) {
      if (specialHours.isClosed) {
        return {
          isOpen: false,
          statusText: `Closed for ${specialHours.name}`,
          specialHours
        };
      }
      
      if (specialHours.hours) {
        const isOpen = this.isTimeInRange(currentTime, specialHours.hours);
        return {
          isOpen,
          currentHours: specialHours.hours,
          statusText: isOpen 
            ? `Open (${specialHours.name})` 
            : `Closed (${specialHours.name})`,
          specialHours
        };
      }
    }
    
    // Check regular hours
    const dayHours = operatingHours[currentDay as keyof OperatingHours] as DayHours;
    if (!dayHours) {
      return {
        isOpen: false,
        statusText: 'Hours not available'
      };
    }
    
    if (dayHours.isClosed) {
      return {
        isOpen: false,
        statusText: 'Closed today'
      };
    }
    
    const isOpen = this.isTimeInRange(currentTime, dayHours);
    const nextOpenTime = this.getNextOpenTime(operatingHours, now);
    const nextCloseTime = this.getNextCloseTime(operatingHours, now);
    
    return {
      isOpen,
      currentHours: dayHours,
      nextOpenTime,
      nextCloseTime,
      statusText: isOpen ? 'Open now' : 'Closed'
    };
  }
  
  /**
   * Get operating hours for a specific day
   */
  getDayHours(operatingHours: OperatingHours, dayName: string): DayHours | null {
    return operatingHours[dayName as keyof OperatingHours] as DayHours || null;
  }
  
  /**
   * Get all operating hours formatted for display
   */
  getFormattedHours(operatingHours: OperatingHours): Array<{day: string, hours: string}> {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    return days.map((day, index) => {
      const dayHours = operatingHours[day as keyof OperatingHours] as DayHours;
      let hours = 'Closed';
      
      if (dayHours && !dayHours.isClosed) {
        hours = `${this.formatTimeForDisplay(dayHours.open)} - ${this.formatTimeForDisplay(dayHours.close)}`;
      } else if (dayHours && dayHours.isClosed) {
        hours = 'Closed';
      }
      
      return {
        day: dayNames[index],
        hours
      };
    });
  }
  
  /**
   * Check if a time is within operating hours
   */
  private isTimeInRange(currentTime: string, dayHours: DayHours): boolean {
    if (dayHours.isClosed) return false;
    
    const current = this.timeToMinutes(currentTime);
    const open = this.timeToMinutes(dayHours.open);
    const close = this.timeToMinutes(dayHours.close);
    
    // Handle overnight hours (e.g., 22:00 - 06:00)
    if (close < open) {
      return current >= open || current <= close;
    }
    
    return current >= open && current <= close;
  }
  
  /**
   * Get next opening time
   */
  private getNextOpenTime(operatingHours: OperatingHours, fromDate: Date): string | undefined {
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(fromDate);
      checkDate.setDate(fromDate.getDate() + i);
      
      const dayName = this.getDayName(checkDate.getDay());
      const dayHours = operatingHours[dayName as keyof OperatingHours] as DayHours;
      
      if (dayHours && !dayHours.isClosed) {
        if (i === 0) {
          // Same day - check if it opens later today
          const currentTime = this.formatTime(fromDate);
          if (this.timeToMinutes(currentTime) < this.timeToMinutes(dayHours.open)) {
            return dayHours.open;
          }
        } else {
          // Future day
          return dayHours.open;
        }
      }
    }
    
    return undefined;
  }
  
  /**
   * Get next closing time
   */
  private getNextCloseTime(operatingHours: OperatingHours, fromDate: Date): string | undefined {
    const currentDay = this.getDayName(fromDate.getDay());
    const dayHours = operatingHours[currentDay as keyof OperatingHours] as DayHours;
    
    if (dayHours && !dayHours.isClosed) {
      const currentTime = this.formatTime(fromDate);
      if (this.timeToMinutes(currentTime) < this.timeToMinutes(dayHours.close)) {
        return dayHours.close;
      }
    }
    
    // Find next day with hours
    for (let i = 1; i < 7; i++) {
      const checkDate = new Date(fromDate);
      checkDate.setDate(fromDate.getDate() + i);
      
      const dayName = this.getDayName(checkDate.getDay());
      const dayHours = operatingHours[dayName as keyof OperatingHours] as DayHours;
      
      if (dayHours && !dayHours.isClosed) {
        return dayHours.close;
      }
    }
    
    return undefined;
  }
  
  /**
   * Get special hours for a specific date
   */
  private getSpecialHoursForDate(operatingHours: OperatingHours, date: Date): SpecialHours | undefined {
    if (!operatingHours.specialHours) return undefined;
    
    const dateString = date.toISOString().split('T')[0];
    return operatingHours.specialHours.find(special => special.date === dateString);
  }
  
  /**
   * Convert day number to day name
   */
  private getDayName(dayNumber: number): string {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[dayNumber];
  }
  
  /**
   * Format time for comparison (HH:MM)
   */
  private formatTime(date: Date): string {
    return date.toTimeString().slice(0, 5);
  }
  
  /**
   * Format time for display (12-hour format)
   */
  private formatTimeForDisplay(time: string): string {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }
  
  /**
   * Convert time string to minutes for comparison
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
  
  /**
   * Get status color class for UI
   */
  getStatusColorClass(status: OperatingStatus): string {
    if (status.isOpen) return 'text-green-600';
    if (status.specialHours) return 'text-orange-600';
    return 'text-red-600';
  }
  
  /**
   * Get status icon for UI
   */
  getStatusIcon(status: OperatingStatus): string {
    if (status.isOpen) return '🟢';
    if (status.specialHours) return '🟡';
    return '🔴';
  }
}

export const operatingHoursService = new OperatingHoursService();
export default operatingHoursService;
