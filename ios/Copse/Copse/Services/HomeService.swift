//
//  HomeService.swift
//  Copse
//
//  Home Management service - handles households, members, invitations
//  Matches web app functionality
//

import Foundation
import Combine
import FirebaseAuth
import FirebaseFirestore
import CryptoKit

class HomeService: ObservableObject {
    static let shared = HomeService()
    
    @Published var currentHousehold: SharedHousehold?
    @Published var userHouseholds: [SharedHousehold] = []
    @Published var hasCompletedSetup: Bool = false
    @Published var pendingInvitations: [HomeInvitation] = []
    
    private let db = Firestore.firestore()
    private let firebaseService = FirebaseService.shared
    private var cancellables = Set<AnyCancellable>()
    
    // Firestore collections
    private let HOUSEHOLDS_COLLECTION = "sharedHouseholds"
    private let USER_HOUSEHOLDS_COLLECTION = "userHouseholds"
    private let INVITATIONS_COLLECTION = "householdInvitations"
    private let CHILD_PROFILES_COLLECTION = "childProfiles"
    
    private init() {
        setupAuthListener()
    }
    
    // MARK: - Setup & Authentication
    
    private func setupAuthListener() {
        firebaseService.$isAuthenticated
            .sink { [weak self] isAuthenticated in
                if isAuthenticated {
                    Task {
                        await self?.loadUserHouseholds()
                    }
                } else {
                    Task { @MainActor in
                        self?.currentHousehold = nil
                        self?.userHouseholds = []
                        self?.hasCompletedSetup = false
                    }
                }
            }
            .store(in: &cancellables)
    }
    
    // MARK: - Check Setup Status
    
    func checkSetupStatus() async throws -> Bool {
        guard let userId = firebaseService.currentUser?.uid else {
            return false
        }
        
        let userHouseholdsRef = db.collection(USER_HOUSEHOLDS_COLLECTION).document(userId)
        let doc = try await userHouseholdsRef.getDocument()
        
        if let data = doc.data(),
           let householdIds = data["households"] as? [[String: Any]],
           !householdIds.isEmpty {
            await MainActor.run {
                hasCompletedSetup = true
            }
            return true
        }
        
        return false
    }
    
    // MARK: - Load User Households
    
    func loadUserHouseholds() async {
        guard let userId = firebaseService.currentUser?.uid else { return }
        
        do {
            // Get user's household memberships
            let userHouseholdsRef = db.collection(USER_HOUSEHOLDS_COLLECTION).document(userId)
            let doc = try await userHouseholdsRef.getDocument()
            
            guard let data = doc.data(),
                  let householdIds = data["households"] as? [[String: Any]] else {
                await MainActor.run {
                    hasCompletedSetup = false
                    userHouseholds = []
                }
                return
            }
            
            // Load all households
            var households: [SharedHousehold] = []
            for householdData in householdIds {
                guard let householdId = householdData["householdId"] as? String else { continue }
                
                if let household = try await getHousehold(householdId: householdId) {
                    households.append(household)
                }
            }
            
            await MainActor.run {
                self.userHouseholds = households
                self.hasCompletedSetup = !households.isEmpty
                
                // Set primary household
                if let primaryId = data["primaryHouseholdId"] as? String {
                    self.currentHousehold = households.first { $0.id == primaryId }
                } else if let first = households.first {
                    self.currentHousehold = first
                }
            }
            
        } catch {
            print("🔴 HomeService: Failed to load households - \(error)")
        }
    }
    
    // MARK: - Get Household
    
    func getHousehold(householdId: String) async throws -> SharedHousehold? {
        let docRef = db.collection(HOUSEHOLDS_COLLECTION).document(householdId)
        let doc = try await docRef.getDocument()
        
        guard doc.exists, let data = doc.data() else { return nil }
        
        return try parseHousehold(id: householdId, data: data)
    }
    
