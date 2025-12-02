//
//  UserHomeView.swift
//  Copse
//
//  User's Personal Home - First screen after login
//  Matches web app's HomeManagement component
//

import SwiftUI
import FirebaseAuth

struct UserHomeView: View {
    @StateObject private var firebaseService = FirebaseService.shared
    @State private var selectedTab: HomeTab = .overview
    
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
                VStack(spacing: 12) {
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Welcome Back")
                                .font(.system(size: 28, weight: .bold))
                                .foregroundColor(.primary)
                            
                            if let user = firebaseService.currentUser {
                                Text(user.email ?? "User")
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                            }
                        }
                        
                        Spacer()
                        
                        // Profile/Account button
                        Button(action: {
                            // TODO: Show profile
                        }) {
                            Image(systemName: "person.circle.fill")
                                .font(.system(size: 32))
                                .foregroundColor(.primary)
                        }
                    }
                    .padding(.horizontal)
                    .padding(.top, 8)
                }
                .padding(.bottom, 20)
                .background(
                    // Glassmorphism header
                    ZStack {
                        Color.white.opacity(0.1)
                        Rectangle()
                            .fill(.ultraThinMaterial)
                    }
                    .ignoresSafeArea(edges: .top)
                )
                
                // Tab Selector
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 12) {
                        ForEach(HomeTab.allCases, id: \.self) { tab in
                            TabButton(
                                tab: tab,
                                isSelected: selectedTab == tab
                            ) {
                                withAnimation(.spring(response: 0.3)) {
                                    selectedTab = tab
                                }
                            }
                        }
                    }
                    .padding(.horizontal)
                }
                .padding(.vertical, 12)
                
                // Content
                ScrollView {
                    VStack(spacing: 24) {
                        // Organizations Section
                        OrganizationsSection()
                            .padding(.horizontal)
                        
                        // Quick Actions
                        QuickActionsSection()
                            .padding(.horizontal)
                        
                        // Recent Activity (placeholder)
                        RecentActivitySection()
                            .padding(.horizontal)
                    }
                    .padding(.top, 20)
                    .padding(.bottom, 30)
                }
            }
        }
        .navigationBarHidden(true)
    }
}

enum HomeTab: String, CaseIterable {
    case overview = "Overview"
    case calendar = "Calendar"
    case family = "Family"
    case organizations = "Organizations"
}

struct TabButton: View {
    let tab: HomeTab
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(tab.rawValue)
                .font(.system(size: 15, weight: isSelected ? .semibold : .regular))
                .foregroundColor(isSelected ? .white : .primary)
                .padding(.horizontal, 20)
                .padding(.vertical, 10)
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
                                .shadow(color: Color.green.opacity(0.3), radius: 8, x: 0, y: 4)
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

// Organizations Section - Shows available organizations to join
struct OrganizationsSection: View {
    @State private var organizations: [Organization] = []
    @State private var isLoading = true
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("My Organizations")
                    .font(.system(size: 22, weight: .bold))
                    .foregroundColor(.primary)
                
                Spacer()
                
                NavigationLink(destination: BrowseOrganizationsView()) {
                    Text("Browse All")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(.blue)
                }
            }
            
            if isLoading {
                ProgressView()
                    .frame(maxWidth: .infinity)
                    .padding()
            } else if organizations.isEmpty {
                // Join Pack 1703 Card
                JoinOrganizationCard(
                    name: "Pack 1703",
                    description: "Join Pack 1703 to access events, chat, and resources",
                    icon: "leaf.fill",
                    color: .green
                )
            } else {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 16) {
                        ForEach(organizations) { org in
                            OrganizationCard(organization: org)
                        }
                        
                        // Add "Join Organization" card
                        JoinOrganizationCard(
                            name: "Join More",
                            description: "Discover other organizations",
                            icon: "plus.circle.fill",
                            color: .blue
                        )
                    }
                    .padding(.horizontal, 4)
                }
            }
        }
        .onAppear {
            loadOrganizations()
        }
    }
    
    private func loadOrganizations() {
        // TODO: Fetch user's organizations from Firestore
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            organizations = []
            isLoading = false
        }
    }
}

struct Organization: Identifiable {
    let id: String
    let name: String
    let description: String
    let icon: String
    let color: Color
}

struct OrganizationCard: View {
    let organization: Organization
    @State private var isPressed = false
    
