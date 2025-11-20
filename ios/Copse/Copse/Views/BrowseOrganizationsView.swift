//
//  BrowseOrganizationsView.swift
//  Copse
//
//  Browse and join available organizations (Copses)
//

import SwiftUI
import FirebaseFirestore

struct BrowseOrganizationsView: View {
    @Environment(\.dismiss) var dismiss
    @StateObject private var firebaseService = FirebaseService.shared
    @State private var organizations: [OrganizationDetail] = []
    @State private var filteredOrganizations: [OrganizationDetail] = []
    @State private var isLoading = true
    @State private var searchText = ""
    @State private var selectedCategory: OrganizationCategory = .all
    
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
                        Button(action: {
                            dismiss()
                        }) {
                            Image(systemName: "chevron.left")
                                .font(.system(size: 18, weight: .semibold))
                                .foregroundColor(.primary)
                        }
                        
                        Text("Browse Copses")
                            .font(.system(size: 28, weight: .bold))
                            .foregroundColor(.primary)
                        
                        Spacer()
                    }
                    .padding(.horizontal)
                    .padding(.top, 8)
                    
                    // Search Bar
                    HStack {
                        Image(systemName: "magnifyingglass")
                            .foregroundColor(.secondary)
                        
                        TextField("Search organizations...", text: $searchText)
                            .textFieldStyle(PlainTextFieldStyle())
                    }
                    .padding(12)
                    .background(
                        RoundedRectangle(cornerRadius: 12)
                            .fill(.ultraThinMaterial)
                    )
                    .padding(.horizontal)
                    
                    // Category Filter
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 12) {
                            ForEach(OrganizationCategory.allCases, id: \.self) { category in
                                CategoryChip(
                                    category: category,
                                    isSelected: selectedCategory == category
                                ) {
                                    withAnimation(.spring(response: 0.3)) {
                                        selectedCategory = category
                                    }
                                }
                            }
                        }
                        .padding(.horizontal)
                    }
                    .padding(.vertical, 8)
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
                
                // Organizations List
                if isLoading {
                    VStack(spacing: 20) {
                        ProgressView()
                            .scaleEffect(1.2)
                        Text("Loading organizations...")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if filteredOrganizations.isEmpty {
                    VStack(spacing: 16) {
                        Image(systemName: "building.2.fill")
                            .font(.system(size: 48))
                            .foregroundColor(.secondary.opacity(0.5))
                        
                        Text("No organizations found")
                            .font(.headline)
                            .foregroundColor(.primary)
                        
                        Text("Try adjusting your search or filters")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .padding()
                } else {
                    ScrollView {
                        LazyVStack(spacing: 16) {
                            ForEach(filteredOrganizations) { org in
                                OrganizationDetailCard(organization: org)
                            }
                        }
                        .padding()
                    }
                }
            }
        }
        .navigationBarHidden(true)
        .onAppear {
            loadOrganizations()
        }
        .onChange(of: searchText) { _ in
            filterOrganizations()
        }
        .onChange(of: selectedCategory) { _ in
            filterOrganizations()
        }
    }
    
    private func loadOrganizations() {
        // TODO: Fetch from Firestore
        // For now, mock data
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            organizations = [
                OrganizationDetail(
                    id: "pack1703",
                    name: "Pack 1703",
                    slug: "pack1703",
                    description: "A vibrant scout pack focused on outdoor adventures, community service, and building character. Join us for camping trips, hikes, and meaningful experiences.",
                    category: .scout,
                    icon: "leaf.fill",
                    color: .green,
                    memberCount: 45,
                    isActive: true,
                    enabledComponents: ["chat", "calendar", "events", "resources"]
                ),
                OrganizationDetail(
                    id: "smith-station",
                    name: "Smith Station",
                    slug: "smith-station",
                    description: "A community organization bringing neighbors together through events, shared resources, and collaborative projects.",
                    category: .community,
                    icon: "house.fill",
                    color: .blue,
                    memberCount: 120,
                    isActive: true,
                    enabledComponents: ["chat", "calendar", "announcements"]
                ),
                OrganizationDetail(
                    id: "green-valley-school",
                    name: "Green Valley School",
                    slug: "green-valley-school",
                    description: "Parent-teacher organization supporting educational initiatives and school community events.",
                    category: .school,
                    icon: "book.fill",
                    color: .purple,
                    memberCount: 200,
                    isActive: true,
                    enabledComponents: ["chat", "calendar", "resources", "announcements"]
                ),
                OrganizationDetail(
                    id: "adventure-club",
                    name: "Adventure Club",
                    slug: "adventure-club",
                    description: "For outdoor enthusiasts who love hiking, camping, and exploring nature. Regular group outings and gear sharing.",
                    category: .recreation,
                    icon: "mountain.2.fill",
                    color: .orange,
                    memberCount: 35,
                    isActive: true,
                    enabledComponents: ["chat", "calendar", "events"]
                )
            ]
            filterOrganizations()
            isLoading = false
        }
    }
    
    private func filterOrganizations() {
        var filtered = organizations
        
        // Filter by category
        if selectedCategory != .all {
            filtered = filtered.filter { $0.category == selectedCategory }
        }
        
        // Filter by search text
        if !searchText.isEmpty {
            filtered = filtered.filter { org in
                org.name.localizedCaseInsensitiveContains(searchText) ||
                org.description.localizedCaseInsensitiveContains(searchText)
            }
        }
        
        filteredOrganizations = filtered
    }
}