    private func parseHousehold(id: String, data: [String: Any]) throws -> SharedHousehold {
        return SharedHousehold(
            id: id,
            name: data["name"] as? String ?? "My Home",
            address: data["address"] as? String,
            ownerIds: data["ownerIds"] as? [String] ?? [],
            memberIds: data["memberIds"] as? [String] ?? [],
            children: parseChildren(data["children"] as? [[String: Any]]),
            pets: parsePets(data["pets"] as? [[String: Any]]),
            vehicles: parseVehicles(data["vehicles"] as? [[String: Any]]),
            rooms: parseRooms(data["rooms"] as? [[String: Any]]),
            chatChannelId: data["chatChannelId"] as? String,
            preferences: parsePreferences(data["preferences"] as? [String: Any]),
            createdAt: (data["createdAt"] as? Timestamp)?.dateValue() ?? Date(),
            updatedAt: (data["updatedAt"] as? Timestamp)?.dateValue() ?? Date(),
            createdBy: data["createdBy"] as? String ?? ""
        )
    }
    
    // MARK: - Create Household
    
    func createHousehold(
        name: String,
        address: String?,
        members: [String],
        rooms: [Room],
        hasVehicles: Bool,
        hasPets: Bool
    ) async throws -> SharedHousehold {
        guard let userId = firebaseService.currentUser?.uid else {
            throw HomeServiceError.notAuthenticated
        }
        
        let householdId = UUID().uuidString
        let now = Timestamp.now()
        
        // Set up preferences based on user choices
        var preferences = HomePreferences.default
        preferences.vehicles = hasVehicles
        preferences.pets = hasPets
        
        let householdData: [String: Any] = [
            "name": name,
            "address": address as Any,
            "ownerIds": [userId],
            "memberIds": [userId],
            "children": [],
            "pets": [],
            "vehicles": [],
            "rooms": rooms.map { roomToDict($0) },
            "preferences": preferencesToDict(preferences),
            "createdAt": now,
            "updatedAt": now,
            "createdBy": userId
        ]
        
        // Create household document
        let householdRef = db.collection(HOUSEHOLDS_COLLECTION).document(householdId)
        try await householdRef.setData(householdData)
        
        // Add to user's households
        let userHouseholdsRef = db.collection(USER_HOUSEHOLDS_COLLECTION).document(userId)
        try await userHouseholdsRef.setData([
            "userId": userId,
            "primaryHouseholdId": householdId,
            "households": [
                [
                    "householdId": householdId,
                    "role": HomeRole.owner.rawValue,
                    "roleHash": HomeRole.owner.secureHash,
                    "joinedAt": now
                ]
            ]
        ])
        
        // Create home chat channel
        let chatChannelId = try await createHomeChat(householdId: householdId, householdName: name, memberIds: [userId])
        
        // Update household with chat channel ID
        try await householdRef.updateData(["chatChannelId": chatChannelId])
        
        // Reload households
        await loadUserHouseholds()
        
        guard let createdHousehold = try await getHousehold(householdId: householdId) else {
            throw HomeServiceError.householdCreationFailed
        }
        
        return createdHousehold
    }
    
    // MARK: - Create Home Chat
    
    private func createHomeChat(householdId: String, householdName: String, memberIds: [String]) async throws -> String {
        // Create a Stream Chat channel for this home
        let channelId = "home_\(householdId)"
        
        guard let streamService = StreamChatService.shared.chatClient else {
            // If Stream Chat isn't configured, return a placeholder
            return channelId
        }
        
        // Create channel using Stream Chat
        let extraData: [String: RawJSON] = [
            "channel_type": .string("home"),
            "household_id": .string(householdId),
            "household_name": .string(householdName)
        ]
        
        let cid = ChannelId(type: .messaging, id: channelId)
        let controller = streamService.channelController(
            createChannelWithId: cid,
            name: "🏠 \(householdName) Home",
            members: Set(memberIds),
            extraData: extraData
        )
        
        controller.synchronize { error in
            if let error = error {
                print("🔴 Failed to create home chat: \(error)")
            }
        }
        
        return channelId
    }
    
