//
//  CalendarView.swift
//  Copse
//
//  Calendar view matching web app functionality
//

import SwiftUI
import FirebaseFirestore
import EventKit

struct CalendarView: View {
    @StateObject private var firebaseService = FirebaseService.shared
    @State private var events: [Event] = []
    @State private var filteredEvents: [Event] = []
    @State private var isLoading = true
    @State private var selectedDate = Date()
    @State private var currentMonth = Date()
    @State private var selectedEvent: Event?
    @State private var showEventDetail = false
    @State private var showFilters = false
    @State private var selectedCategories: Set<String> = []
    @State private var viewMode: CalendarViewMode = .month
    
    var body: some View {
        ZStack {
            // Gradient background
            LinearGradient(
                gradient: Gradient(colors: [
                    Color(red: 0.95, green: 0.98, blue: 0.95),
                    Color(red: 0.94, green: 0.97, blue: 0.96),
                    Color(red: 0.94, green: 0.98, blue: 0.99)
                ]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()
            
            VStack(spacing: 0) {
                // Header
                VStack(spacing: 16) {
                    HStack {
                        Text("Calendar")
                            .font(.system(size: 32, weight: .bold))
                            .foregroundColor(.primary)
                        
                        Spacer()
                        
                        // View mode selector
                        Picker("View", selection: $viewMode) {
                            Text("Month").tag(CalendarViewMode.month)
                            Text("Week").tag(CalendarViewMode.week)
                            Text("List").tag(CalendarViewMode.list)
                        }
                        .pickerStyle(.segmented)
                        .frame(width: 180)
                        
                        // Filter button
                        Button(action: {
                            showFilters.toggle()
                        }) {
                            Image(systemName: showFilters ? "line.3.horizontal.decrease.circle.fill" : "line.3.horizontal.decrease.circle")
                                .font(.system(size: 24))
                                .foregroundColor(.primary)
                        }
                    }
                    .padding(.horizontal)
                    .padding(.top, 8)
                    
                    // Filters (when shown)
                    if showFilters {
                        FilterBar(
                            selectedCategories: $selectedCategories,
                            onFiltersChanged: {
                                filterEvents()
                            }
                        )
                        .padding(.horizontal)
                        .transition(.move(edge: .top).combined(with: .opacity))
                    }
                }
                .padding(.bottom, 12)
                .background(
                    ZStack {
                        Color.white.opacity(0.1)
                        Rectangle()
                            .fill(.ultraThinMaterial)
                    }
                    .ignoresSafeArea(edges: .top)
                )
                
                // Calendar Content
                if isLoading {
                    VStack(spacing: 20) {
                        ProgressView()
                            .scaleEffect(1.2)
                        Text("Loading events...")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    switch viewMode {
                    case .month:
                        MonthCalendarView(
                            events: filteredEvents,
                            selectedDate: $selectedDate,
                            currentMonth: $currentMonth,
                            onDateSelected: { date in
                                selectedDate = date
                                showEventsForDate(date)
                            },
                            onEventTapped: { event in
                                selectedEvent = event
                                showEventDetail = true
                            }
                        )
                    case .week:
                        WeekCalendarView(
                            events: filteredEvents,
                            selectedDate: $selectedDate,
                            onDateSelected: { date in
                                selectedDate = date
                            },
                            onEventTapped: { event in
                                selectedEvent = event
                                showEventDetail = true
                            }
                        )
                    case .list:
                        EventListView(
                            events: filteredEvents,
                            onEventTapped: { event in
                                selectedEvent = event
                                showEventDetail = true
                            }
                        )
                    }
                }
            }
        }
        .navigationBarHidden(true)
        .onAppear {
            loadEvents()
        }
        .sheet(isPresented: $showEventDetail) {
            if let event = selectedEvent {
                EventDetailView(event: event)
            }
        }
    }
    
    private func loadEvents() {
        Task {
            do {
                var allEvents: [Event] = []
                
                // 1. Load events from ALL organizations user is a member of
                // This matches the web app's crossOrgSyncService.getAggregatedCalendarEvents()
                let orgEvents = try await firebaseService.fetchAllOrganizationEvents()
                allEvents.append(contentsOf: orgEvents)
                
                // 2. Load home events (meal plans, family events)
                let homeEvents = try await firebaseService.fetchHomeEvents()
                allEvents.append(contentsOf: homeEvents)
                
                // 3. Load personal calendar events from device (EventKit)
                let personalEvents = await loadPersonalCalendarEvents()
                allEvents.append(contentsOf: personalEvents)
                
                await MainActor.run {
                    events = allEvents.sorted { $0.date < $1.date }
                    filterEvents()
                    isLoading = false
                }
            } catch {
                print("Error loading events: \(error)")
                await MainActor.run {
                    isLoading = false
                }
            }
        }
    }
    
    private func loadPersonalCalendarEvents() async -> [Event] {
        let eventStore = EKEventStore()
        
        // Request calendar access (iOS 17+ uses requestFullAccessToEvents)
        let granted: Bool
        if #available(iOS 17.0, *) {
            do {
                granted = try await eventStore.requestFullAccessToEvents()
            } catch {
                print("Calendar access error: \(error)")
                return []
            }
        } else {
            // For iOS 16 and earlier, use continuation to convert callback to async
            granted = await withCheckedContinuation { continuation in
                eventStore.requestAccess(to: .event) { granted, error in
                    if let error = error {
                        print("Calendar access error: \(error)")
                    }
                    continuation.resume(returning: granted)
                }
            }
        }
        guard granted else {
            print("Calendar access denied")
            return []
        }
        
        // Get events for current month ± 1 month
        let calendar = Calendar.current
        let startDate = calendar.date(byAdding: .month, value: -1, to: currentMonth) ?? currentMonth
        let endDate = calendar.date(byAdding: .month, value: 2, to: currentMonth) ?? currentMonth
        
        let predicate = eventStore.predicateForEvents(withStart: startDate, end: endDate, calendars: nil)
        let ekEvents = eventStore.events(matching: predicate)
        
        return ekEvents.map { ekEvent in
            Event(
                id: ekEvent.eventIdentifier,
                title: ekEvent.title,
                description: ekEvent.notes ?? "",
                date: ekEvent.startDate,
                location: ekEvent.location ?? "",
                locationDetails: nil,
                packingList: nil,
                rsvpRequired: false,
                rsvpDeadline: nil,
                createdBy: "Personal Calendar",
                createdAt: ekEvent.creationDate ?? Date(),
                updatedAt: ekEvent.lastModifiedDate ?? Date()
            )
        }
    }
    
    private func filterEvents() {
        let filtered = events
        
        if !selectedCategories.isEmpty {
            // Filter by categories if we add category field to Event model
            // For now, just use all events
        }
        
        filteredEvents = filtered
    }
    
    private func showEventsForDate(_ date: Date) {
        // Show events for selected date
        let dayEvents = filteredEvents.filter { event in
            Calendar.current.isDate(event.date, inSameDayAs: date)
        }
        
        if let firstEvent = dayEvents.first {
            selectedEvent = firstEvent
            showEventDetail = true
        }
    }
}

enum CalendarViewMode {
    case month
    case week
    case list
}

// Filter Bar Component
struct FilterBar: View {
    @Binding var selectedCategories: Set<String>
    let onFiltersChanged: () -> Void
    
    let categories = ["Pack", "Den", "Camping", "Service", "Meeting"]
    
    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                ForEach(categories, id: \.self) { category in
                    FilterChip(
                        title: category,
                        isSelected: selectedCategories.contains(category)
                    ) {
                        if selectedCategories.contains(category) {
                            selectedCategories.remove(category)
                        } else {
                            selectedCategories.insert(category)
                        }
                        onFiltersChanged()
                    }
                }
            }
            .padding(.vertical, 8)
        }
    }
}

