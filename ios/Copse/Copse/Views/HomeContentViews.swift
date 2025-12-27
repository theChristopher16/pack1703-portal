//
//  HomeContentViews.swift
//  Copse
//
//  Content views for home management categories
//  Beautiful glassmorphism cards for each feature
//

import SwiftUI

// MARK: - Home Overview

struct HomeOverviewView: View {
    let household: SharedHousehold
    
    var body: some View {
        LazyVStack(spacing: 16) {
            // Quick Stats
            StatsSection(household: household)
            
            // Quick Actions
            QuickActionsGrid(household: household)
        }
    }
}

struct StatsSection: View {
    let household: SharedHousehold
    
    // Calculate room statistics
    private var roomStats: (bedrooms: Int, bathrooms: Int, total: Int) {
        let bedrooms = household.rooms.filter { $0.type == .bedroom }.count
        let bathrooms = household.rooms.filter { $0.type == .bathroom }.count
        return (bedrooms, bathrooms, household.rooms.count)
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Home Overview")
                .font(.system(size: 22, weight: .bold))
                .foregroundColor(.primary)
            
            // Home name and address
            if !household.name.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Image(systemName: "house.fill")
                            .foregroundColor(.green)
                        Text(household.name)
                            .font(.system(size: 20, weight: .semibold))
                            .foregroundColor(.primary)
                    }
                    
                    if let address = household.address, !address.isEmpty {
                        HStack {
                            Image(systemName: "mappin.circle.fill")
                                .foregroundColor(.secondary)
                            Text(address)
                                .font(.system(size: 14))
                                .foregroundColor(.secondary)
                        }
                    }
                }
                .padding()
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(
                    RoundedRectangle(cornerRadius: 16)
                        .fill(.ultraThinMaterial)
                        .shadow(color: Color.green.opacity(0.1), radius: 8, x: 0, y: 4)
                )
            }
            
            // Room statistics
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 12) {
                StatCard(icon: "bed.double.fill", title: "Bedrooms", value: "\(roomStats.bedrooms)", color: .purple)
                StatCard(icon: "shower.fill", title: "Bathrooms", value: "\(roomStats.bathrooms)", color: .blue)
                StatCard(icon: "door.left.hand.open", title: "Total Rooms", value: "\(roomStats.total)", color: .green)
            }
            
            // Additional stats
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 12) {
                StatCard(icon: "person.2.fill", title: "Members", value: "\(household.memberIds.count)", color: .blue)
                StatCard(icon: "figure.and.child.holdinghands", title: "Children", value: "\(household.children.count)", color: .pink)
                StatCard(icon: "pawprint.fill", title: "Pets", value: "\(household.pets.count)", color: .orange)
                StatCard(icon: "car.fill", title: "Vehicles", value: "\(household.vehicles.count)", color: .cyan)
            }
        }
    }
}

struct StatCard: View {
    let icon: String
    let title: String
    let value: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 12) {
            ZStack {
                RoundedRectangle(cornerRadius: 12)
                    .fill(
                        LinearGradient(
                            gradient: Gradient(colors: [color.opacity(0.8), color.opacity(0.6)]),
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 50, height: 50)
                
                Image(systemName: icon)
                    .font(.system(size: 24))
                    .foregroundColor(.white)
            }
            
            Text(value)
                .font(.system(size: 24, weight: .bold))
                .foregroundColor(.primary)
            
            Text(title)
                .font(.system(size: 14))
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(.ultraThinMaterial)
                .shadow(color: color.opacity(0.1), radius: 8, x: 0, y: 4)
        )
    }
}

