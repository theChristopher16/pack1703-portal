//
//  FirebaseService.swift
//  Copse
//
//  Firebase integration service for Pack 1703 Portal
//

import Foundation
import FirebaseAuth
import FirebaseFirestore

class FirebaseService: ObservableObject {
    static let shared = FirebaseService()
    
    @Published var currentUser: User?
    @Published var isAuthenticated = false
    
    private let auth = Auth.auth()
    private let db = Firestore.firestore()
    
    private init() {
        // Listen for auth state changes
        auth.addStateDidChangeListener { [weak self] _, user in
            self?.currentUser = user
            self?.isAuthenticated = user != nil
        }
    }
    
    // MARK: - Authentication
    
    func signIn(email: String, password: String) async throws {
        try await auth.signIn(withEmail: email, password: password)
    }
    
    func signOut() throws {
        try auth.signOut()
    }
    
    func signInWithGoogle() async throws {
        // TODO: Implement Google Sign-In
        throw AuthError.notImplemented
    }
    
    func signInWithApple() async throws {
        // TODO: Implement Apple Sign-In
        throw AuthError.notImplemented
    }
    
    // MARK: - Firestore Operations
    
    func fetchEvents() async throws -> [Event] {
        let snapshot = try await db.collection("events")
            .order(by: "date", descending: false)
            .getDocuments()
        
        return snapshot.documents.compactMap { doc in
            try? doc.data(as: Event.self)
        }
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
        
        let message = Message(
            id: UUID().uuidString,
            userId: userId,
            content: content,
            timestamp: Date()
        )
        
        try await db.collection("chat_channels")
            .document(channelId)
            .collection("messages")
            .document(message.id)
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

