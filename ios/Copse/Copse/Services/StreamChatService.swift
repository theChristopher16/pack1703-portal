//
//  StreamChatService.swift
//  Copse
//
//  Stream Chat integration service
//  Manages chat connections, channels, and synchronization with Firebase
//

import Foundation
import Combine
import StreamChat
import StreamChatUI
import FirebaseAuth
import FirebaseFunctions

class StreamChatService: ObservableObject {
    static let shared = StreamChatService()
    
    @Published var isConnected = false
    @Published var unreadCount: Int = 0
    @Published var currentUserId: String?
    
    private var chatClient: ChatClient?
    private var cancellables = Set<AnyCancellable>()
    private var firebaseService = FirebaseService.shared
    
    // Stream Chat configuration
    private let apiKey: String = {
        // TODO: Move to secure configuration
        return Bundle.main.object(forInfoDictionaryKey: "STREAM_API_KEY") as? String ?? ""
    }()
    
    private init() {
        setupAuthListener()
    }
    
    // MARK: - Initialization
    
    private func setupAuthListener() {
        // Listen for Firebase auth changes and connect/disconnect Stream Chat accordingly
        firebaseService.$isAuthenticated
            .sink { [weak self] isAuthenticated in
                if isAuthenticated {
                    Task {
                        await self?.connectUser()
                    }
                } else {
                    self?.disconnectUser()
                }
            }
            .store(in: &cancellables)
    }
    
    func initialize() {
        guard !apiKey.isEmpty else {
            print("🔴 StreamChat: API key not configured")
            return
        }
        
        // Configure Stream Chat
        let config = ChatClientConfig(apiKey: .init(apiKey))
        
        // Create the client
        chatClient = ChatClient(config: config)
        
        print("✅ StreamChat: Initialized with API key")
    }
    
    // MARK: - User Connection
    
    func connectUser() async {
        guard let client = chatClient else {
            print("🔴 StreamChat: Client not initialized")
            return
        }
        
        guard let firebaseUser = firebaseService.currentUser else {
            print("🔴 StreamChat: No Firebase user")
            return
        }
        
        do {
            // Get Stream Chat token from your backend
            // For now, using development token (NOT for production!)
            let token = try await fetchStreamToken(for: firebaseUser.uid)
            
            // Create user info
            let userInfo = UserInfo(
                id: firebaseUser.uid,
                name: firebaseUser.displayName ?? firebaseUser.email ?? "User",
                imageURL: firebaseUser.photoURL
            )
            
            // Connect user
            try await client.connectUser(
                userInfo: userInfo,
                token: token
            )
            
            await MainActor.run {
                isConnected = true
                currentUserId = firebaseUser.uid
            }
            
            // Start listening for unread count
            observeUnreadCount()
            
            print("✅ StreamChat: User connected - \(firebaseUser.uid)")
            
        } catch {
            print("🔴 StreamChat: Failed to connect user - \(error)")
        }
    }
    
    func disconnectUser() {
        chatClient?.disconnect()
        
        Task { @MainActor in
            isConnected = false
            currentUserId = nil
            unreadCount = 0
        }
        
        print("🔵 StreamChat: User disconnected")
    }
    
    // MARK: - Token Management
    
    private func fetchStreamToken(for userId: String) async throws -> Token {
        // Call Firebase Cloud Function to generate Stream Chat token
        // The function will handle user creation and token generation securely
        
        let functions = FirebaseFunctions.Functions.functions()
        
        do {
            let result = try await functions.httpsCallable("generateStreamChatToken").call()
            
            guard let data = result.data as? [String: Any],
                  let tokenString = data["token"] as? String else {
                throw StreamChatError.tokenGenerationNotImplemented
            }
            
            return Token(stringLiteral: tokenString)
            
        } catch {
            print("🔴 StreamChat: Token generation failed - \(error)")
            throw StreamChatError.tokenGenerationNotImplemented
        }
    }
    
    // MARK: - Channel Management
    
    /// Get channel list controller for organization channels
    func getChannelListController(for organizationId: String) -> ChatChannelListController? {
        guard let client = chatClient, isConnected else { return nil }
        
        let filter: Filter<ChannelListFilterScope> = .and([
            .equal(.type, to: .messaging),
            .containMembers(userIds: [currentUserId ?? ""])
            // Note: Custom field filtering requires backend setup
            // For now, filter by membership only
        ])
        
        let query = ChannelListQuery(filter: filter)
        return client.channelListController(query: query)
    }
    