struct QuickActionsGrid: View {
    let household: SharedHousehold
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Quick Actions")
                .font(.system(size: 22, weight: .bold))
                .foregroundColor(.primary)
            
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 12) {
                if household.preferences.mealPlanner {
                    HomeQuickActionCard(icon: "calendar", title: "Meal Planner", color: .orange)
                }
                if household.preferences.tasks {
                    HomeQuickActionCard(icon: "checkmark.square", title: "Tasks", color: .green)
                }
                if household.preferences.groceries {
                    HomeQuickActionCard(icon: "cart.fill", title: "Groceries", color: .blue)
                }
                if household.preferences.recipes {
                    HomeQuickActionCard(icon: "book.fill", title: "Recipes", color: .purple)
                }
            }
        }
    }
}

struct HomeQuickActionCard: View {
    let icon: String
    let title: String
    let color: Color
    @State private var isPressed = false
    
    var body: some View {
        Button(action: {}) {
            VStack(spacing: 12) {
                ZStack {
                    RoundedRectangle(cornerRadius: 12)
                        .fill(
                            LinearGradient(
                                gradient: Gradient(colors: [color.opacity(0.8), color.opacity(0.6)]),
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 50, height: 50)
                    
                    Image(systemName: icon)
                        .font(.system(size: 24))
                        .foregroundColor(.white)
                }
                
                Text(title)
                    .font(.system(size: 15, weight: .medium))
                    .foregroundColor(.primary)
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(.ultraThinMaterial)
                    .shadow(color: color.opacity(0.1), radius: 8, x: 0, y: 4)
            )
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

// MARK: - Household Members

struct HouseholdMembersView: View {
    let household: SharedHousehold
    @StateObject private var homeService = HomeService.shared
    @State private var showInviteSheet = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Household Members")
                    .font(.system(size: 22, weight: .bold))
                    .foregroundColor(.primary)
                
                Spacer()
                
                Button(action: { showInviteSheet = true }) {
                    Image(systemName: "person.badge.plus.fill")
                        .font(.system(size: 20))
                        .foregroundColor(.green)
                }
            }
            
            VStack(spacing: 12) {
                ForEach(household.ownerIds, id: \.self) { memberId in
                    MemberCard(memberId: memberId, role: .owner)
                }
                
                ForEach(household.memberIds.filter { !household.ownerIds.contains($0) }, id: \.self) { memberId in
                    MemberCard(memberId: memberId, role: .member)
                }
            }
        }
        .sheet(isPresented: $showInviteSheet) {
            InviteMemberSheet(householdId: household.id)
        }
    }
}

struct MemberCard: View {
    let memberId: String
    let role: HomeRole
    @State private var memberName = "Loading..."
    
    var body: some View {
        HStack(spacing: 16) {
            ZStack {
                Circle()
                    .fill(
                        LinearGradient(
                            gradient: Gradient(colors: [Color.blue.opacity(0.8), Color.purple.opacity(0.6)]),
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 50, height: 50)
                
                Text(memberName.prefix(1))
                    .font(.system(size: 20, weight: .bold))
                    .foregroundColor(.white)
            }
            
            VStack(alignment: .leading, spacing: 4) {
                Text(memberName)
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundColor(.primary)
                
                Text(role == .owner ? "👑 Owner" : "Member")
                    .font(.system(size: 14))
                    .foregroundColor(.secondary)
            }
            
            Spacer()
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(.ultraThinMaterial)
                .shadow(color: Color.black.opacity(0.05), radius: 6, x: 0, y: 3)
        )
        .onAppear {
            // TODO: Load member name from Firestore
            memberName = memberId.prefix(8).description
        }
    }
}

// MARK: - Children Management

struct ChildrenManagementView: View {
    let household: SharedHousehold
    @State private var showAddChild = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Children")
                    .font(.system(size: 22, weight: .bold))
                    .foregroundColor(.primary)
                
                Spacer()
                
                Button(action: { showAddChild = true }) {
                    Image(systemName: "plus.circle.fill")
                        .font(.system(size: 20))
                        .foregroundColor(.pink)
                }
            }
            
