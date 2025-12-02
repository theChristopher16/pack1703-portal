//
//  ChatConversationView.swift
//  Copse
//
//  Individual channel conversation view
//  Beautiful glassmorphism design matching Copse aesthetic
//

import SwiftUI
import StreamChat
import StreamChatUI

struct ChatConversationView: View {
    let channel: ChatChannel
    @Environment(\.dismiss) var dismiss
    @StateObject private var streamChatService = StreamChatService.shared
    
    var body: some View {
        NavigationView {
            ZStack {
                // Use Stream Chat's built-in UI with custom styling
                ChatChannelViewWrapper(channel: channel)
            }
            .navigationTitle(channel.name ?? "Chat")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button(action: {
                        dismiss()
                    }) {
                        HStack(spacing: 4) {
                            Image(systemName: "chevron.left")
                                .font(.system(size: 16, weight: .semibold))
                            Text("Back")
                        }
                        .foregroundColor(.primary)
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: {
                        // TODO: Show channel info
                    }) {
                        Image(systemName: "info.circle")
                            .font(.system(size: 20))
                            .foregroundColor(.primary)
                    }
                }
            }
        }
    }
}

// MARK: - Stream Chat UI Wrapper

struct ChatChannelViewWrapper: UIViewControllerRepresentable {
    let channel: ChatChannel
    
    func makeUIViewController(context: Context) -> ChatChannelVC {
        // Get the channel controller
        guard let channelController = StreamChatService.shared.channelController(for: channel.cid) else {
            return ChatChannelVC()
        }
        
        // Create and configure the view controller
        let vc = ChatChannelVC()
        vc.channelController = channelController
        
        // Apply custom appearance to match Copse design
        configureAppearance()
        
        return vc
    }
    
    func updateUIViewController(_ uiViewController: ChatChannelVC, context: Context) {
        // Update if needed
    }
    
    private func configureAppearance() {
        // Configure Stream Chat UI to match Copse glassmorphism design
        var appearance = Appearance()
        
        // Colors - Forest/Nature theme
        appearance.colorPalette.background = UIColor(red: 0.95, green: 0.98, blue: 0.95, alpha: 1.0)
        appearance.colorPalette.background1 = UIColor(red: 0.94, green: 0.97, blue: 0.96, alpha: 1.0)
        appearance.colorPalette.background2 = UIColor(red: 0.94, green: 0.98, blue: 0.99, alpha: 1.0)
        
        // Primary tint - Forest Green
        appearance.colorPalette.accentPrimary = UIColor(red: 0.29, green: 0.63, blue: 0.42, alpha: 1.0)
        
        // Text colors
        appearance.colorPalette.text = .label
        appearance.colorPalette.textLowEmphasis = .secondaryLabel
        
        // Message bubbles - Glassmorphism effect
        appearance.colorPalette.background3 = UIColor.systemBackground.withAlphaComponent(0.7)
        appearance.colorPalette.background4 = UIColor.secondarySystemBackground.withAlphaComponent(0.7)
        
        // Fonts
        appearance.fonts.body = .systemFont(ofSize: 16)
        appearance.fonts.bodyBold = .systemFont(ofSize: 16, weight: .semibold)
        appearance.fonts.headline = .systemFont(ofSize: 18, weight: .bold)
        appearance.fonts.headlineBold = .systemFont(ofSize: 18, weight: .bold)
        appearance.fonts.footnote = .systemFont(ofSize: 14)
        
        // Apply the appearance
        Appearance.default = appearance
    }
}

#Preview {
    // This won't work in preview without a real channel
    // Use in the app with actual channel data
    Text("Chat Conversation Preview")
}

