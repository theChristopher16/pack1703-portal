//
//  FirebaseService.swift
//  Copse
//
//  Firebase integration service for Pack 1703 Portal
//

import Foundation
import Combine
import UIKit
import FirebaseCore
import FirebaseAuth
import FirebaseFirestore
import GoogleSignIn

class FirebaseService: ObservableObject {
    static let shared = FirebaseService()
    
    @Published var currentUser: User?
    @Published var isAuthenticated = false
    
    private let auth = Auth.auth()
    private let db = Firestore.firestore()
    private let messagingService = MessagingService.shared
    
    private var authStateListener: AuthStateDidChangeListenerHandle?
    
    private init() {
        // Listen for auth state changes
        authStateListener = auth.addStateDidChangeListener { [weak self] _, user in
            Task { @MainActor in
                self?.currentUser = user
                self?.isAuthenticated = user != nil
                
                // Register FCM token when user logs in
                if user != nil {
                    await self?.messagingService.registerFCMToken()
                } else {
                    // Remove FCM token when user logs out
                    await self?.messagingService.unregisterFCMToken()
                }
            }
        }
    }
    
    deinit {
        if let listener = authStateListener {
            auth.removeStateDidChangeListener(listener)
        }
    }
    
    // MARK: - Authentication
    
    func signIn(email: String, password: String) async throws {
        try await auth.signIn(withEmail: email, password: password)
    }
    
    func signUp(email: String, password: String) async throws {
        try await auth.createUser(withEmail: email, password: password)
    }
    
    func signOut() throws {
        try auth.signOut()
    }
    
    func signInWithGoogle() async throws {
        print("🔵 FirebaseService: Starting Google Sign-In...")
        
        guard let clientID = FirebaseApp.app()?.options.clientID else {
            print("🔴 FirebaseService: No clientID found in Firebase config")
            throw AuthError.notImplemented
        }
        
        print("🔵 FirebaseService: ClientID found: \(clientID)")
        
        // Configure Google Sign-In
        let config = GIDConfiguration(clientID: clientID)
        GIDSignIn.sharedInstance.configuration = config
        
        // Get the presenting view controller
        guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let rootViewController = windowScene.windows.first?.rootViewController else {
            print("🔴 FirebaseService: Could not get root view controller")
            throw AuthError.notImplemented
        }
        
        print("🔵 FirebaseService: Got root view controller, starting sign-in...")
        
        // Start the sign-in flow
        let result = try await GIDSignIn.sharedInstance.signIn(withPresenting: rootViewController)
        
        print("🔵 FirebaseService: Google Sign-In completed, getting ID token...")
        
        guard let idToken = result.user.idToken?.tokenString else {
            print("🔴 FirebaseService: No ID token received from Google")
            throw AuthError.notImplemented
        }
        
        print("🔵 FirebaseService: Creating Firebase credential...")
        
        // Create Firebase credential
        let credential = GoogleAuthProvider.credential(withIDToken: idToken,
                                                       accessToken: result.user.accessToken.tokenString)
        
        print("🔵 FirebaseService: Signing in to Firebase...")
        
        // Sign in to Firebase
        try await auth.signIn(with: credential)
        
        print("🔵 FirebaseService: Successfully signed in to Firebase!")
    }
    
    func signInWithApple() async throws {
        // TODO: Implement Apple Sign-In
        throw AuthError.notImplemented
    }
    
    // MARK: - Firestore Operations
    
    // MARK: - Calendar Events
    
    /// Fetch events from all organizations the user is a member of
    /// This matches the web app's crossOrgSyncService.getAggregatedCalendarEvents()
    func fetchAllOrganizationEvents() async throws -> [Event] {
        guard let userId = currentUser?.uid else {
            throw AuthError.notAuthenticated
        }
        
        // Get user's organizations from crossOrganizationUsers
        let crossOrgQuery = db.collection("crossOrganizationUsers")
            .whereField("userId", isEqualTo: userId)
            .whereField("isActive", isEqualTo: true)
        
        let crossOrgSnapshot = try await crossOrgQuery.getDocuments()
        var allEvents: [Event] = []
        
        for doc in crossOrgSnapshot.documents {
            let orgData = doc.data()
            guard let orgId = orgData["organizationId"] as? String else { continue }
            
            // Fetch events for this organization
            let orgEvents = try await fetchEvents(organizationId: orgId)
            allEvents.append(contentsOf: orgEvents)
        }
        
        // Also fetch events user has RSVP'd to (fallback for events missing organizationId)
        let rsvpQuery = db.collection("rsvps")
            .whereField("userId", isEqualTo: userId)
        
        let rsvpSnapshot = try await rsvpQuery.getDocuments()
        
        for rsvpDoc in rsvpSnapshot.documents {
            let rsvpData = rsvpDoc.data()
            guard let eventId = rsvpData["eventId"] as? String else { continue }
            
            // Check if we already have this event
            if allEvents.contains(where: { $0.id == eventId }) {
                continue
            }
            
            // Fetch the event
            let eventDoc = try await db.collection("events").document(eventId).getDocument()
            if eventDoc.exists, let event = try? parseEvent(from: eventDoc) {
                allEvents.append(event)
            }
        }
        
        return allEvents
    }
    