            if household.children.isEmpty {
                EmptyStateView(
                    icon: "figure.and.child.holdinghands",
                    title: "No children added",
                    message: "Add children to assign chores and manage their schedules",
                    color: .pink
                )
            } else {
                VStack(spacing: 12) {
                    ForEach(household.children) { child in
                        ChildCard(child: child)
                    }
                }
            }
        }
        .sheet(isPresented: $showAddChild) {
            AddChildSheet(householdId: household.id)
        }
    }
}

struct ChildCard: View {
    let child: ChildProfile
    
    var body: some View {
        HStack(spacing: 16) {
            ZStack {
                Circle()
                    .fill(
                        LinearGradient(
                            gradient: Gradient(colors: [Color.pink.opacity(0.8), Color.purple.opacity(0.6)]),
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 50, height: 50)
                
                Image(systemName: "figure.child")
                    .font(.system(size: 24))
                    .foregroundColor(.white)
            }
            
            VStack(alignment: .leading, spacing: 4) {
                Text(child.name)
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundColor(.primary)
                
                if let age = child.age {
                    Text("Age \(age)")
                        .font(.system(size: 14))
                        .foregroundColor(.secondary)
                }
            }
            
            Spacer()
            
            Image(systemName: "chevron.right")
                .font(.system(size: 14))
                .foregroundColor(.secondary)
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(.ultraThinMaterial)
                .shadow(color: Color.pink.opacity(0.1), radius: 6, x: 0, y: 3)
        )
    }
}

// MARK: - Pets Management

struct PetsManagementView: View {
    let household: SharedHousehold
    @State private var showAddPet = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Pets")
                    .font(.system(size: 22, weight: .bold))
                    .foregroundColor(.primary)
                
                Spacer()
                
                Button(action: { showAddPet = true }) {
                    Image(systemName: "plus.circle.fill")
                        .font(.system(size: 20))
                        .foregroundColor(.orange)
                }
            }
            
            if household.pets.isEmpty {
                EmptyStateView(
                    icon: "pawprint.fill",
                    title: "No pets added",
                    message: "Add your pets to track vet appointments and medications",
                    color: .orange
                )
            } else {
                VStack(spacing: 12) {
                    ForEach(household.pets) { pet in
                        PetCard(pet: pet)
                    }
                }
            }
        }
        .sheet(isPresented: $showAddPet) {
            AddPetSheet(householdId: household.id)
        }
    }
}

struct PetCard: View {
    let pet: PetProfile
    
    var body: some View {
        HStack(spacing: 16) {
            ZStack {
                Circle()
                    .fill(
                        LinearGradient(
                            gradient: Gradient(colors: [Color.orange.opacity(0.8), Color.yellow.opacity(0.6)]),
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 50, height: 50)
                
                Image(systemName: "pawprint.fill")
                    .font(.system(size: 24))
                    .foregroundColor(.white)
            }
            
            VStack(alignment: .leading, spacing: 4) {
                Text(pet.name)
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundColor(.primary)
                
                Text(pet.species.capitalized)
                    .font(.system(size: 14))
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            Image(systemName: "chevron.right")
                .font(.system(size: 14))
                .foregroundColor(.secondary)
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(.ultraThinMaterial)
                .shadow(color: Color.orange.opacity(0.1), radius: 6, x: 0, y: 3)
        )
    }
}

// MARK: - Vehicles Management

struct VehiclesManagementView: View {
    let household: SharedHousehold
    @State private var showAddVehicle = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Vehicles")
                    .font(.system(size: 22, weight: .bold))
                    .foregroundColor(.primary)
                
                Spacer()
                
                Button(action: { showAddVehicle = true }) {
                    Image(systemName: "plus.circle.fill")
                        .font(.system(size: 20))
                        .foregroundColor(.blue)
                }
            }
            
            if household.vehicles.isEmpty {
                EmptyStateView(
                    icon: "car.fill",
                    title: "No vehicles added",
                    message: "Add your vehicles to track maintenance and mileage",
                    color: .blue
                )
            } else {
                VStack(spacing: 12) {
                    ForEach(household.vehicles) { vehicle in
                        VehicleCard(vehicle: vehicle)
                    }
                }
            }
        }
        .sheet(isPresented: $showAddVehicle) {
            AddVehicleSheet(householdId: household.id)
        }
    }
}

