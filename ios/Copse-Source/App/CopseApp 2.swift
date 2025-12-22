//
//  CopseApp.swift
//  Copse
//
//  Pack 1703 Portal iOS App
//  Created: November 2025
//

import SwiftUI
import FirebaseCore

@main
struct CopseApp: App {
    
    init() {
        // Configure Firebase
        FirebaseApp.configure()
    }
    
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}

