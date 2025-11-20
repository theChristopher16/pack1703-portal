//
//  MessagingService.swift
//  Copse
//
//  Firebase Cloud Messaging service for push notifications
//

import Foundation
import UserNotifications
import FirebaseMessaging
import FirebaseAuth
import FirebaseFirestore

class MessagingService: NSObject, ObservableObject {
    static let shared = MessagingService()
    
    @Published var fcmToken: String?
    @Published var notificationPermissionStatus: UNAuthorizationStatus = .notDetermined
    
    private let messaging = Messaging.messaging()
    private let db = Firestore.firestore()
    
    private override init() {
        super.init()
        messaging.delegate = self
    }
    
    // MARK: - Permission Request
    
    /// Request notification permissions from the user
    func requestNotificationPermission() async -> Bool {
        do {
            let authOptions: UNAuthorizationOptions = [.alert, .badge, .sound]
            let granted = try await UNUserNotificationCenter.current().requestAuthorization(options: authOptions)
            
            await MainActor.run {
                updatePermissionStatus()
            }
            
            if granted {
                // Register for remote notifications
                await MainActor.run {
                    UIApplication.shared.registerForRemoteNotifications()
                }
            }
            
            return granted
        } catch {
            print("❌ Error requesting notification permission: \(error)")
            return false
        }
    }
    
    /// Check current notification permission status
    func checkPermissionStatus() async -> UNAuthorizationStatus {
        let settings = await UNUserNotificationCenter.current().notificationSettings()
        await MainActor.run {
            notificationPermissionStatus = settings.authorizationStatus
        }
        return settings.authorizationStatus
    }
    
    private func updatePermissionStatus() {
        UNUserNotificationCenter.current().getNotificationSettings { [weak self] settings in
            DispatchQueue.main.async {
                self?.notificationPermissionStatus = settings.authorizationStatus
            }
        }
    }
    
    // MARK: - Token Management
    
    /// Register FCM token and save to Firestore
    func registerFCMToken() async {
        guard let token = try? await messaging.token() else {
            print("❌ Failed to get FCM token")
            return
        }
        
        await MainActor.run {
            fcmToken = token
        }
        
        // Save token to Firestore if user is authenticated
        guard let userId = Auth.auth().currentUser?.uid else {
            print("⚠️ User not authenticated, token will be saved after login")
            return
        }
        
        await saveTokenToFirestore(token: token, userId: userId)
    }
    
    /// Save FCM token to user document in Firestore
    private func saveTokenToFirestore(token: String, userId: String) async {
        do {
            try await db.collection("users").document(userId).setData([
                "fcmToken": token,
                "fcmTokenUpdatedAt": FieldValue.serverTimestamp(),
                "platform": "ios"
            ], merge: true)
            
            print("✅ FCM token saved to Firestore for user: \(userId)")
        } catch {
            print("❌ Error saving FCM token to Firestore: \(error)")
        }
    }
    
    /// Remove FCM token from Firestore when user logs out
    func unregisterFCMToken() async {
        guard let userId = Auth.auth().currentUser?.uid else {
            return
        }
        
        do {
            try await db.collection("users").document(userId).updateData([
                "fcmToken": FieldValue.delete(),
                "fcmTokenUpdatedAt": FieldValue.serverTimestamp()
            ])
            
            await MainActor.run {
                fcmToken = nil
            }
            
            print("✅ FCM token removed from Firestore")
        } catch {
            print("❌ Error removing FCM token from Firestore: \(error)")
        }
    }
    
    // MARK: - Notification Handling
    
    /// Handle notification when app is in foreground
    func handleForegroundNotification(userInfo: [AnyHashable: Any]) {
        // Extract notification data
        guard let aps = userInfo["aps"] as? [String: Any],
              let alert = aps["alert"] as? [String: Any] else {
            return
        }
        
        let title = alert["title"] as? String ?? "New Notification"
        let body = alert["body"] as? String ?? ""
        
        print("📬 Foreground notification received: \(title) - \(body)")
        
        // You can show a custom in-app notification here
        // For now, we'll rely on the system notification
    }
    
    /// Handle notification tap
    func handleNotificationTap(userInfo: [AnyHashable: Any]) {
        print("👆 Notification tapped")
        
        // Extract custom data to navigate to specific screen
        if let eventId = userInfo["eventId"] as? String {
            // Navigate to event detail
            print("📍 Navigate to event: \(eventId)")
            // TODO: Implement navigation
        } else if let channelId = userInfo["channelId"] as? String {
            // Navigate to chat channel
            print("💬 Navigate to channel: \(channelId)")
            // TODO: Implement navigation
        }
    }
}

// MARK: - MessagingDelegate

extension MessagingService: MessagingDelegate {
    func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
        print("📱 FCM registration token: \(fcmToken ?? "nil")")
        
        guard let token = fcmToken else {
            return
        }
        
        Task {
            await MainActor.run {
                self.fcmToken = token
            }
            
            // Save token to Firestore if user is authenticated
            if let userId = Auth.auth().currentUser?.uid {
                await saveTokenToFirestore(token: token, userId: userId)
            }
        }
        
        // Send token to server if needed
        let dataDict: [String: String] = ["token": token]
        NotificationCenter.default.post(
            name: Notification.Name("FCMToken"),
            object: nil,
            userInfo: dataDict
        )
    }
}

// MARK: - UNUserNotificationCenterDelegate

extension MessagingService: UNUserNotificationCenterDelegate {
    // Handle notification when app is in foreground
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        let userInfo = notification.request.content.userInfo
        
        // Handle foreground notification
        handleForegroundNotification(userInfo: userInfo)
        
        // Show notification even when app is in foreground
        if #available(iOS 14.0, *) {
            completionHandler([[.banner, .badge, .sound]])
        } else {
            completionHandler([[.alert, .badge, .sound]])
        }
    }
    
    // Handle notification tap
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        let userInfo = response.notification.request.content.userInfo
        
        // Handle notification tap
        handleNotificationTap(userInfo: userInfo)
        
        completionHandler()
    }
}