enum OrganizationCategory: String, CaseIterable {
    case all = "All"
    case scout = "Scout Packs"
    case school = "Schools"
    case community = "Community"
    case recreation = "Recreation"
    
    var icon: String {
        switch self {
        case .all: return "square.grid.2x2"
        case .scout: return "leaf.fill"
        case .school: return "book.fill"
        case .community: return "house.fill"
        case .recreation: return "figure.run"
        }
    }
}

struct CategoryChip: View {
    let category: OrganizationCategory
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 6) {
                Image(systemName: category.icon)
                    .font(.system(size: 12))
                
                Text(category.rawValue)
                    .font(.system(size: 14, weight: isSelected ? .semibold : .regular))
            }
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
                            .shadow(color: Color.green.opacity(0.3), radius: 6, x: 0, y: 3)
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

struct OrganizationDetail: Identifiable {
    let id: String
    let name: String
    let slug: String
    let description: String
    let category: OrganizationCategory
    let icon: String
    let color: Color
    let memberCount: Int
    let isActive: Bool
    let enabledComponents: [String]
}

struct OrganizationDetailCard: View {
    let organization: OrganizationDetail
    @State private var isPressed = false
    @State private var showJoinConfirmation = false
    
    var body: some View {
        Button(action: {
            showJoinConfirmation = true
        }) {
            VStack(alignment: .leading, spacing: 16) {
                HStack(spacing: 16) {
                    // Icon
                    ZStack {
                        RoundedRectangle(cornerRadius: 16)
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
                            .frame(width: 60, height: 60)
                            .shadow(color: organization.color.opacity(0.3), radius: 8, x: 0, y: 4)
                        
                        Image(systemName: organization.icon)
                            .font(.system(size: 28, weight: .semibold))
                            .foregroundColor(.white)
                    }
                    
                    VStack(alignment: .leading, spacing: 6) {
                        Text(organization.name)
                            .font(.system(size: 20, weight: .bold))
                            .foregroundColor(.primary)
                        
                        HStack(spacing: 8) {
                            Label("\(organization.memberCount)", systemImage: "person.2.fill")
                                .font(.system(size: 13))
                                .foregroundColor(.secondary)
                            
                            Text("•")
                                .foregroundColor(.secondary)
                            
                            Text(organization.category.rawValue)
                                .font(.system(size: 13))
                                .foregroundColor(.secondary)
                        }
                    }
                    
                    Spacer()
                    
                    Image(systemName: "chevron.right")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(.secondary)
                }
                
                // Description
                Text(organization.description)
                    .font(.system(size: 14))
                    .foregroundColor(.secondary)
                    .lineLimit(3)
                    .multilineTextAlignment(.leading)
                
                // Features
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(organization.enabledComponents.prefix(4), id: \.self) { component in
                            FeatureBadge(name: component.capitalized)
                        }
                    }
                }
                
                // Join Button
                HStack {
                    Spacer()
                    
                    HStack(spacing: 6) {
                        Image(systemName: "plus.circle.fill")
                            .font(.system(size: 14, weight: .semibold))
                        Text("Join Copse")
                            .font(.system(size: 15, weight: .semibold))
                    }
                    .foregroundColor(.white)
                    .padding(.horizontal, 20)
                    .padding(.vertical, 10)
                    .background(
                        Capsule()
                            .fill(
                                LinearGradient(
                                    gradient: Gradient(colors: [
                                        organization.color.opacity(0.8),
                                        organization.color.opacity(0.6)
                                    ]),
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .shadow(color: organization.color.opacity(0.3), radius: 8, x: 0, y: 4)
                    )
                    
                    Spacer()
                }
            }
            .padding(20)
            .background(
                ZStack {
                    RoundedRectangle(cornerRadius: 20)
                        .fill(.ultraThinMaterial)
                    
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
            .shadow(color: Color.black.opacity(0.1), radius: 12, x: 0, y: 6)
            .scaleEffect(isPressed ? 0.98 : 1.0)
            .animation(.spring(response: 0.3, dampingFraction: 0.6), value: isPressed)
        }
        .buttonStyle(PlainButtonStyle())
        .simultaneousGesture(
            DragGesture(minimumDistance: 0)
                .onChanged { _ in isPressed = true }
                .onEnded { _ in isPressed = false }
        )
        .sheet(isPresented: $showJoinConfirmation) {
            JoinOrganizationSheet(organization: organization)
        }
    }
}

struct FeatureBadge: View {
    let name: String
    
    var body: some View {
        Text(name)
            .font(.system(size: 11, weight: .medium))
            .foregroundColor(.secondary)
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(
                Capsule()
                    .fill(.ultraThinMaterial)
            )
    }
}

struct JoinOrganizationSheet: View {
    let organization: OrganizationDetail
    @Environment(\.dismiss) var dismiss
    @State private var isJoining = false
    @State private var joinError: String?
    
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
                    // Icon
                    ZStack {
                        Circle()
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
                            .frame(width: 100, height: 100)
                            .shadow(color: organization.color.opacity(0.3), radius: 12, x: 0, y: 6)
                        
                        Image(systemName: organization.icon)
                            .font(.system(size: 48, weight: .semibold))
                            .foregroundColor(.white)
                    }
                    .padding(.top, 40)
                    
                    // Title
                    Text("Join \(organization.name)?")
                        .font(.system(size: 28, weight: .bold))
                        .foregroundColor(.primary)
                    
                    // Description
                    Text(organization.description)
                        .font(.system(size: 16))
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)
                    
                    // Features
                    VStack(alignment: .leading, spacing: 12) {
                        Text("What you'll get:")
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundColor(.primary)
                        
                        ForEach(organization.enabledComponents, id: \.self) { component in
                            HStack(spacing: 12) {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundColor(organization.color)
                                
                                Text(component.capitalized)
                                    .font(.system(size: 15))
                                    .foregroundColor(.primary)
                                
                                Spacer()
                            }
                        }
                    }
                    .padding()
                    .background(
                        RoundedRectangle(cornerRadius: 16)
                            .fill(.ultraThinMaterial)
                    )
                    .padding(.horizontal)
                    
                    Spacer()
                    
                    // Error message
                    if let error = joinError {
                        Text(error)
                            .font(.system(size: 14))
                            .foregroundColor(.red)
                            .padding()
                    }
                    
                    // Join Button
                    Button(action: {
                        joinOrganization()
                    }) {
                        HStack {
                            if isJoining {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                            } else {
                                Image(systemName: "plus.circle.fill")
                                Text("Join Copse")
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
                                            organization.color.opacity(0.8),
                                            organization.color.opacity(0.6)
                                        ]),
                                        startPoint: .leading,
                                        endPoint: .trailing
                                    )
                                )
                                .shadow(color: organization.color.opacity(0.3), radius: 10, x: 0, y: 5)
                        )
                    }
                    .disabled(isJoining)
                    .padding(.horizontal)
                    .padding(.bottom, 30)
                }
            }
            .navigationTitle("Join Organization")
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
    
    private func joinOrganization() {
        isJoining = true
        joinError = nil
        
        // TODO: Implement actual join logic via Firebase
        // This would call a Cloud Function or update Firestore
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            isJoining = false
            // For now, just dismiss - in real implementation, would update user's organizations
            dismiss()
        }
    }
}

#Preview {
    BrowseOrganizationsView()
}