    var body: some View {
        Button(action: {
            // TODO: Navigate to organization
            print("Tapped \(organization.name)")
        }) {
            VStack(alignment: .leading, spacing: 12) {
                // Icon
                ZStack {
                    RoundedRectangle(cornerRadius: 12)
                        .fill(
                            LinearGradient(
                                gradient: Gradient(colors: [
                                    organization.color.opacity(0.8),
                                    organization.color.opacity(0.6)
                                ]),
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 50, height: 50)
                    
                    Image(systemName: organization.icon)
                        .font(.system(size: 24, weight: .semibold))
                        .foregroundColor(.white)
                }
                
                // Name
                Text(organization.name)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(.primary)
                    .lineLimit(1)
                
                // Description
                Text(organization.description)
                    .font(.system(size: 12))
                    .foregroundColor(.secondary)
                    .lineLimit(2)
            }
            .padding(16)
            .frame(width: 160)
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
            .scaleEffect(isPressed ? 0.95 : 1.0)
            .animation(.spring(response: 0.3, dampingFraction: 0.6), value: isPressed)
        }
        .buttonStyle(PlainButtonStyle())
        .simultaneousGesture(
            DragGesture(minimumDistance: 0)
                .onChanged { _ in isPressed = true }
                .onEnded { _ in isPressed = false }
        )
    }
}

struct JoinOrganizationCard: View {
    let name: String
    let description: String
    let icon: String
    let color: Color
    @State private var isPressed = false
    
    var body: some View {
        Button(action: {
            // TODO: Show join organization flow
            print("Join \(name)")
        }) {
            VStack(spacing: 12) {
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
                        .frame(width: 50, height: 50)
                    
                    Image(systemName: icon)
                        .font(.system(size: 24, weight: .semibold))
                        .foregroundColor(.white)
                }
                
                Text(name)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(.primary)
                    .lineLimit(1)
                
                Text(description)
                    .font(.system(size: 12))
                    .foregroundColor(.secondary)
                    .lineLimit(2)
                    .multilineTextAlignment(.center)
            }
            .padding(16)
            .frame(width: 160)
            .background(
                ZStack {
                    RoundedRectangle(cornerRadius: 16)
                        .fill(.ultraThinMaterial)
                    
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(
                            LinearGradient(
                                gradient: Gradient(colors: [
                                    color.opacity(0.4),
                                    color.opacity(0.2)
                                ]),
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            lineWidth: 2
                        )
                }
            )
            .shadow(color: color.opacity(0.2), radius: 10, x: 0, y: 5)
            .scaleEffect(isPressed ? 0.95 : 1.0)
            .animation(.spring(response: 0.3, dampingFraction: 0.6), value: isPressed)
        }
        .buttonStyle(PlainButtonStyle())
        .simultaneousGesture(
            DragGesture(minimumDistance: 0)
                .onChanged { _ in isPressed = true }
                .onEnded { _ in isPressed = false }
        )
    }
}

// Quick Actions Section
struct QuickActionsSection: View {
    @StateObject private var streamChatService = StreamChatService.shared
    
    var quickActions: [QuickAction] {
        [
            QuickAction(id: "chat", name: "Chat", description: "Message your community", icon: "message.fill", color: .green, badge: streamChatService.unreadCount),
            QuickAction(id: "calendar", name: "Calendar", description: "View your calendar", icon: "calendar", color: .blue, badge: nil),
            QuickAction(id: "family", name: "Family", description: "Manage family members", icon: "person.2.fill", color: .purple, badge: nil),
            QuickAction(id: "documents", name: "Documents", description: "Access your files", icon: "doc.fill", color: .orange, badge: nil)
        ]
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Quick Actions")
                .font(.system(size: 22, weight: .bold))
                .foregroundColor(.primary)
            
            LazyVGrid(columns: [
                GridItem(.flexible(), spacing: 12),
                GridItem(.flexible(), spacing: 12)
            ], spacing: 12) {
                ForEach(quickActions) { action in
                    NavigationLink(destination: destinationForAction(action.id)) {
                        QuickActionCard(action: action)
                    }
                    .buttonStyle(PlainButtonStyle())
                }
            }
        }
    }
    
    @ViewBuilder
    private func destinationForAction(_ actionId: String) -> some View {
        switch actionId {
        case "chat":
            ChatChannelListView()
        case "calendar":
            CalendarView()
        case "family":
            Text("Family Coming Soon")
                .navigationTitle("Family")
        case "documents":
            Text("Documents Coming Soon")
                .navigationTitle("Documents")
        default:
            Text("Coming Soon")
        }
    }
}

// Recent Activity Section
struct RecentActivitySection: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Recent Activity")
                .font(.system(size: 22, weight: .bold))
                .foregroundColor(.primary)
            
            VStack(spacing: 12) {
                ActivityItem(icon: "calendar", title: "No recent activity", subtitle: "Your activity will appear here")
            }
        }
    }
}

struct ActivityItem: View {
    let icon: String
    let title: String
    let subtitle: String
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 20))
                .foregroundColor(.secondary)
                .frame(width: 40, height: 40)
                .background(
                    Circle()
                        .fill(.ultraThinMaterial)
                )
            
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.system(size: 15, weight: .medium))
                    .foregroundColor(.primary)
                
                Text(subtitle)
                    .font(.system(size: 13))
                    .foregroundColor(.secondary)
            }
            
            Spacer()
        }
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(.ultraThinMaterial)
        )
    }
}

#Preview {
    NavigationView {
        UserHomeView()
    }
}