    // MARK: - Invite User
    
    func inviteUserToHome(
        householdId: String,
        email: String,
        role: HomeRole
    ) async throws {
        guard let userId = firebaseService.currentUser?.uid,
              let userName = firebaseService.currentUser?.displayName ?? firebaseService.currentUser?.email else {
            throw HomeServiceError.notAuthenticated
        }
        
        // Verify current user is owner/admin
        guard let household = try await getHousehold(householdId: householdId),
              household.ownerIds.contains(userId) else {
            throw HomeServiceError.permissionDenied
        }
        
        let invitationId = UUID().uuidString
        let now = Timestamp.now()
        let expiresAt = Calendar.current.date(byAdding: .day, value: 7, to: Date()) ?? Date()
        
        let invitationData: [String: Any] = [
            "householdId": householdId,
            "householdName": household.name,
            "invitedEmail": email,
            "invitedBy": userId,
            "invitedByName": userName,
            "role": role.rawValue,
            "roleHash": role.secureHash,
            "status": InvitationStatus.pending.rawValue,
            "createdAt": now,
            "expiresAt": Timestamp(date: expiresAt)
        ]
        
        let invitationRef = db.collection(INVITATIONS_COLLECTION).document(invitationId)
        try await invitationRef.setData(invitationData)
        
        // TODO: Send invitation email via Cloud Function
    }
    
    // MARK: - Add Child/Pet/Vehicle
    
    func addChild(householdId: String, child: ChildProfile) async throws {
        let householdRef = db.collection(HOUSEHOLDS_COLLECTION).document(householdId)
        
        var childDict = childToDict(child)
        childDict["id"] = UUID().uuidString
        
        try await householdRef.updateData([
            "children": FieldValue.arrayUnion([childDict]),
            "updatedAt": Timestamp.now()
        ])
        
        await loadUserHouseholds()
    }
    
    func addPet(householdId: String, pet: PetProfile) async throws {
        let householdRef = db.collection(HOUSEHOLDS_COLLECTION).document(householdId)
        
        var petDict = petToDict(pet)
        petDict["id"] = UUID().uuidString
        
        try await householdRef.updateData([
            "pets": FieldValue.arrayUnion([petDict]),
            "updatedAt": Timestamp.now()
        ])
        
        await loadUserHouseholds()
    }
    
    func addVehicle(householdId: String, vehicle: VehicleProfile) async throws {
        let householdRef = db.collection(HOUSEHOLDS_COLLECTION).document(householdId)
        
        var vehicleDict = vehicleToDict(vehicle)
        vehicleDict["id"] = UUID().uuidString
        
        try await householdRef.updateData([
            "vehicles": FieldValue.arrayUnion([vehicleDict]),
            "updatedAt": Timestamp.now()
        ])
        
        await loadUserHouseholds()
    }
    
    // MARK: - Helper Functions (Parsing)
    
    private func parseChildren(_ data: [[String: Any]]?) -> [ChildProfile] {
        guard let data = data else { return [] }
        return data.compactMap { dict in
            guard let id = dict["id"] as? String,
                  let name = dict["name"] as? String else { return nil }
            
            return ChildProfile(
                id: id,
                name: name,
                age: dict["age"] as? Int,
                grade: dict["grade"] as? String,
                school: dict["school"] as? String,
                allergies: dict["allergies"] as? [String] ?? [],
                medications: dict["medications"] as? [String] ?? [],
                notes: dict["notes"] as? String,
                photoURL: dict["photoURL"] as? String,
                createdAt: (dict["createdAt"] as? Timestamp)?.dateValue() ?? Date(),
                updatedAt: (dict["updatedAt"] as? Timestamp)?.dateValue() ?? Date()
            )
        }
    }
    
