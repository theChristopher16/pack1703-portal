//
//  NotificationSettingsView.swift
//  Copse
//
//  Notification settings and preferences
//

import SwiftUI
import UserNotifications

struct NotificationSettingsView: View {
    @StateObject private var messagingService = MessagingService.shared
    @State private var permissionStatus: UNAuthorizationStatus = .notDetermined
    @State private var isRequesting = false
    @State private var showAlert = false
    @State private var alertMessage = ""
    
    var body: some View {
        List {
            Section {
                // Permission Status
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Push Notifications")
                            .font(.headline)
                        
                        Text(statusDescription)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    
                    Spacer()
                    
                    if permissionStatus == .authorized {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundColor(.green)
                    } else if permissionStatus == .denied {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundColor(.red)
                    }
                }
                
                // Action Button
                if permissionStatus == .notDetermined {
                    Button(action: requestPermission) {
                        HStack {
                            Text("Enable Notifications")
                            Spacer()
                            if isRequesting {
                                ProgressView()
                            }
                        }
                    }
                    .disabled(isRequesting)
                } else if permissionStatus == .denied {
                    Button(action: openSettings) {
                        Text("Open Settings")
                    }
                }
            } header: {
                Text("Notifications")
            } footer: {
                Text("Receive push notifications for events, announcements, and messages from your pack.")
            }
            
            Section {
                if let token = messagingService.fcmToken {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("FCM Token")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        
                        Text(token)
                            .font(.system(.caption, design: .monospaced))
                            .textSelection(.enabled)
                            .lineLimit(3)
                    }
                } else {
                    Text("No FCM token available")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            } header: {
                Text("Debug Info")
            } footer: {
                Text("This token is used to send you notifications. It's automatically saved to your profile.")
            }
        }
        .navigationTitle("Notifications")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            checkPermissionStatus()
        }
        .alert("Notification Settings", isPresented: $showAlert) {
            Button("OK", role: .cancel) { }
        } message: {
            Text(alertMessage)
        }
    }
    
    private var statusDescription: String {
        switch permissionStatus {
        case .authorized:
            return "Enabled - You'll receive push notifications"
        case .denied:
            return "Disabled - Enable in Settings app"
        case .notDetermined:
            return "Not set - Tap to enable"
        case .provisional:
            return "Provisional - Quiet notifications enabled"
        case .ephemeral:
            return "Ephemeral - Temporary permission"
        @unknown default:
            return "Unknown status"
        }
    }
    
    private func checkPermissionStatus() {
        Task {
            let status = await messagingService.checkPermissionStatus()
            await MainActor.run {
                permissionStatus = status
            }
        }
    }
    
    private func requestPermission() {
        isRequesting = true
        
        Task {
            let granted = await messagingService.requestNotificationPermission()
            
            await MainActor.run {
                isRequesting = false
                checkPermissionStatus()
                
                if granted {
                    alertMessage = "Notifications enabled! You'll now receive push notifications for events and announcements."
                    showAlert = true
                } else {
                    alertMessage = "Notification permission was denied. You can enable it later in Settings."
                    showAlert = true
                }
            }
        }
    }
    
    private func openSettings() {
        if let settingsUrl = URL(string: UIApplication.openSettingsURLString) {
            UIApplication.shared.open(settingsUrl)
        }
    }
}

#Preview {
    NavigationView {
        NotificationSettingsView()
    }
}