struct VehicleCard: View {
    let vehicle: VehicleProfile
    
    var body: some View {
        HStack(spacing: 16) {
            ZStack {
                RoundedRectangle(cornerRadius: 12)
                    .fill(
                        LinearGradient(
                            gradient: Gradient(colors: [Color.blue.opacity(0.8), Color.cyan.opacity(0.6)]),
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 50, height: 50)
                
                Image(systemName: "car.fill")
                    .font(.system(size: 24))
                    .foregroundColor(.white)
            }
            
            VStack(alignment: .leading, spacing: 4) {
                Text("\(vehicle.year) \(vehicle.make) \(vehicle.model)")
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundColor(.primary)
                
                if let mileage = vehicle.mileage {
                    Text("\(mileage) miles")
                        .font(.system(size: 14))
                        .foregroundColor(.secondary)
                }
            }
            
            Spacer()
            
            Image(systemName: "chevron.right")
                .font(.system(size: 14))
                .foregroundColor(.secondary)
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(.ultraThinMaterial)
                .shadow(color: Color.blue.opacity(0.1), radius: 6, x: 0, y: 3)
        )
    }
}

// MARK: - Rooms Management

struct RoomsManagementView: View {
    let household: SharedHousehold
    @State private var showAddRoom = false
    
    // Group rooms by type
    private var roomsByType: [RoomType: [Room]] {
        Dictionary(grouping: household.rooms, by: { $0.type })
    }
    
    // Room type order for display
    private let roomTypeOrder: [RoomType] = [.bedroom, .bathroom, .livingRoom, .kitchen, .diningRoom, .garage, .office, .basement, .attic, .other]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 24) {
            HStack {
                Text("Rooms & Spaces")
                    .font(.system(size: 22, weight: .bold))
                    .foregroundColor(.primary)
                
                Spacer()
                
                Button(action: { showAddRoom = true }) {
                    Image(systemName: "plus.circle.fill")
                        .font(.system(size: 20))
                        .foregroundColor(.purple)
                }
            }
            
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    // Display rooms grouped by type
                    ForEach(roomTypeOrder.filter { roomsByType[$0] != nil }, id: \.self) { roomType in
                        if let rooms = roomsByType[roomType], !rooms.isEmpty {
                            RoomTypeSection(roomType: roomType, rooms: rooms)
                        }
                    }
                }
            }
        }
        .sheet(isPresented: $showAddRoom) {
            Text("Add Room - Coming Soon")
        }
    }
}

struct RoomTypeSection: View {
    let roomType: RoomType
    let rooms: [Room]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Section header
            HStack {
                Image(systemName: roomType.icon)
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundColor(colorForRoomType(roomType))
                
                Text(roomType.rawValue)
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundColor(.primary)
                
                Text("(\(rooms.count))")
                    .font(.system(size: 16, weight: .regular))
                    .foregroundColor(.secondary)
                
                Spacer()
            }
            .padding(.horizontal, 4)
            
            // Room cards in grid
            LazyVGrid(columns: [
                GridItem(.flexible(), spacing: 12),
                GridItem(.flexible(), spacing: 12)
            ], spacing: 12) {
                ForEach(rooms) { room in
                    RoomCard(room: room, roomType: roomType)
                }
            }
        }
    }
    
    private func colorForRoomType(_ type: RoomType) -> Color {
        switch type {
        case .bedroom: return .purple
        case .bathroom: return .blue
        case .livingRoom: return .orange
        case .kitchen: return .red
        case .diningRoom: return .yellow
        case .garage: return .gray
        case .office: return .indigo
        case .basement: return .brown
        case .attic: return .pink
        case .other: return .secondary
        }
    }
}

