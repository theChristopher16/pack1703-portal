//
//  MainTabView.swift
//  Copse
//
//  Main tab bar navigation with beautiful glassmorphism design
//  The "dock" at the bottom for navigating the app
//

import SwiftUI

struct MainTabView: View {
    @StateObject private var streamChatService = StreamChatService.shared
    @State private var selectedTab = 0
    
    var body: some View {
        TabView(selection: $selectedTab) {
            // Home Tab
            UserHomeView()
                .tabItem {
                    Label("Home", systemImage: "house.fill")
                }
                .tag(0)
            
            // Calendar Tab
            CalendarView()
                .tabItem {
                    Label("Calendar", systemImage: "calendar")
                }
                .tag(1)
            
            // Chat Tab
            ChatChannelListView()
                .tabItem {
                    Label("Chat", systemImage: "message.fill")
                }
                .badge(streamChatService.unreadCount > 0 ? streamChatService.unreadCount : nil)
                .tag(2)
            
            // Organizations Tab
            BrowseOrganizationsView()
                .tabItem {
                    Label("Copses", systemImage: "leaf.fill")
                }
                .tag(3)
            
            // Profile Tab
            SettingsView()
                .tabItem {
                    Label("Profile", systemImage: "person.fill")
                }
                .tag(4)
        }
        .accentColor(.green)
        .onAppear {
            // Configure tab bar appearance
            let appearance = UITabBarAppearance()
            appearance.configureWithDefaultBackground()
            
            // Glassmorphism effect for tab bar
            appearance.backgroundColor = UIColor.systemBackground.withAlphaComponent(0.8)
            
            UITabBar.appearance().standardAppearance = appearance
            UITabBar.appearance().scrollEdgeAppearance = appearance
        }
    }
}

// Simple Settings/Profile View
struct SettingsView: View {
    @StateObject private var firebaseService = FirebaseService.shared
    
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
                
                ScrollView {
                    VStack(spacing: 24) {
                        // Profile Section
                        VStack(spacing: 16) {
                            // Profile Image
                            ZStack {
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
                                    .frame(width: 100, height: 100)
                                    .shadow(color: Color.green.opacity(0.3), radius: 12, x: 0, y: 6)
                                
                                if let photoURL = firebaseService.currentUser?.photoURL {
                                    AsyncImage(url: photoURL) { image in
                                        image
                                            .resizable()
                                            .scaledToFill()
                                    } placeholder: {
                                        Image(systemName: "person.fill")
                                            .font(.system(size: 40))
                                            .foregroundColor(.white)
                                    }
                                    .frame(width: 100, height: 100)
                                    .clipShape(Circle())
                                } else {
                                    Image(systemName: "person.fill")
                                        .font(.system(size: 40))
                                        .foregroundColor(.white)
                                }
                            }
                            
                            // User Info
                            VStack(spacing: 8) {
                                if let user = firebaseService.currentUser {
                                    Text(user.displayName ?? "User")
                                        .font(.system(size: 24, weight: .bold))
                                        .foregroundColor(.primary)
                                    
                                    Text(user.email ?? "")
                                        .font(.system(size: 16))
                                        .foregroundColor(.secondary)
                                }
                            }
                        }
                        .padding(.top, 40)
                        
                        // Settings Options
                        VStack(spacing: 12) {
                            SettingsRow(icon: "bell.fill", title: "Notifications", color: .orange)
                            SettingsRow(icon: "lock.fill", title: "Privacy", color: .blue)
                            SettingsRow(icon: "gear", title: "Preferences", color: .gray)
                            SettingsRow(icon: "questionmark.circle.fill", title: "Help & Support", color: .purple)
                            SettingsRow(icon: "info.circle.fill", title: "About Copse", color: .teal)
                        }
                        .padding(.horizontal)
                        
                        // Sign Out Button
                        Button(action: {
                            try? firebaseService.signOut()
                        }) {
                            HStack {
                                Image(systemName: "arrow.right.square")
                                Text("Sign Out")
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
                                                Color.red.opacity(0.8),
                                                Color.red.opacity(0.6)
                                            ]),
                                            startPoint: .leading,
                                            endPoint: .trailing
                                        )
                                    )
                                    .shadow(color: Color.red.opacity(0.3), radius: 10, x: 0, y: 5)
                            )
                        }
                        .padding(.horizontal)
                        .padding(.top, 20)
                    }
                    .padding(.bottom, 40)
                }
            }
            .navigationTitle("Profile")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}

struct SettingsRow: View {
    let icon: String
    let title: String
    let color: Color
    
    var body: some View {
        HStack(spacing: 16) {
            ZStack {
                RoundedRectangle(cornerRadius: 12)
                    .fill(
                        LinearGradient(
                            gradient: Gradient(colors: [
                                color.opacity(0.8),
                                color.opacity(0.6)
                            ]),
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 44, height: 44)
                
                Image(systemName: icon)
                    .font(.system(size: 20))
                    .foregroundColor(.white)
            }
            
            Text(title)
                .font(.system(size: 17))
                .foregroundColor(.primary)
            
            Spacer()
            
            Image(systemName: "chevron.right")
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(.secondary)
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(.ultraThinMaterial)
                .shadow(color: Color.black.opacity(0.05), radius: 8, x: 0, y: 4)
        )
    }
}

#Preview {
    MainTabView()
}