    private func parsePets(_ data: [[String: Any]]?) -> [PetProfile] {
        guard let data = data else { return [] }
        return data.compactMap { dict in
            guard let id = dict["id"] as? String,
                  let name = dict["name"] as? String,
                  let species = dict["species"] as? String else { return nil }
            
            return PetProfile(
                id: id,
                name: name,
                species: species,
                breed: dict["breed"] as? String,
                age: dict["age"] as? Int,
                weight: dict["weight"] as? Double,
                vetName: dict["vetName"] as? String,
                vetPhone: dict["vetPhone"] as? String,
                medications: dict["medications"] as? [String] ?? [],
                allergies: dict["allergies"] as? [String] ?? [],
                notes: dict["notes"] as? String,
                photoURL: dict["photoURL"] as? String,
                createdAt: (dict["createdAt"] as? Timestamp)?.dateValue() ?? Date(),
                updatedAt: (dict["updatedAt"] as? Timestamp)?.dateValue() ?? Date()
            )
        }
    }
    
    private func parseVehicles(_ data: [[String: Any]]?) -> [VehicleProfile] {
        guard let data = data else { return [] }
        return data.compactMap { dict in
            guard let id = dict["id"] as? String,
                  let make = dict["make"] as? String,
                  let model = dict["model"] as? String,
                  let year = dict["year"] as? Int else { return nil }
            
            return VehicleProfile(
                id: id,
                make: make,
                model: model,
                year: year,
                color: dict["color"] as? String,
                licensePlate: dict["licensePlate"] as? String,
                vin: dict["vin"] as? String,
                mileage: dict["mileage"] as? Int,
                lastOilChange: (dict["lastOilChange"] as? Timestamp)?.dateValue(),
                nextServiceDate: (dict["nextServiceDate"] as? Timestamp)?.dateValue(),
                insurance: nil, // TODO: Parse insurance
                notes: dict["notes"] as? String,
                photoURL: dict["photoURL"] as? String,
                createdAt: (dict["createdAt"] as? Timestamp)?.dateValue() ?? Date(),
                updatedAt: (dict["updatedAt"] as? Timestamp)?.dateValue() ?? Date()
            )
        }
    }
    
    private func parseRooms(_ data: [[String: Any]]?) -> [Room] {
        guard let data = data else { return [] }
        return data.compactMap { dict in
            guard let id = dict["id"] as? String,
                  let name = dict["name"] as? String,
                  let icon = dict["icon"] as? String else { return nil }
            
            let typeString = dict["type"] as? String ?? "other"
            let type = RoomType(rawValue: typeString) ?? .other
            
            return Room(
                id: id,
                name: name,
                icon: icon,
                type: type,
                notes: dict["notes"] as? String,
                lastCleaned: (dict["lastCleaned"] as? Timestamp)?.dateValue(),
                cleaningFrequency: nil // TODO: Parse frequency
            )
        }
    }
    
    private func parsePreferences(_ data: [String: Any]?) -> HomePreferences {
        guard let data = data else { return .default }
        
        return HomePreferences(
            groceries: data["groceries"] as? Bool ?? true,
            recipes: data["recipes"] as? Bool ?? true,
            shoppingLists: data["shoppingLists"] as? Bool ?? true,
            mealPlanner: data["mealPlanner"] as? Bool ?? true,
            tasks: data["tasks"] as? Bool ?? true,
            budget: data["budget"] as? Bool ?? false,
            bills: data["bills"] as? Bool ?? false,
            maintenance: data["maintenance"] as? Bool ?? false,
            inventory: data["inventory"] as? Bool ?? false,
            familyCalendar: data["familyCalendar"] as? Bool ?? false,
            health: data["health"] as? Bool ?? false,
            vehicles: data["vehicles"] as? Bool ?? false,
            pets: data["pets"] as? Bool ?? false,
            documents: data["documents"] as? Bool ?? false,
            cleaning: data["cleaning"] as? Bool ?? false,
            unifiedCalendar: data["unifiedCalendar"] as? Bool ?? false
        )
    }
    
    // MARK: - Helper Functions (Conversion to Dict)
    