struct RoomCard: View {
    let room: Room
    let roomType: RoomType
    @State private var isPressed = false
    
    private var roomColor: Color {
        switch roomType {
        case .bedroom: return .purple
        case .bathroom: return .blue
        case .livingRoom: return .orange
        case .kitchen: return .red
        case .diningRoom: return .yellow
        case .garage: return .gray
        case .office: return .indigo
        case .basement: return .brown
        case .attic: return .pink
        case .other: return .secondary
        }
    }
    
    var body: some View {
        Button(action: {
            // TODO: Navigate to room detail view
            print("Tapped \(room.name)")
        }) {
            VStack(spacing: 12) {
                ZStack {
                    RoundedRectangle(cornerRadius: 12)
                        .fill(
                            LinearGradient(
                                gradient: Gradient(colors: [roomColor.opacity(0.8), roomColor.opacity(0.6)]),
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 50, height: 50)
                        .shadow(color: roomColor.opacity(0.3), radius: 4, x: 0, y: 2)
                    
                    Image(systemName: room.icon)
                        .font(.system(size: 24, weight: .semibold))
                        .foregroundColor(.white)
                }
                
                Text(room.name)
                    .font(.system(size: 15, weight: .medium))
                    .foregroundColor(.primary)
                    .lineLimit(2)
                    .multilineTextAlignment(.center)
                    .fixedSize(horizontal: false, vertical: true)
                
                // Show last cleaned if available
                if let lastCleaned = room.lastCleaned {
                    HStack(spacing: 4) {
                        Image(systemName: "sparkles")
                            .font(.system(size: 10))
                            .foregroundColor(.secondary)
                        Text(lastCleaned, style: .relative)
                            .font(.system(size: 11))
                            .foregroundColor(.secondary)
                    }
                }
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(.ultraThinMaterial)
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(
                                LinearGradient(
                                    gradient: Gradient(colors: [
                                        roomColor.opacity(0.3),
                                        roomColor.opacity(0.1)
                                    ]),
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                ),
                                lineWidth: 1
                            )
                    )
                    .shadow(color: roomColor.opacity(0.1), radius: 8, x: 0, y: 4)
            )
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

// MARK: - Home Settings

struct HomeSettingsView: View {
    let household: SharedHousehold
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Home Settings")
                .font(.system(size: 22, weight: .bold))
                .foregroundColor(.primary)
            
            VStack(spacing: 12) {
                SettingRow(icon: "bell.fill", title: "Notifications", value: "All", color: .orange)
                SettingRow(icon: "lock.fill", title: "Privacy", value: "Members Only", color: .blue)
                SettingRow(icon: "paintbrush.fill", title: "Customize", value: "Edit", color: .purple)
            }
        }
    }
}

struct SettingRow: View {
    let icon: String
    let title: String
    let value: String
    let color: Color
    
    var body: some View {
        HStack(spacing: 16) {
            ZStack {
                RoundedRectangle(cornerRadius: 12)
                    .fill(
                        LinearGradient(
                            gradient: Gradient(colors: [color.opacity(0.8), color.opacity(0.6)]),
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
            
            Text(value)
                .font(.system(size: 15))
                .foregroundColor(.secondary)
            
            Image(systemName: "chevron.right")
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(.secondary)
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(.ultraThinMaterial)
                .shadow(color: color.opacity(0.05), radius: 6, x: 0, y: 3)
        )
    }
}

// MARK: - Empty State

struct EmptyStateView: View {
    let icon: String
    let title: String
    let message: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: icon)
                .font(.system(size: 60))
                .foregroundColor(color.opacity(0.5))
            
            Text(title)
                .font(.system(size: 18, weight: .semibold))
                .foregroundColor(.primary)
            
            Text(message)
                .font(.system(size: 15))
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 60)
    }
}

// MARK: - Placeholder Add Sheets

struct InviteMemberSheet: View {
    let householdId: String
    @Environment(\.dismiss) var dismiss
    @State private var email = ""
    
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
                    TextField("Email Address", text: $email)
                        .textFieldStyle(.plain)
                        .font(.system(size: 17))
                        .padding()
                        .background(
                            RoundedRectangle(cornerRadius: 12)
                                .fill(.ultraThinMaterial)
                        )
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)
                    