struct FilterChip: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 14, weight: isSelected ? .semibold : .regular))
                .foregroundColor(isSelected ? .white : .primary)
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(
                    Group {
                        if isSelected {
                            Capsule()
                                .fill(
                                    LinearGradient(
                                        gradient: Gradient(colors: [
                                            Color.green.opacity(0.8),
                                            Color.teal.opacity(0.8)
                                        ]),
                                        startPoint: .leading,
                                        endPoint: .trailing
                                    )
                                )
                        } else {
                            Capsule()
                                .fill(.ultraThinMaterial)
                                .overlay(
                                    Capsule()
                                        .stroke(Color.primary.opacity(0.1), lineWidth: 1)
                                )
                        }
                    }
                )
        }
    }
}

// Month Calendar View
struct MonthCalendarView: View {
    let events: [Event]
    @Binding var selectedDate: Date
    @Binding var currentMonth: Date
    let onDateSelected: (Date) -> Void
    let onEventTapped: (Event) -> Void
    
    private let calendar = Calendar.current
    private let dateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMMM yyyy"
        return formatter
    }()
    
    var body: some View {
        VStack(spacing: 0) {
            // Month header with navigation
            HStack {
                Button(action: {
                    withAnimation {
                        currentMonth = calendar.date(byAdding: .month, value: -1, to: currentMonth) ?? currentMonth
                    }
                }) {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundColor(.primary)
                }
                
                Spacer()
                
                Text(dateFormatter.string(from: currentMonth))
                    .font(.system(size: 20, weight: .semibold))
                    .foregroundColor(.primary)
                
                Spacer()
                
                Button(action: {
                    withAnimation {
                        currentMonth = calendar.date(byAdding: .month, value: 1, to: currentMonth) ?? currentMonth
                    }
                }) {
                    Image(systemName: "chevron.right")
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundColor(.primary)
                }
            }
            .padding(.horizontal)
            .padding(.vertical, 12)
            
            // Weekday headers
            HStack(spacing: 0) {
                ForEach(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], id: \.self) { day in
                    Text(day)
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(.secondary)
                        .frame(maxWidth: .infinity)
                }
            }
            .padding(.horizontal)
            .padding(.bottom, 8)
            
            // Calendar grid
            ScrollView {
                LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 0), count: 7), spacing: 0) {
                    ForEach(daysInMonth, id: \.self) { date in
                        if let date = date {
                            CalendarDayCell(
                                date: date,
                                isSelected: calendar.isDate(date, inSameDayAs: selectedDate),
                                isCurrentMonth: calendar.isDate(date, equalTo: currentMonth, toGranularity: .month),
                                events: eventsForDate(date),
                                onTap: {
                                    selectedDate = date
                                    onDateSelected(date)
                                },
                                onEventTap: onEventTapped
                            )
                        } else {
                            Color.clear
                                .frame(height: 60)
                        }
                    }
                }
                .padding(.horizontal, 8)
            }
        }
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(.ultraThinMaterial)
                .padding(.horizontal)
        )
        .padding(.horizontal)
    }
    
    private var daysInMonth: [Date?] {
        guard let monthInterval = calendar.dateInterval(of: .month, for: currentMonth) else {
            return []
        }
        
        let firstDay = monthInterval.start
        let firstWeekday = calendar.component(.weekday, from: firstDay) - 1 // 0 = Sunday
        
        var days: [Date?] = Array(repeating: nil, count: firstWeekday)
        
        var currentDate = firstDay
        while calendar.isDate(currentDate, equalTo: currentMonth, toGranularity: .month) {
            days.append(currentDate)
            currentDate = calendar.date(byAdding: .day, value: 1, to: currentDate) ?? currentDate
        }
        
        // Fill remaining days to complete grid
        let remaining = 42 - days.count // 6 weeks * 7 days
        days.append(contentsOf: Array(repeating: nil, count: remaining))
        
        return days
    }
    
    private func eventsForDate(_ date: Date) -> [Event] {
        events.filter { event in
            calendar.isDate(event.date, inSameDayAs: date)
        }
    }
}