    /// Fetch home events (meal plans, family events)
    func fetchHomeEvents() async throws -> [Event] {
        guard let userId = currentUser?.uid else {
            throw AuthError.notAuthenticated
        }
        
        var homeEvents: [Event] = []
        
        // Get current month range
        let calendar = Calendar.current
        let now = Date()
        let monthStart = calendar.date(from: calendar.dateComponents([.year, .month], from: now)) ?? now
        let monthEnd = calendar.date(byAdding: .month, value: 1, to: monthStart) ?? now
        
        // Load meal plans
        // Note: Firestore queries with date ranges need to be done carefully
        // For now, fetch all and filter in memory to avoid query complexity
        let mealPlansQuery = db.collection("mealPlans")
            .whereField("userId", isEqualTo: userId)
        
        let mealPlansSnapshot = try await mealPlansQuery.getDocuments()
        
        for doc in mealPlansSnapshot.documents {
            let data = doc.data()
            guard let dateTimestamp = data["date"] as? Timestamp else { continue }
            let date = dateTimestamp.dateValue()
            
            // Filter by date range in memory
            guard date >= monthStart && date <= monthEnd else { continue }
            
            let mealType = data["mealType"] as? String ?? "Meal"
            let recipeName = data["recipeName"] as? String ?? data["customMeal"] as? String ?? ""
            
            homeEvents.append(Event(
                id: doc.documentID,
                title: "\(mealType): \(recipeName)",
                description: data["notes"] as? String ?? "",
                date: date,
                location: "",
                locationDetails: nil,
                packingList: nil,
                rsvpRequired: false,
                rsvpDeadline: nil,
                createdBy: userId,
                createdAt: date,
                updatedAt: date
            ))
        }
        
        // Load family calendar events
        let familyEventsQuery = db.collection("familyEvents")
            .whereField("userId", isEqualTo: userId)
        
        let familyEventsSnapshot = try await familyEventsQuery.getDocuments()
        
        for doc in familyEventsSnapshot.documents {
            let data = doc.data()
            guard let startTimeTimestamp = data["startTime"] as? Timestamp else { continue }
            let startTime = startTimeTimestamp.dateValue()
            
            // Filter by date range in memory
            guard startTime >= monthStart && startTime <= monthEnd else { continue }
            
            homeEvents.append(Event(
                id: doc.documentID,
                title: data["title"] as? String ?? "Family Event",
                description: data["description"] as? String ?? "",
                date: startTime,
                location: data["location"] as? String ?? "",
                locationDetails: nil,
                packingList: nil,
                rsvpRequired: false,
                rsvpDeadline: nil,
                createdBy: userId,
                createdAt: startTime,
                updatedAt: startTime
            ))
        }
        
        return homeEvents
    }
    
    func fetchEvents(organizationId: String? = nil) async throws -> [Event] {
        var query: Query = db.collection("events")
        
        // Filter by organization if provided
        if let orgId = organizationId {
            query = query.whereField("organizationId", isEqualTo: orgId)
        }
        
        // Order by date
        query = query.order(by: "startDate", descending: false)
        
        let snapshot = try await query.getDocuments()
        
        return snapshot.documents.compactMap { doc in
            let data = doc.data()
            
            // Transform Firestore data to Event model
            // Handle both old 'date' field and new 'startDate' field
            let eventDate: Date
            if let timestamp = data["startDate"] as? Timestamp {
                eventDate = timestamp.dateValue()
            } else if let timestamp = data["date"] as? Timestamp {
                eventDate = timestamp.dateValue()
            } else if let dateString = data["date"] as? String {
                let formatter = ISO8601DateFormatter()
                eventDate = formatter.date(from: dateString) ?? Date()
            } else {
                return nil
            }
            
            // Handle location
            let location: String
            let locationDetails: Event.LocationDetails?
            
            if let locationDict = data["location"] as? [String: Any] {
                location = locationDict["name"] as? String ?? ""
                let address = locationDict["address"] as? String
                let lat = locationDict["latitude"] as? Double
                let lng = locationDict["longitude"] as? Double
                
                locationDetails = Event.LocationDetails(
                    address: address,
                    latitude: lat,
                    longitude: lng,
                    mapUrl: nil
                )
            } else {
                location = data["location"] as? String ?? ""
                locationDetails = nil
            }
            
            // Handle RSVP deadline
            let rsvpDeadline: Date?
            if let deadlineTimestamp = data["rsvpDeadline"] as? Timestamp {
                rsvpDeadline = deadlineTimestamp.dateValue()
            } else {
                rsvpDeadline = nil
            }
            
            return Event(
                id: doc.documentID,
                title: data["title"] as? String ?? "Untitled Event",
                description: data["description"] as? String ?? "",
                date: eventDate,
                location: location,
                locationDetails: locationDetails,
                packingList: data["packingList"] as? [String],
                rsvpRequired: data["requiresRSVP"] as? Bool ?? false,
                rsvpDeadline: rsvpDeadline,
                createdBy: data["createdBy"] as? String ?? "",
                createdAt: (data["createdAt"] as? Timestamp)?.dateValue() ?? Date(),
                updatedAt: (data["updatedAt"] as? Timestamp)?.dateValue() ?? Date()
            )
        }
    }
    