                    Button(action: {
                        Task {
                            try? await HomeService.shared.inviteUserToHome(
                                householdId: householdId,
                                email: email,
                                role: .admin
                            )
                            dismiss()
                        }
                    }) {
                        Text("Send Invitation")
                            .font(.system(size: 17, weight: .semibold))
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(
                                Capsule()
                                    .fill(
                                        LinearGradient(
                                            gradient: Gradient(colors: [Color.green.opacity(0.8), Color.teal.opacity(0.8)]),
                                            startPoint: .leading,
                                            endPoint: .trailing
                                        )
                                    )
                            )
                    }
                    .disabled(email.isEmpty)
                    
                    Spacer()
                }
                .padding()
            }
            .navigationTitle("Invite Member")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }
}

struct AddChildSheet: View {
    let householdId: String
    @Environment(\.dismiss) var dismiss
    @State private var name = ""
    @State private var age: Int?
    
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
                    TextField("Child's Name", text: $name)
                        .textFieldStyle(.plain)
                        .font(.system(size: 17))
                        .padding()
                        .background(
                            RoundedRectangle(cornerRadius: 12)
                                .fill(.ultraThinMaterial)
                        )
                    
                    TextField("Age", value: $age, format: .number)
                        .textFieldStyle(.plain)
                        .font(.system(size: 17))
                        .padding()
                        .background(
                            RoundedRectangle(cornerRadius: 12)
                                .fill(.ultraThinMaterial)
                        )
                        .keyboardType(.numberPad)
                    
                    Button(action: {
                        let child = ChildProfile(
                            id: UUID().uuidString,
                            name: name,
                            age: age,
                            grade: nil,
                            school: nil,
                            allergies: [],
                            medications: [],
                            notes: nil,
                            photoURL: nil,
                            createdAt: Date(),
                            updatedAt: Date()
                        )
                        
                        Task {
                            try? await HomeService.shared.addChild(householdId: householdId, child: child)
                            dismiss()
                        }
                    }) {
                        Text("Add Child")
                            .font(.system(size: 17, weight: .semibold))
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(
                                Capsule()
                                    .fill(
                                        LinearGradient(
                                            gradient: Gradient(colors: [Color.pink.opacity(0.8), Color.purple.opacity(0.6)]),
                                            startPoint: .leading,
                                            endPoint: .trailing
                                        )
                                    )
                            )
                    }
                    .disabled(name.isEmpty)
                    
                    Spacer()
                }
                .padding()
            }
            .navigationTitle("Add Child")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }
}

struct AddPetSheet: View {
    let householdId: String
    @Environment(\.dismiss) var dismiss
    @State private var name = ""
    @State private var species = "dog"
    
    let speciesOptions = ["dog", "cat", "bird", "fish", "reptile", "other"]
    
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
                    TextField("Pet's Name", text: $name)
                        .textFieldStyle(.plain)
                        .font(.system(size: 17))
                        .padding()
                        .background(
                            RoundedRectangle(cornerRadius: 12)
                                .fill(.ultraThinMaterial)
                        )
                    
                    Picker("Species", selection: $species) {
                        ForEach(speciesOptions, id: \.self) { option in
                            Text(option.capitalized).tag(option)
                        }
                    }
                    .pickerStyle(.menu)
                    .padding()
                    .background(
                        RoundedRectangle(cornerRadius: 12)
                            .fill(.ultraThinMaterial)
                    )
                    
