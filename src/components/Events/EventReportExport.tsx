import React, { useState } from 'react';
import { Download, FileText, Users, Calendar, MapPin, AlertCircle, CheckCircle } from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';

interface RSVPData {
  id: string;
  eventId: string;
  userId: string;
  userEmail: string;
  familyName: string;
  email: string;
  phone?: string;
  attendees: Array<{
    name: string;
    age: number;
    den?: string;
    isAdult: boolean;
    daysAttending?: string[]; // Array of date strings (YYYY-MM-DD) for multi-day events
  }>;
  dietaryRestrictions?: string;
  specialNeeds?: string;
  notes?: string;
  // Payment-related fields
  paymentRequired?: boolean;
  paymentAmount?: number;
  paymentCurrency?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  paymentNotes?: string;
  paidAt?: string;
  submittedAt: string;
  createdAt: string;
}

interface EventData {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  location: string;
  description: string;
  category: string;
  capacity?: number;
  currentRSVPs: number;
}

interface EventReportExportProps {
  event: EventData;
  rsvps: RSVPData[];
  onClose: () => void;
}

const EventReportExport: React.FC<EventReportExportProps> = ({ event, rsvps, onClose }) => {
  const { state } = useAdmin();
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');

  // Check if user has permission to export (den leaders and up)
  const canExport = state.currentUser?.role && ['moderator', 'content-admin', 'super-admin'].includes(state.currentUser.role);

  if (!canExport) {
    return null;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const generateCSV = () => {
    // Check if this is a multi-day event
    const isMultiDay = rsvps.some(rsvp => 
      rsvp.attendees.some(attendee => 
        attendee.daysAttending && attendee.daysAttending.length > 0
      )
    );
    
    // Get all event days
    const allDays = new Set<string>();
    if (isMultiDay) {
      rsvps.forEach(rsvp => {
        rsvp.attendees.forEach(attendee => {
          (attendee.daysAttending || []).forEach(day => allDays.add(day));
        });
      });
    }
    const eventDays = Array.from(allDays).sort();
    
    // Build headers with per-day columns
    const baseHeaders = [
      'Family Name',
      'Email',
      'Phone',
      'Attendee Name',
      'Age',
      'Den',
      'Is Adult'
    ];
    
    const dayHeaders = eventDays.map(day => {
      const dayDate = new Date(day + 'T12:00:00');
      return dayDate.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    });
    
    const endHeaders = [
      'Payment Status',
      'Payment Amount',
      'Payment Method',
      'Dietary Restrictions',
      'Special Needs',
      'Notes',
      'RSVP Submitted'
    ];
    
    const csvHeaders = isMultiDay 
      ? [...baseHeaders, ...dayHeaders, ...endHeaders]
      : [...baseHeaders, 'Attending', ...endHeaders];
    
    // Build rows with one row per attendee
    const csvRows: string[][] = [];
    rsvps.forEach(rsvp => {
      rsvp.attendees.forEach((attendee, index) => {
        const daysAttending = attendee.daysAttending || [];
        const dayColumns = eventDays.map(day => daysAttending.includes(day) ? 'Yes' : 'No');
        
        const row = [
          rsvp.familyName,
          rsvp.email,
          rsvp.phone || '',
          attendee.name,
          attendee.age.toString(),
          attendee.den || 'N/A',
          attendee.isAdult ? 'Yes' : 'No',
          ...(isMultiDay ? dayColumns : ['Yes']),
          // Only include payment/notes on first attendee row
          index === 0 ? (rsvp.paymentStatus === 'completed' ? 'Paid' : 
                         rsvp.paymentStatus === 'pending' ? 'Payment Pending' : 
                         rsvp.paymentStatus === 'failed' ? 'Payment Failed' : 'N/A') : '',
          index === 0 ? (rsvp.paymentAmount ? `$${(rsvp.paymentAmount / 100).toFixed(2)}` : 'N/A') : '',
          index === 0 ? (rsvp.paymentMethod || 'N/A') : '',
          index === 0 ? (rsvp.dietaryRestrictions || '') : '',
          index === 0 ? (rsvp.specialNeeds || '') : '',
          index === 0 ? (rsvp.notes || '') : '',
          index === 0 ? new Date(rsvp.submittedAt).toLocaleDateString('en-US') : ''
        ];
        csvRows.push(row);
      });
    });

    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  };

  const generatePDF = () => {
    // Check if this is a multi-day event
    const isMultiDay = rsvps.some(rsvp => 
      rsvp.attendees.some(attendee => 
        attendee.daysAttending && attendee.daysAttending.length > 0
      )
    );
    
    // Get all event days and calculate per-day counts
    const allDays = new Set<string>();
    const dayAttendance: { [date: string]: number } = {};
    
    if (isMultiDay) {
      rsvps.forEach(rsvp => {
        rsvp.attendees.forEach(attendee => {
          (attendee.daysAttending || []).forEach(day => {
            allDays.add(day);
            dayAttendance[day] = (dayAttendance[day] || 0) + 1;
          });
        });
      });
    }
    const eventDays = Array.from(allDays).sort();
    
    // Create a simple HTML-based PDF content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Event Report - ${event.title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .event-info { background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
          .summary { background: #e8f4fd; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
          .daily-attendance { background: #f0f9ff; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
          .day-count { display: inline-block; background: white; padding: 8px 12px; margin: 5px; border-radius: 6px; border: 1px solid #93c5fd; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
          th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; }
          .needs-section { margin-top: 20px; }
          .needs-item { background: #fff3cd; padding: 10px; margin: 5px 0; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Event Report</h1>
          <h2>${event.title}</h2>
        </div>
        
        <div class="event-info">
          <h3>Event Details</h3>
          <p><strong>Date:</strong> ${formatDate(event.startDate)}</p>
          <p><strong>Location:</strong> ${event.location}</p>
          <p><strong>Category:</strong> ${event.category}</p>
          <p><strong>Capacity:</strong> ${event.capacity || 'Unlimited'}</p>
        </div>
        
        <div class="summary">
          <h3>Participation Summary</h3>
          <p><strong>Total RSVPs:</strong> ${rsvps.length}</p>
          <p><strong>Total Attendees:</strong> ${rsvps.reduce((sum, rsvp) => sum + rsvp.attendees.length, 0)}</p>
          <p><strong>Adults:</strong> ${rsvps.reduce((sum, rsvp) => sum + rsvp.attendees.filter(a => a.isAdult).length, 0)}</p>
          <p><strong>Youth:</strong> ${rsvps.reduce((sum, rsvp) => sum + rsvp.attendees.filter(a => !a.isAdult).length, 0)}</p>
          <p><strong>Paid Families:</strong> ${rsvps.filter(rsvp => rsvp.paymentStatus === 'completed').length}</p>
          <p><strong>Payment Pending:</strong> ${rsvps.filter(rsvp => rsvp.paymentStatus === 'pending').length}</p>
          <p><strong>Total Revenue:</strong> $${(rsvps.filter(rsvp => rsvp.paymentStatus === 'completed').reduce((sum, rsvp) => sum + (rsvp.paymentAmount || 0), 0) / 100).toFixed(2)}</p>
        </div>
        
        ${isMultiDay ? `
        <div class="daily-attendance">
          <h3>Daily Attendance Breakdown</h3>
          ${eventDays.map(day => {
            const dayDate = new Date(day + 'T12:00:00');
            const dayLabel = dayDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            });
            return `<div class="day-count"><strong>${dayLabel}:</strong> ${dayAttendance[day]} attendees</div>`;
          }).join('')}
        </div>
        ` : ''}
        
        <h3>Participant Details</h3>
        <table>
          <thead>
            <tr>
              <th>Family</th>
              <th>Attendee</th>
              <th>Age</th>
              <th>Den</th>
              ${isMultiDay ? eventDays.map(day => {
                const dayDate = new Date(day + 'T12:00:00');
                const dayLabel = dayDate.toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'numeric', 
                  day: 'numeric' 
                });
                return `<th>${dayLabel}</th>`;
              }).join('') : '<th>Attending</th>'}
              <th>Payment</th>
              <th>Contact</th>
            </tr>
          </thead>
          <tbody>
            ${rsvps.flatMap(rsvp => 
              rsvp.attendees.map((attendee, index) => {
                const daysAttending = attendee.daysAttending || [];
                const dayColumns = isMultiDay 
                  ? eventDays.map(day => daysAttending.includes(day) ? '✓' : '—').join('</td><td>')
                  : '✓';
                
                return `
                  <tr>
                    <td>${index === 0 ? rsvp.familyName : ''}</td>
                    <td>${attendee.name}</td>
                    <td>${attendee.age}</td>
                    <td>${attendee.den || 'N/A'}</td>
                    <td>${dayColumns}</td>
                    <td>${index === 0 ? (rsvp.paymentStatus === 'completed' ? '✅ Paid' : 
                         rsvp.paymentStatus === 'pending' ? '⏳ Pending' : 
                         rsvp.paymentStatus === 'failed' ? '❌ Failed' : 'N/A') : ''}</td>
                    <td>${index === 0 ? (rsvp.email + (rsvp.phone ? `<br/>${rsvp.phone}` : '')) : ''}</td>
                  </tr>`;
              })
            ).join('')}
          </tbody>
        </table>
        
        <div class="needs-section">
          <h3>Special Needs & Notes</h3>
          ${rsvps.filter(rsvp => rsvp.dietaryRestrictions || rsvp.specialNeeds || rsvp.notes).map(rsvp => `
            <div class="needs-item">
              <strong>${rsvp.familyName}</strong><br/>
              ${rsvp.dietaryRestrictions ? `<strong>Dietary:</strong> ${rsvp.dietaryRestrictions}<br/>` : ''}
              ${rsvp.specialNeeds ? `<strong>Special Needs:</strong> ${rsvp.specialNeeds}<br/>` : ''}
              ${rsvp.notes ? `<strong>Notes:</strong> ${rsvp.notes}` : ''}
            </div>
          `).join('')}
        </div>
        
        <div style="margin-top: 30px; text-align: center; color: #666;">
          <p>Report generated on ${new Date().toLocaleDateString('en-US')}</p>
        </div>
      </body>
      </html>
    `;
    
    return htmlContent;
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      if (exportFormat === 'csv') {
        const csvContent = generateCSV();
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_participants.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // For PDF, we'll use the browser's print functionality
        const htmlContent = generatePDF();
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(htmlContent);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => {
            printWindow.print();
            printWindow.close();
          }, 250);
        }
      }
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const totalAttendees = rsvps.reduce((sum, rsvp) => sum + rsvp.attendees.length, 0);
  const adultsCount = rsvps.reduce((sum, rsvp) => sum + rsvp.attendees.filter(a => a.isAdult).length, 0);
  const youthCount = rsvps.reduce((sum, rsvp) => sum + rsvp.attendees.filter(a => !a.isAdult).length, 0);
  const needsCount = rsvps.filter(rsvp => rsvp.dietaryRestrictions || rsvp.specialNeeds || rsvp.notes).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <FileText className="h-6 w-6 text-gray-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">Export Event Report</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Event Info */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 mb-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{event.title}</h3>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-gray-600" />
                {formatDate(event.startDate)}
              </div>
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-gray-600" />
                {event.location}
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-200">
              <Users className="h-6 w-6 text-gray-600 mx-auto mb-1" />
              <div className="text-lg font-semibold text-gray-700">{rsvps.length}</div>
              <div className="text-xs text-gray-600">Families</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 text-center border border-slate-200">
              <Users className="h-6 w-6 text-slate-600 mx-auto mb-1" />
              <div className="text-lg font-semibold text-slate-700">{totalAttendees}</div>
              <div className="text-xs text-slate-600">Total People</div>
            </div>
            <div className="bg-zinc-50 rounded-lg p-3 text-center border border-zinc-200">
              <CheckCircle className="h-6 w-6 text-zinc-600 mx-auto mb-1" />
              <div className="text-lg font-semibold text-zinc-700">{adultsCount}</div>
              <div className="text-xs text-zinc-600">Adults</div>
            </div>
            <div className="bg-stone-50 rounded-lg p-3 text-center border border-stone-200">
              <AlertCircle className="h-6 w-6 text-stone-600 mx-auto mb-1" />
              <div className="text-lg font-semibold text-stone-700">{needsCount}</div>
              <div className="text-xs text-stone-600">Special Needs</div>
            </div>
          </div>

          {/* Export Options */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Export Format</h3>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="exportFormat"
                  value="csv"
                  checked={exportFormat === 'csv'}
                  onChange={(e) => setExportFormat(e.target.value as 'csv' | 'pdf')}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">CSV (Spreadsheet)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="exportFormat"
                  value="pdf"
                  checked={exportFormat === 'pdf'}
                  onChange={(e) => setExportFormat(e.target.value as 'csv' | 'pdf')}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">PDF (Printable Report)</span>
              </label>
            </div>
          </div>

          {/* Export Button */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isExporting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventReportExport;