    /// Helper to parse Event from Firestore document
    private func parseEvent(from doc: DocumentSnapshot) throws -> Event? {
        let data = doc.data() ?? [:]
        
        // Handle date
        let eventDate: Date
        if let timestamp = data["startDate"] as? Timestamp {
            eventDate = timestamp.dateValue()
        } else if let timestamp = data["date"] as? Timestamp {
            eventDate = timestamp.dateValue()
        } else {
            return nil
        }
        
        // Handle location
        let location: String
        let locationDetails: Event.LocationDetails?
        
        if let locationDict = data["location"] as? [String: Any] {
            location = locationDict["name"] as? String ?? ""
            let address = locationDict["address"] as? String
            let lat = locationDict["latitude"] as? Double
            let lng = locationDict["longitude"] as? Double
            
            locationDetails = Event.LocationDetails(
                address: address,
                latitude: lat,
                longitude: lng,
                mapUrl: nil
            )
        } else {
            location = data["location"] as? String ?? ""
            locationDetails = nil
        }
        
        // Handle RSVP deadline
        let rsvpDeadline: Date?
        if let deadlineTimestamp = data["rsvpDeadline"] as? Timestamp {
            rsvpDeadline = deadlineTimestamp.dateValue()
        } else {
            rsvpDeadline = nil
        }
        
        return Event(
            id: doc.documentID,
            title: data["title"] as? String ?? "Untitled Event",
            description: data["description"] as? String ?? "",
            date: eventDate,
            location: location,
            locationDetails: locationDetails,
            packingList: data["packingList"] as? [String],
            rsvpRequired: data["requiresRSVP"] as? Bool ?? false,
            rsvpDeadline: rsvpDeadline,
            createdBy: data["createdBy"] as? String ?? "",
            createdAt: (data["createdAt"] as? Timestamp)?.dateValue() ?? Date(),
            updatedAt: (data["updatedAt"] as? Timestamp)?.dateValue() ?? Date()
        )
    }
    
    func fetchUserProfile(userId: String) async throws -> UserProfile? {
        let doc = try await db.collection("users").document(userId).getDocument()
        return try? doc.data(as: UserProfile.self)
    }
    
    // MARK: - Chat Operations
    
    func fetchMessages(channelId: String, limit: Int = 50) async throws -> [Message] {
        let snapshot = try await db.collection("chat_channels")
            .document(channelId)
            .collection("messages")
            .order(by: "timestamp", descending: true)
            .limit(to: limit)
            .getDocuments()
        
        return snapshot.documents.compactMap { doc in
            try? doc.data(as: Message.self)
        }
    }
    
    func sendMessage(channelId: String, content: String) async throws {
        guard let userId = currentUser?.uid else {
            throw AuthError.notAuthenticated
        }
        
        let messageId = UUID().uuidString
        let message = Message(
            id: messageId,
            userId: userId,
            content: content,
            timestamp: Date(),
            attachments: nil,
            mentions: nil
        )
        
        try db.collection("chat_channels")
            .document(channelId)
            .collection("messages")
            .document(messageId)
            .setData(from: message)
    }
}

// MARK: - Error Types

enum AuthError: LocalizedError {
    case notAuthenticated
    case notImplemented
    
    var errorDescription: String? {
        switch self {
        case .notAuthenticated:
            return "User is not authenticated"
        case .notImplemented:
            return "This feature is not yet implemented"
        }
    }
}

