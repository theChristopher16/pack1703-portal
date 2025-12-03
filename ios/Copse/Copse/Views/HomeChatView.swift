//
//  HomeChatView.swift
//  Copse
//
//  Home-specific chat view
//  Shows only the current home's chat channel
//

import SwiftUI
import StreamChat

struct HomeChatView: View {
    @StateObject private var homeService = HomeService.shared
    @StateObject private var streamChatService = StreamChatService.shared
    @State private var homeChannel: ChatChannel?
    @State private var isLoading = true
    
    var body: some View {
        NavigationView {
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
                    VStack(spacing: 12) {
                        HStack {
                            Image(systemName: "house.fill")
                                .font(.system(size: 24))
                                .foregroundColor(.green)
                            
                            Text(homeService.currentHousehold?.name ?? "Home Chat")
                                .font(.system(size: 28, weight: .bold))
                                .foregroundColor(.primary)
                            
                            Spacer()
                        }
                        .padding(.horizontal)
                        .padding(.top, 8)
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
                    
                    // Chat content
                    if isLoading {
                        VStack(spacing: 20) {
                            ProgressView()
                                .scaleEffect(1.2)
                            Text("Loading home chat...")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                    } else if let channel = homeChannel {
                        // Show chat conversation
                        ChatChannelViewWrapper(channel: channel)
                    } else {
                        // No home chat yet
                        VStack(spacing: 16) {
                            Image(systemName: "bubble.left.and.bubble.right.fill")
                                .font(.system(size: 60))
                                .foregroundColor(.secondary.opacity(0.5))
                            
                            Text("Home chat not available")
                                .font(.headline)
                                .foregroundColor(.primary)
                            
                            Text("Your home chat will appear here once configured")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                    }
                }
            }
            .navigationBarHidden(true)
            .onAppear {
                loadHomeChat()
            }
        }
    }
    
    private func loadHomeChat() {
        guard let household = homeService.currentHousehold,
              let chatChannelId = household.chatChannelId,
              streamChatService.isConnected else {
            isLoading = false
            return
        }
        
        // Load the home chat channel
        let channelId = ChannelId(type: .messaging, id: chatChannelId)
        
        guard let controller = streamChatService.channelController(for: channelId) else {
            isLoading = false
            return
        }
        
        controller.synchronize { error in
            DispatchQueue.main.async {
                if let error = error {
                    print("🔴 Failed to load home chat: \(error)")
                    isLoading = false
                    return
                }
                
                homeChannel = controller.channel
                isLoading = false
            }
        }
    }
}

#Preview {
    HomeChatView()
}

