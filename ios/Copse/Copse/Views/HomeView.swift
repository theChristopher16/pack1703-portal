//
//  HomeView.swift
//  Copse
//
//  Pack 1703 Portal iOS App - Home Screen
//  Beautiful glassmorphism design matching web app
//

import SwiftUI
import FirebaseAuth

struct HomeView: View {
    @StateObject private var firebaseService = FirebaseService.shared
    @State private var quickActions: [QuickAction] = []
    
    var body: some View {
        ZStack {
            // Gradient background matching web app
            LinearGradient(
                gradient: Gradient(colors: [
                    Color(red: 0.95, green: 0.98, blue: 0.95), // emerald-50
                    Color(red: 0.94, green: 0.97, blue: 0.96), // teal-50
                    Color(red: 0.94, green: 0.98, blue: 0.99)  // cyan-50
                ]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()
            
            ScrollView {
                VStack(spacing: 24) {
                    // Welcome Header
                    VStack(spacing: 12) {
                        Text("Welcome to Pack 1703!")
                            .font(.system(size: 32, weight: .bold))
                            .foregroundColor(.primary)
                        
                        Text("🌲 Copse Portal 🌲")
                            .font(.title2)
                            .foregroundColor(.secondary)
                        
                        if let user = firebaseService.currentUser {
                            Text("Signed in as: \(user.email ?? "Unknown")")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                                .padding(.top, 4)
                        }
                    }
                    .padding(.top, 20)
                    .padding(.horizontal)
                    
                    // Quick Actions Grid
                    LazyVGrid(columns: [
                        GridItem(.flexible(), spacing: 16),
                        GridItem(.flexible(), spacing: 16)
                    ], spacing: 16) {
                        ForEach(quickActions) { action in
                            QuickActionCard(action: action)
                        }
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
                        .font(.headline)
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(
                            LinearGradient(
                                gradient: Gradient(colors: [Color.red.opacity(0.8), Color.red.opacity(0.6)]),
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .cornerRadius(16)
                        .shadow(color: Color.red.opacity(0.3), radius: 10, x: 0, y: 5)
                    }
                    .padding(.horizontal)
                    .padding(.bottom, 30)
                }
            }
        }
        .navigationTitle("Home")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            loadQuickActions()
        }
    }
    
    private func loadQuickActions() {
        quickActions = [
            QuickAction(
                id: "events",
                name: "Events",
                description: "View upcoming pack events",
                icon: "calendar",
                color: .blue
            ),
            QuickAction(
                id: "chat",
                name: "Chat",
                description: "Connect with your den",
                icon: "message.fill",
                color: .green
            ),
            QuickAction(
                id: "calendar",
                name: "Calendar",
                description: "See what's coming up",
                icon: "calendar.badge.clock",
                color: .orange
            ),
            QuickAction(
                id: "resources",
                name: "Resources",
                description: "Access pack materials",
                icon: "folder.fill",
                color: .purple
            )
        ]
    }
}

// Quick Action Data Model
struct QuickAction: Identifiable {
    let id: String
    let name: String
    let description: String
    let icon: String
    let color: Color
    let badge: Int?
    
    init(id: String, name: String, description: String, icon: String, color: Color, badge: Int? = nil) {
        self.id = id
        self.name = name
        self.description = description
        self.icon = icon
        self.color = color
        self.badge = badge
    }
}

// Glassmorphism Card Component
struct QuickActionCard: View {
    let action: QuickAction
    @State private var isPressed = false
    
    var body: some View {
        Button(action: {
            // TODO: Navigate to action
            print("Tapped \(action.name)")
        }) {
            VStack(spacing: 16) {
                // Icon with gradient background
                ZStack(alignment: .topTrailing) {
                    RoundedRectangle(cornerRadius: 16)
                        .fill(
                            LinearGradient(
                                gradient: Gradient(colors: [
                                    action.color.opacity(0.8),
                                    action.color.opacity(0.6)
                                ]),
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 64, height: 64)
                        .shadow(color: action.color.opacity(0.4), radius: 8, x: 0, y: 4)
                    
                    Image(systemName: action.icon)
                        .font(.system(size: 28, weight: .semibold))
                        .foregroundColor(.white)
                    
                    // Badge for unread count
                    if let badge = action.badge, badge > 0 {
                        ZStack {
                            Circle()
                                .fill(Color.red)
                                .frame(width: 24, height: 24)
                            
                            Text("\(badge)")
                                .font(.system(size: 12, weight: .bold))
                                .foregroundColor(.white)
                        }
                        .offset(x: 8, y: -8)
                    }
                }
                
                // Title
                Text(action.name)
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundColor(.primary)
                
                // Description
                Text(action.description)
                    .font(.system(size: 13))
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .lineLimit(2)
                
                // Get Started indicator
                HStack(spacing: 4) {
                    Text("Get Started")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(action.color)
                    
                    Image(systemName: "arrow.right")
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundColor(action.color)
                }
                .padding(.top, 4)
            }
            .padding(20)
            .frame(maxWidth: .infinity)
            .background(
                // Glassmorphism effect
                ZStack {
                    // Blur background
                    RoundedRectangle(cornerRadius: 20)
                        .fill(.ultraThinMaterial)
                    
                    // Subtle border
                    RoundedRectangle(cornerRadius: 20)
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
            .shadow(color: Color.black.opacity(0.1), radius: 10, x: 0, y: 5)
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

#Preview {
    NavigationView {
        HomeView()
    }
}

