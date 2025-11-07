//
//  UserProfile.swift
//  Copse
//
//  User profile data model for Pack 1703 Portal
//

import Foundation
import FirebaseFirestore

struct UserProfile: Identifiable, Codable {
    @DocumentID var id: String?
    let email: String
    let displayName: String
    let role: UserRole
    let den: String?
    let avatarUrl: String?
    let approved: Bool
    let createdAt: Date
    
    enum UserRole: String, Codable {
        case admin
        case denLeader = "den_leader"
        case cubmaster
        case parent
        case scout
    }
}

extension UserProfile {
    var isLeadership: Bool {
        role == .admin || role == .denLeader || role == .cubmaster
    }
    
    var canCreateEvents: Bool {
        isLeadership
    }
}

