//
//  Message.swift
//  Copse
//
//  Chat message data model for Pack 1703 Portal
//

import Foundation
import FirebaseFirestore

struct Message: Identifiable, Codable {
    @DocumentID var id: String?
    let userId: String
    let content: String
    let timestamp: Date
    let attachments: [Attachment]?
    let mentions: [String]?
    
    struct Attachment: Codable {
        let type: AttachmentType
        let url: String
        let thumbnailUrl: String?
        
        enum AttachmentType: String, Codable {
            case image
            case file
            case video
        }
    }
}

extension Message {
    var formattedTime: String {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return formatter.string(from: timestamp)
    }
}

