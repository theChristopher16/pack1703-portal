//
//  ChatChannelListView.swift
//  Copse
//
//  Beautiful glassmorphism chat channel list
//  Integrates Stream Chat with Copse design system
//

import SwiftUI
import StreamChat
import StreamChatUI

struct ChatChannelListView: View {
    @StateObject private var streamChatService = StreamChatService.shared
    @StateObject private var firebaseService = FirebaseService.shared
    @State private var channels: [ChatChannel] = []
    @State private var isLoading = true
    @State private var showCreateChannel = false
    @State private var selectedChannel: ChatChannel?
    @State private var searchText = ""
    @State private var filterOrganization: String? = nil
    
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
                        Text("Chat")
                            .font(.system(size: 32, weight: .bold))
                            .foregroundColor(.primary)
                        
                        Spacer()
                        
                        // Unread badge
                        if streamChatService.unreadCount > 0 {
                            ZStack {
                                Circle()
                                    .fill(
                                        LinearGradient(
                                            gradient: Gradient(colors: [
                                                Color.red.opacity(0.8),
                                                Color.red.opacity(0.6)
                                            ]),
                                            startPoint: .topLeading,
                                            endPoint: .bottomTrailing
                                        )
                                    )
                                    .frame(width: 32, height: 32)
                                
                                Text("\(streamChatService.unreadCount)")
                                    .font(.system(size: 14, weight: .bold))
                                    .foregroundColor(.white)
                            }
                        }
                        
                        // Create channel button
                        Button(action: {
                            showCreateChannel = true
                        }) {
                            Image(systemName: "plus.bubble.fill")
                                .font(.system(size: 24))
                                .foregroundColor(.primary)
                        }
                    }
                    .padding(.horizontal)
                    .padding(.top, 8)
                    
                    // Search Bar
                    HStack {
                        Image(systemName: "magnifyingglass")
                            .foregroundColor(.secondary)
                        
                        TextField("Search channels...", text: $searchText)
                            .textFieldStyle(PlainTextFieldStyle())
                    }
                    .padding(12)
                    .background(
                        RoundedRectangle(cornerRadius: 12)
                            .fill(.ultraThinMaterial)
                    )
                    .padding(.horizontal)
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
                
                // Connection Status
                if !streamChatService.isConnected {
                    HStack {
                        ProgressView()
                            .scaleEffect(0.8)
                        Text("Connecting to chat...")
                            .font(.system(size: 14))
                            .foregroundColor(.secondary)
                    }
                    .padding()
                    .frame(maxWidth: .infinity)
                    .background(
                        RoundedRectangle(cornerRadius: 12)
                            .fill(.ultraThinMaterial)
                            .shadow(color: Color.black.opacity(0.05), radius: 4, x: 0, y: 2)
                    )
                    .padding(.horizontal)
                    .padding(.top, 8)
                }
                
                // Channels List
                if isLoading {
                    VStack(spacing: 20) {
                        ProgressView()
                            .scaleEffect(1.2)
                        Text("Loading channels...")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if filteredChannels.isEmpty {
                    VStack(spacing: 16) {
                        Image(systemName: "bubble.left.and.bubble.right.fill")
                            .font(.system(size: 48))
                            .foregroundColor(.secondary.opacity(0.5))
                        
                        Text("No channels yet")
                            .font(.headline)
                            .foregroundColor(.primary)
                        
                        Text("Start a conversation or join an organization")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                        
                        Button(action: {
                            showCreateChannel = true
                        }) {
                            HStack {
                                Image(systemName: "plus.bubble.fill")
                                Text("Create Channel")
                            }
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundColor(.white)
                            .padding(.horizontal, 20)
                            .padding(.vertical, 12)
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
                                    .shadow(color: Color.green.opacity(0.3), radius: 8, x: 0, y: 4)
                            )
                        }
                        .padding(.top, 8)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .padding()
                } else {
                    ScrollView {
                        LazyVStack(spacing: 12) {
                            ForEach(filteredChannels, id: \.cid) { channel in
                                ChannelRowView(channel: channel)
                                    .onTapGesture {
                                        selectedChannel = channel
                                    }
                            }
                        }
                        .padding()
                    }
                }
            }
        }
        .navigationBarHidden(true)
        .onAppear {
            streamChatService.initialize()
            loadChannels()
        }
        .sheet(isPresented: $showCreateChannel) {
            CreateChannelView()
        }
        .sheet(isPresented: Binding(
            get: { selectedChannel != nil },
            set: { if !$0 { selectedChannel = nil } }
        )) {
            if let channel = selectedChannel {
                ChatConversationView(channel: channel)
            }
        }
    }
    
    private var filteredChannels: [ChatChannel] {
        guard !searchText.isEmpty else { return channels }
        return channels.filter { channel in
            channel.name?.localizedCaseInsensitiveContains(searchText) ?? false
        }
    }
    
    private func loadChannels() {
        // Wait for Stream Chat to connect
        guard streamChatService.isConnected else {
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
                loadChannels()
            }
            return
        }
        
        guard let controller = streamChatService.getAllChannelsController() else {
            isLoading = false
            return
        }
        
        controller.synchronize { error in
            if let error = error {
                print("🔴 Failed to load channels: \(error)")
                isLoading = false
                return
            }
            
            DispatchQueue.main.async {
                channels = Array(controller.channels)
                isLoading = false
            }
        }
        
        // Set up delegate to listen for updates
        controller.delegate = ChannelListDelegate { updatedChannels in
            DispatchQueue.main.async {
                channels = Array(updatedChannels)
            }
        }
    }
}