    private func roomToDict(_ room: Room) -> [String: Any] {
        var dict: [String: Any] = [
            "id": room.id.isEmpty ? UUID().uuidString : room.id,
            "name": room.name,
            "icon": room.icon,
            "type": room.type.rawValue
        ]
        
        if let notes = room.notes { dict["notes"] = notes }
        if let lastCleaned = room.lastCleaned { dict["lastCleaned"] = Timestamp(date: lastCleaned) }
        
        return dict
    }
    
    private func childToDict(_ child: ChildProfile) -> [String: Any] {
        var dict: [String: Any] = [
            "name": child.name,
            "allergies": child.allergies,
            "medications": child.medications,
            "createdAt": Timestamp(date: child.createdAt),
            "updatedAt": Timestamp(date: child.updatedAt)
        ]
        
        if let age = child.age { dict["age"] = age }
        if let grade = child.grade { dict["grade"] = grade }
        if let school = child.school { dict["school"] = school }
        if let notes = child.notes { dict["notes"] = notes }
        if let photoURL = child.photoURL { dict["photoURL"] = photoURL }
        
        return dict
    }
    
    private func petToDict(_ pet: PetProfile) -> [String: Any] {
        var dict: [String: Any] = [
            "name": pet.name,
            "species": pet.species,
            "medications": pet.medications,
            "allergies": pet.allergies,
            "createdAt": Timestamp(date: pet.createdAt),
            "updatedAt": Timestamp(date: pet.updatedAt)
        ]
        
        if let breed = pet.breed { dict["breed"] = breed }
        if let age = pet.age { dict["age"] = age }
        if let weight = pet.weight { dict["weight"] = weight }
        if let vetName = pet.vetName { dict["vetName"] = vetName }
        if let vetPhone = pet.vetPhone { dict["vetPhone"] = vetPhone }
        if let notes = pet.notes { dict["notes"] = notes }
        if let photoURL = pet.photoURL { dict["photoURL"] = photoURL }
        
        return dict
    }
    
    private func vehicleToDict(_ vehicle: VehicleProfile) -> [String: Any] {
        var dict: [String: Any] = [
            "make": vehicle.make,
            "model": vehicle.model,
            "year": vehicle.year,
            "createdAt": Timestamp(date: vehicle.createdAt),
            "updatedAt": Timestamp(date: vehicle.updatedAt)
        ]
        
        if let color = vehicle.color { dict["color"] = color }
        if let licensePlate = vehicle.licensePlate { dict["licensePlate"] = licensePlate }
        if let vin = vehicle.vin { dict["vin"] = vin }
        if let mileage = vehicle.mileage { dict["mileage"] = mileage }
        if let notes = vehicle.notes { dict["notes"] = notes }
        if let photoURL = vehicle.photoURL { dict["photoURL"] = photoURL }
        
        return dict
    }
    
    private func preferencesToDict(_ preferences: HomePreferences) -> [String: Any] {
        return [
            "groceries": preferences.groceries,
            "recipes": preferences.recipes,
            "shoppingLists": preferences.shoppingLists,
            "mealPlanner": preferences.mealPlanner,
            "tasks": preferences.tasks,
            "budget": preferences.budget,
            "bills": preferences.bills,
            "maintenance": preferences.maintenance,
            "inventory": preferences.inventory,
            "familyCalendar": preferences.familyCalendar,
            "health": preferences.health,
            "vehicles": preferences.vehicles,
            "pets": preferences.pets,
            "documents": preferences.documents,
            "cleaning": preferences.cleaning,
            "unifiedCalendar": preferences.unifiedCalendar
        ]
    }
}

// MARK: - Errors

enum HomeServiceError: LocalizedError {
    case notAuthenticated
    case permissionDenied
    case householdCreationFailed
    case householdNotFound
    
    var errorDescription: String? {
        switch self {
        case .notAuthenticated:
            return "User is not authenticated"
        case .permissionDenied:
            return "You don't have permission to perform this action"
        case .householdCreationFailed:
            return "Failed to create household"
        case .householdNotFound:
            return "Household not found"
        }
    }
}

// Import StreamChat for home chat creation
import StreamChat