struct CalendarDayCell: View {
    let date: Date
    let isSelected: Bool
    let isCurrentMonth: Bool
    let events: [Event]
    let onTap: () -> Void
    let onEventTap: (Event) -> Void
    
    private let dayFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "d"
        return formatter
    }()
    
    var body: some View {
        Button(action: onTap) {
            VStack(spacing: 4) {
                Text(dayFormatter.string(from: date))
                    .font(.system(size: 14, weight: isSelected ? .bold : .regular))
                    .foregroundColor(
                        isSelected ? .white :
                        isCurrentMonth ? .primary : .secondary.opacity(0.5)
                    )
                    .frame(maxWidth: .infinity)
                
                // Event indicators
                if !events.isEmpty {
                    HStack(spacing: 2) {
                        ForEach(events.prefix(3)) { event in
                            Circle()
                                .fill(
                                    LinearGradient(
                                        gradient: Gradient(colors: [
                                            Color.green.opacity(0.8),
                                            Color.teal.opacity(0.8)
                                        ]),
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    )
                                )
                                .frame(width: 4, height: 4)
                        }
                        
                        if events.count > 3 {
                            Text("+\(events.count - 3)")
                                .font(.system(size: 8))
                                .foregroundColor(.secondary)
                        }
                    }
                }
            }
            .frame(height: 60)
            .frame(maxWidth: .infinity)
            .background(
                Group {
                    if isSelected {
                        RoundedRectangle(cornerRadius: 8)
                            .fill(
                                LinearGradient(
                                    gradient: Gradient(colors: [
                                        Color.green.opacity(0.8),
                                        Color.teal.opacity(0.8)
                                    ]),
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                            .shadow(color: Color.green.opacity(0.3), radius: 4, x: 0, y: 2)
                    } else if Calendar.current.isDateInToday(date) {
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(Color.green.opacity(0.5), lineWidth: 2)
                    }
                }
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// Week Calendar View
struct WeekCalendarView: View {
    let events: [Event]
    @Binding var selectedDate: Date
    let onDateSelected: (Date) -> Void
    let onEventTapped: (Event) -> Void
    
    private let calendar = Calendar.current
    
    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                // Week header
                HStack {
                    ForEach(daysInWeek, id: \.self) { date in
                        WeekDayHeader(
                            date: date,
                            isSelected: calendar.isDate(date, inSameDayAs: selectedDate),
                            eventCount: eventsForDate(date).count,
                            onTap: {
                                selectedDate = date
                                onDateSelected(date)
                            }
                        )
                    }
                }
                .padding(.horizontal)
                
                // Events for selected day
                VStack(alignment: .leading, spacing: 12) {
                    Text("Events for \(selectedDate.formatted(date: .abbreviated, time: .omitted))")
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundColor(.primary)
                        .padding(.horizontal)
                    
                    ForEach(eventsForDate(selectedDate)) { event in
                        EventCard(event: event) {
                            onEventTapped(event)
                        }
                    }
                }
            }
            .padding(.vertical)
        }
    }
    
    private var daysInWeek: [Date] {
        guard let weekInterval = calendar.dateInterval(of: .weekOfYear, for: selectedDate) else {
            return []
        }
        
        var days: [Date] = []
        var currentDate = weekInterval.start
        
        for _ in 0..<7 {
            days.append(currentDate)
            currentDate = calendar.date(byAdding: .day, value: 1, to: currentDate) ?? currentDate
        }
        
        return days
    }
    
    private func eventsForDate(_ date: Date) -> [Event] {
        events.filter { event in
            calendar.isDate(event.date, inSameDayAs: date)
        }
    }
}

struct WeekDayHeader: View {
    let date: Date
    let isSelected: Bool
    let eventCount: Int
    let onTap: () -> Void
    
    private let dayFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEE"
        return formatter
    }()
    
    private let dayNumberFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "d"
        return formatter
    }()
    
    var body: some View {
        Button(action: onTap) {
            VStack(spacing: 6) {
                Text(dayFormatter.string(from: date))
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(isSelected ? .white : .secondary)
                
                Text(dayNumberFormatter.string(from: date))
                    .font(.system(size: 20, weight: isSelected ? .bold : .semibold))
                    .foregroundColor(isSelected ? .white : .primary)
                
                if eventCount > 0 {
                    Circle()
                        .fill(isSelected ? Color.white : Color.green)
                        .frame(width: 6, height: 6)
                } else {
                    Circle()
                        .fill(Color.clear)
                        .frame(width: 6, height: 6)
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(
                        isSelected ?
                        LinearGradient(
                            gradient: Gradient(colors: [
                                Color.green.opacity(0.8),
                                Color.teal.opacity(0.8)
                            ]),
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ) :
                        LinearGradient(
                            gradient: Gradient(colors: [
                                Color.clear,
                                Color.clear
                            ]),
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// Event List View
struct EventListView: View {
    let events: [Event]
    let onEventTapped: (Event) -> Void
    
    private let calendar = Calendar.current
    
    var body: some View {
        ScrollView {
            LazyVStack(spacing: 16) {
                ForEach(groupedEvents.keys.sorted(), id: \.self) { date in
                    VStack(alignment: .leading, spacing: 12) {
                        Text(date.formatted(date: .complete, time: .omitted))
                            .font(.system(size: 18, weight: .bold))
                            .foregroundColor(.primary)
                            .padding(.horizontal)
                        
                        ForEach(groupedEvents[date] ?? []) { event in
                            EventCard(event: event) {
                                onEventTapped(event)
                            }
                        }
                    }
                }
            }
            .padding(.vertical)
        }
    }
    
    private var groupedEvents: [Date: [Event]] {
        Dictionary(grouping: events.sorted { $0.date < $1.date }) { event in
            calendar.startOfDay(for: event.date)
        }
    }
}

// Event Card Component
struct EventCard: View {
    let event: Event
    let onTap: () -> Void
    @State private var isPressed = false
    
    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 16) {
                // Time indicator
                VStack(spacing: 4) {
                    Text(event.date.formatted(date: .omitted, time: .shortened))
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(.primary)
                    
                    if event.rsvpRequired {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 12))
                            .foregroundColor(.green)
                    }
                }
                .frame(width: 60)
                
                // Event details
                VStack(alignment: .leading, spacing: 8) {
                    Text(event.title)
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundColor(.primary)
                        .lineLimit(2)
                    
                    if !event.description.isEmpty {
                        Text(event.description)
                            .font(.system(size: 14))
                            .foregroundColor(.secondary)
                            .lineLimit(2)
                    }
                    
                    HStack(spacing: 12) {
                        if let location = event.locationDetails?.address ?? (event.location.isEmpty ? nil : event.location) {
                            Label(location, systemImage: "mappin.circle.fill")
                                .font(.system(size: 12))
                                .foregroundColor(.secondary)
                        }
                    }
                }
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.secondary)
            }
            .padding(16)
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(.ultraThinMaterial)
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(
                                LinearGradient(
                                    gradient: Gradient(colors: [
                                        Color.white.opacity(0.6),
                                        Color.white.opacity(0.2)
                                    ]),
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                ),
                                lineWidth: 1
                            )
                    )
            )
            .shadow(color: Color.black.opacity(0.1), radius: 8, x: 0, y: 4)
            .scaleEffect(isPressed ? 0.98 : 1.0)
            .animation(.spring(response: 0.3, dampingFraction: 0.6), value: isPressed)
        }
        .buttonStyle(PlainButtonStyle())
        .padding(.horizontal)
        .simultaneousGesture(
            DragGesture(minimumDistance: 0)
                .onChanged { _ in isPressed = true }
                .onEnded { _ in isPressed = false }
        )
    }
}