    /// Get all channels user is part of
    func getAllChannelsController() -> ChatChannelListController? {
        guard let client = chatClient, isConnected else { return nil }
        
        let filter: Filter<ChannelListFilterScope> = .and([
            .equal(.type, to: .messaging),
            .containMembers(userIds: [currentUserId ?? ""])
        ])
        
        let query = ChannelListQuery(filter: filter)
        return client.channelListController(query: query)
    }
    
    /// Create a new channel
    func createChannel(
        name: String,
        organizationId: String,
        members: [String],
        customData: [String: Any] = [:]
    ) async throws -> ChatChannel {
        guard let client = chatClient, isConnected else {
            throw StreamChatError.notConnected
        }
        
        // Convert to RawJSON
        var extraData: [String: RawJSON] = [:]
        extraData["organization_id"] = .string(organizationId)
        
        for (key, value) in customData {
            if let stringValue = value as? String {
                extraData[key] = .string(stringValue)
            } else if let intValue = value as? Int {
                extraData[key] = .number(Double(intValue))
            } else if let boolValue = value as? Bool {
                extraData[key] = .bool(boolValue)
            }
        }
        
        let channelId = ChannelId(type: .messaging, id: UUID().uuidString)
        
        let controller = try client.channelController(
            createChannelWithId: channelId,
            name: name,
            members: Set(members),
            extraData: extraData
        )
        
        controller.synchronize { error in
            if let error = error {
                print("🔴 StreamChat: Channel sync error - \(error)")
            }
        }
        
        // Wait a moment for channel to be created
        try await Task.sleep(nanoseconds: 500_000_000) // 0.5 seconds
        
        guard let channel = controller.channel else {
            throw StreamChatError.channelCreationFailed
        }
        
        return channel
    }
    
    /// Join an existing channel
    func joinChannel(channelId: ChannelId) async throws {
        guard let client = chatClient, isConnected else {
            throw StreamChatError.notConnected
        }
        
        let controller = client.channelController(for: channelId)
        controller.synchronize()
        
        // Add current user as member
        if let userId = currentUserId {
            controller.addMembers(userIds: Set([userId]))
        }
    }
    
    // MARK: - Unread Count
    
    private func observeUnreadCount() {
        guard let client = chatClient else { return }
        
        // Observe unread count changes
        let controller = client.currentUserController()
        controller.synchronize()
        
        // Update unread count
        Task { @MainActor in
            self.unreadCount = controller.unreadCount.messages
        }
    }
    
    // MARK: - Channel Helpers
    
    /// Get channel controller for specific channel
    func channelController(for channelId: ChannelId) -> ChatChannelController? {
        guard let client = chatClient else { return nil }
        return client.channelController(for: channelId)
    }
}

// MARK: - Errors

enum StreamChatError: LocalizedError {
    case notConnected
    case tokenGenerationNotImplemented
    case channelCreationFailed
    
    var errorDescription: String? {
        switch self {
        case .notConnected:
            return "Not connected to Stream Chat"
        case .tokenGenerationNotImplemented:
            return "Token generation not implemented. Please implement fetchStreamToken() with your backend."
        case .channelCreationFailed:
            return "Failed to create channel"
        }
    }
}

// MARK: - Channel Types for Copse

extension StreamChatService {
    /// Create a den-specific channel
    func createDenChannel(
        denName: String,
        denEmoji: String,
        organizationId: String,
        members: [String]
    ) async throws -> ChatChannel {
        let channelName = "\(denEmoji) \(denName) Den"
        
        let customData: [String: Any] = [
            "channel_type": "den",
            "den_name": denName,
            "den_emoji": denEmoji
        ]
        
        return try await createChannel(
            name: channelName,
            organizationId: organizationId,
            members: members,
            customData: customData
        )
    }
    
    /// Create an event-specific channel
    func createEventChannel(
        eventId: String,
        eventName: String,
        organizationId: String,
        members: [String]
    ) async throws -> ChatChannel {
        let channelName = "📅 \(eventName)"
        
        let customData: [String: Any] = [
            "channel_type": "event",
            "event_id": eventId
        ]
        
        return try await createChannel(
            name: channelName,
            organizationId: organizationId,
            members: members,
            customData: customData
        )
    }
    
    /// Create a general organization channel
    func createOrganizationChannel(
        organizationName: String,
        organizationId: String,
        members: [String]
    ) async throws -> ChatChannel {
        let channelName = "🏕️ \(organizationName) General"
        
        let customData: [String: Any] = [
            "channel_type": "organization_general"
        ]
        
        return try await createChannel(
            name: channelName,
            organizationId: organizationId,
            members: members,
            customData: customData
        )
    }
}

