//
//  CopseApp.swift
//  Copse
//
//  Pack 1703 Portal iOS App
//  Created: November 2025
//

import SwiftUI
import FirebaseCore
import FirebaseMessaging
import GoogleSignIn
import UserNotifications

@main
struct CopseApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var delegate
    
    init() {
        // Configure Firebase
        FirebaseApp.configure()
    }
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .onOpenURL { url in
                    // Handle Google Sign-In URL callback
                    GIDSignIn.sharedInstance.handle(url)
                }
                .onAppear {
                    // Request notification permission when app appears
                    Task {
                        await requestNotificationPermissionIfNeeded()
                    }
                }
        }
    }
    
    private func requestNotificationPermissionIfNeeded() async {
        let status = await MessagingService.shared.checkPermissionStatus()
        
        if status == .notDetermined {
            // Request permission
            let granted = await MessagingService.shared.requestNotificationPermission()
            if granted {
                // Register FCM token after permission is granted
                await MessagingService.shared.registerFCMToken()
            }
        } else if status == .authorized {
            // Already authorized, register token
            await MessagingService.shared.registerFCMToken()
        }
    }
}

