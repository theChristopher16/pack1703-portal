//
//  Household.swift
//  Copse
//
//  Home Management data models matching web app structure
//

import Foundation
import FirebaseFirestore

// MARK: - Shared Household (Multi-user home)

struct SharedHousehold: Identifiable, Codable {
    let id: String
    var name: String
    var address: String?
    var ownerIds: [String] // Users with home-admin role
    var memberIds: [String] // All users with access
    var children: [ChildProfile]
    var pets: [PetProfile]
    var vehicles: [VehicleProfile]
    var rooms: [Room]
    var chatChannelId: String? // Home chat channel
    var preferences: HomePreferences
    var createdAt: Date
    var updatedAt: Date
    var createdBy: String
    
    enum CodingKeys: String, CodingKey {
        case id, name, address, ownerIds, memberIds
        case children, pets, vehicles, rooms
        case chatChannelId, preferences
        case createdAt, updatedAt, createdBy
    }
}

// MARK: - Home Member with Role

struct HomeMember: Identifiable, Codable {
    let id: String
    let userId: String
    var displayName: String
    var email: String?
    var photoURL: String?
    var role: HomeRole
    var roleHash: String // Hashed role for security
    var joinedAt: Date
    var invitedBy: String?
    var isActive: Bool
}

// MARK: - Home Roles (with secure hashing)

enum HomeRole: String, Codable, CaseIterable {
    case owner = "owner" // Full control
    case admin = "admin" // Admin access
    case member = "member" // Standard access
    case child = "child" // Limited access
    case guest = "guest" // View only
    
    // Generate secure hash for role
    var secureHash: String {
        // Use SHA256 hash with salt for security
        let salt = "copse_home_" // In production, use environment variable
        let combined = salt + self.rawValue
        return combined.sha256Hash
    }
    
    // Permissions for each role
    var permissions: HomePermissions {
        switch self {
        case .owner, .admin:
            return HomePermissions(
                canManageMembers: true,
                canInviteUsers: true,
                canManageFinances: true,
                canManageVehicles: true,
                canManagePets: true,
                canManageChildren: true,
                canEditHome: true,
                canDeleteHome: self == .owner
            )
        case .member:
            return HomePermissions(
                canManageMembers: false,
                canInviteUsers: false,
                canManageFinances: true,
                canManageVehicles: true,
                canManagePets: true,
                canManageChildren: true,
                canEditHome: false,
                canDeleteHome: false
            )
        case .child:
            return HomePermissions(
                canManageMembers: false,
                canInviteUsers: false,
                canManageFinances: false,
                canManageVehicles: false,
                canManagePets: false,
                canManageChildren: false,
                canEditHome: false,
                canDeleteHome: false
            )
        case .guest:
            return HomePermissions(
                canManageMembers: false,
                canInviteUsers: false,
                canManageFinances: false,
                canManageVehicles: false,
                canManagePets: false,
                canManageChildren: false,
                canEditHome: false,
                canDeleteHome: false
            )
        }
    }
}

struct HomePermissions: Codable {
    let canManageMembers: Bool
    let canInviteUsers: Bool
    let canManageFinances: Bool
    let canManageVehicles: Bool
    let canManagePets: Bool
    let canManageChildren: Bool
    let canEditHome: Bool
    let canDeleteHome: Bool
}

// MARK: - Child Profile

struct ChildProfile: Identifiable, Codable {
    let id: String
    var name: String
    var age: Int?
    var grade: String?
    var school: String?
    var allergies: [String]
    var medications: [String]
    var notes: String?
    var photoURL: String?
    var createdAt: Date
    var updatedAt: Date
}

// MARK: - Pet Profile

struct PetProfile: Identifiable, Codable {
    let id: String
    var name: String
    var species: String // dog, cat, etc.
    var breed: String?
    var age: Int?
    var weight: Double?
    var vetName: String?
    var vetPhone: String?
    var medications: [String]
    var allergies: [String]
    var notes: String?
    var photoURL: String?
    var createdAt: Date
    var updatedAt: Date
}

// MARK: - Vehicle Profile

struct VehicleProfile: Identifiable, Codable {
    let id: String
    var make: String
    var model: String
    var year: Int
    var color: String?
    var licensePlate: String?
    var vin: String?
    var mileage: Int?
    var lastOilChange: Date?
    var nextServiceDate: Date?
    var insurance: VehicleInsurance?
    var notes: String?
    var photoURL: String?
    var createdAt: Date
    var updatedAt: Date
}