// Event Detail View
struct EventDetailView: View {
    let event: Event
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    // Header
                    VStack(alignment: .leading, spacing: 12) {
                        Text(event.title)
                            .font(.system(size: 28, weight: .bold))
                            .foregroundColor(.primary)
                        
                        HStack(spacing: 16) {
                            Label(event.formattedDate, systemImage: "calendar")
                            if let location = event.locationDetails?.address ?? (event.location.isEmpty ? nil : event.location) {
                                Label(location, systemImage: "mappin.circle.fill")
                            }
                        }
                        .font(.system(size: 15))
                        .foregroundColor(.secondary)
                    }
                    .padding()
                    .background(
                        RoundedRectangle(cornerRadius: 16)
                            .fill(.ultraThinMaterial)
                    )
                    .padding()
                    
                    // Description
                    if !event.description.isEmpty {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Description")
                                .font(.system(size: 18, weight: .semibold))
                                .foregroundColor(.primary)
                            
                            Text(event.description)
                                .font(.system(size: 15))
                                .foregroundColor(.secondary)
                        }
                        .padding()
                        .background(
                            RoundedRectangle(cornerRadius: 16)
                                .fill(.ultraThinMaterial)
                        )
                        .padding(.horizontal)
                    }
                    
                    // Packing List
                    if let packingList = event.packingList, !packingList.isEmpty {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Packing List")
                                .font(.system(size: 18, weight: .semibold))
                                .foregroundColor(.primary)
                            
                            ForEach(packingList, id: \.self) { item in
                                HStack(spacing: 12) {
                                    Image(systemName: "checkmark.circle")
                                        .foregroundColor(.green)
                                    Text(item)
                                        .font(.system(size: 15))
                                        .foregroundColor(.secondary)
                                }
                            }
                        }
                        .padding()
                        .background(
                            RoundedRectangle(cornerRadius: 16)
                                .fill(.ultraThinMaterial)
                        )
                        .padding(.horizontal)
                    }
                    
                    // RSVP Section
                    if event.rsvpRequired {
                        VStack(spacing: 16) {
                            Button(action: {
                                // TODO: Implement RSVP
                            }) {
                                HStack {
                                    Image(systemName: "checkmark.circle.fill")
                                    Text("RSVP to Event")
                                }
                                .font(.system(size: 17, weight: .semibold))
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(
                                    Capsule()
                                        .fill(
                                            LinearGradient(
                                                gradient: Gradient(colors: [
                                                    Color.green.opacity(0.8),
                                                    Color.teal.opacity(0.8)
                                                ]),
                                                startPoint: .leading,
                                                endPoint: .trailing
                                            )
                                        )
                                )
                            }
                            .padding(.horizontal)
                        }
                    }
                }
                .padding(.vertical)
            }
            .background(
                LinearGradient(
                    gradient: Gradient(colors: [
                        Color(red: 0.95, green: 0.98, blue: 0.95),
                        Color(red: 0.94, green: 0.97, blue: 0.96)
                    ]),
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()
            )
            .navigationTitle("Event Details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

#Preview {
    CalendarView()
}