                    Button(action: {
                        let pet = PetProfile(
                            id: UUID().uuidString,
                            name: name,
                            species: species,
                            breed: nil,
                            age: nil,
                            weight: nil,
                            vetName: nil,
                            vetPhone: nil,
                            medications: [],
                            allergies: [],
                            notes: nil,
                            photoURL: nil,
                            createdAt: Date(),
                            updatedAt: Date()
                        )
                        
                        Task {
                            try? await HomeService.shared.addPet(householdId: householdId, pet: pet)
                            dismiss()
                        }
                    }) {
                        Text("Add Pet")
                            .font(.system(size: 17, weight: .semibold))
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(
                                Capsule()
                                    .fill(
                                        LinearGradient(
                                            gradient: Gradient(colors: [Color.orange.opacity(0.8), Color.yellow.opacity(0.6)]),
                                            startPoint: .leading,
                                            endPoint: .trailing
                                        )
                                    )
                            )
                    }
                    .disabled(name.isEmpty)
                    
                    Spacer()
                }
                .padding()
            }
            .navigationTitle("Add Pet")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }
}

struct AddVehicleSheet: View {
    let householdId: String
    @Environment(\.dismiss) var dismiss
    @State private var make = ""
    @State private var model = ""
    @State private var year = Calendar.current.component(.year, from: Date())
    
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
                    TextField("Make", text: $make)
                        .textFieldStyle(.plain)
                        .font(.system(size: 17))
                        .padding()
                        .background(
                            RoundedRectangle(cornerRadius: 12)
                                .fill(.ultraThinMaterial)
                        )
                    
                    TextField("Model", text: $model)
                        .textFieldStyle(.plain)
                        .font(.system(size: 17))
                        .padding()
                        .background(
                            RoundedRectangle(cornerRadius: 12)
                                .fill(.ultraThinMaterial)
                        )
                    
                    TextField("Year", value: $year, format: .number)
                        .textFieldStyle(.plain)
                        .font(.system(size: 17))
                        .padding()
                        .background(
                            RoundedRectangle(cornerRadius: 12)
                                .fill(.ultraThinMaterial)
                        )
                        .keyboardType(.numberPad)
                    
                    Button(action: {
                        let vehicle = VehicleProfile(
                            id: UUID().uuidString,
                            make: make,
                            model: model,
                            year: year,
                            color: nil,
                            licensePlate: nil,
                            vin: nil,
                            mileage: nil,
                            lastOilChange: nil,
                            nextServiceDate: nil,
                            insurance: nil,
                            notes: nil,
                            photoURL: nil,
                            createdAt: Date(),
                            updatedAt: Date()
                        )
                        
                        Task {
                            try? await HomeService.shared.addVehicle(householdId: householdId, vehicle: vehicle)
                            dismiss()
                        }
                    }) {
                        Text("Add Vehicle")
                            .font(.system(size: 17, weight: .semibold))
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(
                                Capsule()
                                    .fill(
                                        LinearGradient(
                                            gradient: Gradient(colors: [Color.blue.opacity(0.8), Color.cyan.opacity(0.6)]),
                                            startPoint: .leading,
                                            endPoint: .trailing
                                        )
                                    )
                            )
                    }
                    .disabled(make.isEmpty || model.isEmpty)
                    
                    Spacer()
                }
                .padding()
            }
            .navigationTitle("Add Vehicle")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }
}

#Preview {
    HomeOverviewView(household: SharedHousehold(
        id: "test",
        name: "Smith Family",
        address: nil,
        ownerIds: ["user1"],
        memberIds: ["user1"],
        children: [],
        pets: [],
        vehicles: [],
        rooms: DEFAULT_ROOMS,
        chatChannelId: nil,
        preferences: .default,
        createdAt: Date(),
        updatedAt: Date(),
        createdBy: "user1"
    ))
}

