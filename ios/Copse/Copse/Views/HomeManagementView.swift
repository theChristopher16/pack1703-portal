//
//  HomeManagementView.swift
//  Copse
//
//  Main home management interface with all features
//  Matches web app HomeManagement component
//

import SwiftUI

struct HomeManagementView: View {
    @StateObject private var homeService = HomeService.shared
    @State private var selectedCategory: HomeCategory = .overview
    
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
                
                if !homeService.hasCompletedSetup {
                    // Show setup prompt
                    SetupPromptView()
                } else if let household = homeService.currentHousehold {
                    // Show home management
                    VStack(spacing: 0) {
                        // Header
                        HomeHeaderView(household: household)
                        
                        // Category selector
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 12) {
                                ForEach(HomeCategory.allCases, id: \.self) { category in
                                    HomeCategoryChip(
                                        category: category,
                                        isSelected: selectedCategory == category
                                    ) {
                                        withAnimation {
                                            selectedCategory = category
                                        }
                                    }
                                }
                            }
                            .padding(.horizontal)
                        }
                        .padding(.vertical, 12)
                        
                        // Content
                        ScrollView {
                            categoryContent(for: selectedCategory, household: household)
                                .padding()
                        }
                    }
                } else {
                    // Loading
                    ProgressView("Loading home...")
                }
            }
            .navigationBarHidden(true)
        }
    }
    
    @ViewBuilder
    private func categoryContent(for category: HomeCategory, household: SharedHousehold) -> some View {
        switch category {
        case .overview:
            HomeOverviewView(household: household)
        case .members:
            HouseholdMembersView(household: household)
        case .children:
            ChildrenManagementView(household: household)
        case .pets:
            PetsManagementView(household: household)
        case .vehicles:
            VehiclesManagementView(household: household)
        case .rooms:
            RoomsManagementView(household: household)
        case .settings:
            HomeSettingsView(household: household)
        }
    }
}

// MARK: - Home Categories

enum HomeCategory: String, CaseIterable {
    case overview = "Overview"
    case members = "Members"
    case children = "Children"
    case pets = "Pets"
    case vehicles = "Vehicles"
    case rooms = "Rooms"
    case settings = "Settings"
    
    var icon: String {
        switch self {
        case .overview: return "house.fill"
        case .members: return "person.2.fill"
        case .children: return "figure.and.child.holdinghands"
        case .pets: return "pawprint.fill"
        case .vehicles: return "car.fill"
        case .rooms: return "door.left.hand.open"
        case .settings: return "gearshape.fill"
        }
    }
}

// MARK: - Home Category Chip

struct HomeCategoryChip: View {
    let category: HomeCategory
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

// MARK: - Setup Prompt View

struct SetupPromptView: View {
    var body: some View {
        VStack(spacing: 32) {
            VStack(spacing: 16) {
                Image(systemName: "house.circle.fill")
                    .font(.system(size: 100))
                    .foregroundStyle(
                        LinearGradient(
                            gradient: Gradient(colors: [Color.green.opacity(0.8), Color.teal.opacity(0.8)]),
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                
                Text("Welcome to Home")
                    .font(.system(size: 32, weight: .bold))
                    .foregroundColor(.primary)
                
                Text("Your household operating system.\nLet's get you set up!")
                    .font(.system(size: 18))
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
            
            Text("Tap here to set up your home →")
                .font(.system(size: 16))
                .foregroundColor(.secondary)
                .padding(.top, 20)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - Home Header

struct HomeHeaderView: View {
    let household: SharedHousehold
    
    var body: some View {
        VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(household.name)
                        .font(.system(size: 28, weight: .bold))
                        .foregroundColor(.primary)
                    
                    Text("\(household.memberIds.count) members")
                        .font(.system(size: 15))
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                Button(action: {
                    // TODO: Show home switcher
                }) {
                    Image(systemName: "arrow.left.arrow.right.circle.fill")
                        .font(.system(size: 28))
                        .foregroundColor(.primary)
                }
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
    }
}

#Preview {
    HomeManagementView()
}

