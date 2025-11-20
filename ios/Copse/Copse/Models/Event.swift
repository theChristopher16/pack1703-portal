//
//  Event.swift
//  Copse
//
//  Event data model for Pack 1703 Portal
//

import Foundation
import FirebaseFirestore

struct Event: Identifiable {
    var id: String
    let title: String
    let description: String
    let date: Date
    let location: String
    let locationDetails: LocationDetails?
    let packingList: [String]?
    let rsvpRequired: Bool
    let rsvpDeadline: Date?
    let createdBy: String
    let createdAt: Date
    let updatedAt: Date
    
    struct LocationDetails: Codable {
        let address: String?
        let latitude: Double?
        let longitude: Double?
        let mapUrl: String?
    }
}

extension Event {
    var formattedDate: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
    
    var isUpcoming: Bool {
        date > Date()
    }
    
    var isPastEvent: Bool {
        date < Date()
    }
}