struct VehicleInsurance: Codable {
    var provider: String
    var policyNumber: String
    var expirationDate: Date
}

// MARK: - Room

struct Room: Identifiable, Codable {
    let id: String
    var name: String
    var icon: String
    var type: RoomType
    var notes: String?
    var lastCleaned: Date?
    var cleaningFrequency: CleaningFrequency?
}

enum RoomType: String, Codable, CaseIterable {
    case livingRoom = "Living Room"
    case kitchen = "Kitchen"
    case bedroom = "Bedroom"
    case bathroom = "Bathroom"
    case garage = "Garage"
    case office = "Office"
    case diningRoom = "Dining Room"
    case laundryRoom = "Laundry Room"
    case basement = "Basement"
    case attic = "Attic"
    case other = "Other"
    
    var icon: String {
        switch self {
        case .livingRoom: return "sofa"
        case .kitchen: return "fork.knife"
        case .bedroom: return "bed.double.fill"
        case .bathroom: return "shower.fill"
        case .garage: return "car.fill"
        case .office: return "desktopcomputer"
        case .diningRoom: return "fork.knife.circle.fill"
        case .laundryRoom: return "washer.fill"
        case .basement: return "arrow.down.square.fill"
        case .attic: return "arrow.up.square.fill"
        case .other: return "door.left.hand.open"
        }
    }
}

enum CleaningFrequency: String, Codable, CaseIterable {
    case daily = "Daily"
    case weekly = "Weekly"
    case biweekly = "Bi-weekly"
    case monthly = "Monthly"
}

// MARK: - Home Preferences

struct HomePreferences: Codable {
    var groceries: Bool
    var recipes: Bool
    var shoppingLists: Bool
    var mealPlanner: Bool
    var tasks: Bool
    var budget: Bool
    var bills: Bool
    var maintenance: Bool
    var inventory: Bool
    var familyCalendar: Bool
    var health: Bool
    var vehicles: Bool
    var pets: Bool
    var documents: Bool
    var cleaning: Bool
    var unifiedCalendar: Bool
    
    static var `default`: HomePreferences {
        HomePreferences(
            groceries: true,
            recipes: true,
            shoppingLists: true,
            mealPlanner: true,
            tasks: true,
            budget: false,
            bills: false,
            maintenance: false,
            inventory: false,
            familyCalendar: false,
            health: false,
            vehicles: false,
            pets: false,
            documents: false,
            cleaning: false,
            unifiedCalendar: false
        )
    }
}

// MARK: - Home Invitation

struct HomeInvitation: Identifiable, Codable {
    let id: String
    let householdId: String
    let householdName: String
    let invitedEmail: String
    let invitedBy: String
    let invitedByName: String
    let role: HomeRole
    let status: InvitationStatus
    let createdAt: Date
    var respondedAt: Date?
    var expiresAt: Date
}

enum InvitationStatus: String, Codable {
    case pending = "pending"
    case accepted = "accepted"
    case declined = "declined"
    case expired = "expired"
}

// MARK: - Default Rooms

let DEFAULT_ROOMS: [Room] = [
    Room(id: "", name: "Living Room", icon: "sofa", type: .livingRoom, notes: nil, lastCleaned: nil, cleaningFrequency: .weekly),
    Room(id: "", name: "Kitchen", icon: "fork.knife", type: .kitchen, notes: nil, lastCleaned: nil, cleaningFrequency: .daily),
    Room(id: "", name: "Master Bedroom", icon: "bed.double.fill", type: .bedroom, notes: nil, lastCleaned: nil, cleaningFrequency: .weekly),
    Room(id: "", name: "Bathroom", icon: "shower.fill", type: .bathroom, notes: nil, lastCleaned: nil, cleaningFrequency: .weekly)
]

// MARK: - SHA256 Extension for Role Hashing

extension String {
    var sha256Hash: String {
        guard let data = self.data(using: .utf8) else { return self }
        // Use CryptoKit for secure hashing
        let hashedData = SHA256.hash(data: data)
        return hashedData.compactMap { String(format: "%02x", $0) }.joined()
    }
}

import CryptoKit

extension SHA256 {
    static func hash(data: Data) -> Data {
        let hashed = SHA256.hash(data: data)
        return Data(hashed)
    }
}