// MARK: - Channel Row View

struct ChannelRowView: View {
    let channel: ChatChannel
    @State private var isPressed = false
    
    var body: some View {
        HStack(spacing: 16) {
            // Channel Icon
            ZStack {
                Circle()
                    .fill(
                        LinearGradient(
                            gradient: Gradient(colors: [
                                channelColor.opacity(0.8),
                                channelColor.opacity(0.6)
                            ]),
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 56, height: 56)
                    .shadow(color: channelColor.opacity(0.3), radius: 8, x: 0, y: 4)
                
                Text(channelEmoji)
                    .font(.system(size: 28))
            }
            
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Text(channel.name ?? "Unnamed Channel")
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundColor(.primary)
                        .lineLimit(1)
                    
                    Spacer()
                    
                    if let lastMessageAt = channel.lastMessageAt {
                        Text(lastMessageAt, style: .relative)
                            .font(.system(size: 12))
                            .foregroundColor(.secondary)
                    }
                }
                
                if let lastMessage = channel.latestMessages.first {
                    Text(lastMessage.text)
                        .font(.system(size: 14))
                        .foregroundColor(.secondary)
                        .lineLimit(2)
                }
                
                // Unread indicator
                if channel.unreadCount.messages > 0 {
                    HStack(spacing: 4) {
                        Circle()
                            .fill(Color.green)
                            .frame(width: 8, height: 8)
                        
                        Text("\(channel.unreadCount.messages) unread")
                            .font(.system(size: 12, weight: .medium))
                            .foregroundColor(.green)
                    }
                }
            }
            
            Image(systemName: "chevron.right")
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(.secondary)
        }
        .padding(16)
        .background(
            ZStack {
                RoundedRectangle(cornerRadius: 16)
                    .fill(.ultraThinMaterial)
                
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
            }
        )
        .shadow(color: Color.black.opacity(0.1), radius: 8, x: 0, y: 4)
        .scaleEffect(isPressed ? 0.98 : 1.0)
        .animation(.spring(response: 0.3, dampingFraction: 0.6), value: isPressed)
        .simultaneousGesture(
            DragGesture(minimumDistance: 0)
                .onChanged { _ in isPressed = true }
                .onEnded { _ in isPressed = false }
        )
    }
    
    private var channelEmoji: String {
        let customData = channel.extraData
        
        // Check for den emoji
        if let denEmoji = customData["den_emoji"]?.stringValue {
            return denEmoji
        }
        
        // Check for channel type
        if let channelType = customData["channel_type"]?.stringValue {
            switch channelType {
            case "den": return "🏕️"
            case "event": return "📅"
            case "organization_general": return "🌲"
            default: return "💬"
            }
        }
        
        return "💬"
    }
    
    private var channelColor: Color {
        let customData = channel.extraData
        
        if let channelType = customData["channel_type"]?.stringValue {
            switch channelType {
            case "den": return .green
            case "event": return .blue
            case "organization_general": return .purple
            default: return .teal
            }
        }
        
        return .teal
    }
}

// MARK: - Create Channel View

struct CreateChannelView: View {
    @Environment(\.dismiss) var dismiss
    @State private var channelName = ""
    @State private var isCreating = false
    @State private var errorMessage: String?
    
    var body: some View {
        NavigationView {
            ZStack {
                LinearGradient(
                    gradient: Gradient(colors: [
                        Color(red: 0.95, green: 0.98, blue: 0.95),
                        Color(red: 0.94, green: 0.97, blue: 0.96)
                    ]),
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()
                
                VStack(spacing: 24) {
                    TextField("Channel Name", text: $channelName)
                        .textFieldStyle(.plain)
                        .font(.system(size: 17))
                        .padding()
                        .background(
                            RoundedRectangle(cornerRadius: 12)
                                .fill(.ultraThinMaterial)
                        )
                        .padding(.horizontal)
                    
                    if let error = errorMessage {
                        Text(error)
                            .font(.system(size: 14))
                            .foregroundColor(.red)
                            .padding(.horizontal)
                    }
                    
                    Button(action: createChannel) {
                        HStack {
                            if isCreating {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                            } else {
                                Image(systemName: "plus.bubble.fill")
                                Text("Create Channel")
                            }
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
                    .disabled(isCreating || channelName.isEmpty)
                    .padding(.horizontal)
                    
                    Spacer()
                }
                .padding(.top, 40)
            }
            .navigationTitle("New Channel")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
    }
    
    private func createChannel() {
        isCreating = true
        errorMessage = nil
        
        Task {
            do {
                // TODO: Get organization ID from context
                // TODO: Get member list from organization
                _ = try await StreamChatService.shared.createChannel(
                    name: channelName,
                    organizationId: "pack1703", // TODO: Make dynamic
                    members: [],
                    customData: [:]
                )
                
                await MainActor.run {
                    dismiss()
                }
            } catch {
                await MainActor.run {
                    errorMessage = error.localizedDescription
                    isCreating = false
                }
            }
        }
    }
}

// MARK: - Channel List Delegate

class ChannelListDelegate: ChatChannelListControllerDelegate {
    let onUpdate: ([ChatChannel]) -> Void
    
    init(onUpdate: @escaping ([ChatChannel]) -> Void) {
        self.onUpdate = onUpdate
    }
    
    func controller(_ controller: ChatChannelListController, didChangeChannels changes: [ListChange<ChatChannel>]) {
        onUpdate(Array(controller.channels))
    }
}

#Preview {
    ChatChannelListView()
}

