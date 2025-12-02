//
//  ContentView.swift
//  Copse
//
//  Pack 1703 Portal iOS App
//

import SwiftUI
import FirebaseAuth

struct ContentView: View {
    @StateObject private var firebaseService = FirebaseService.shared
    @State private var isLoading = true
    
    var body: some View {
        Group {
            if isLoading {
                LoadingView()
            } else if firebaseService.isAuthenticated {
                MainTabView()
            } else {
                NavigationView {
                    LoginView()
                }
            }
        }
        .onAppear {
            checkAuthenticationStatus()
        }
        .onChange(of: firebaseService.isAuthenticated) {
            // Update UI when auth state changes
        }
    }
    
    private func checkAuthenticationStatus() {
        // FirebaseService already listens for auth state changes
        // Just wait a moment for initial state to be determined
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            isLoading = false
        }
    }
}

struct LoadingView: View {
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "leaf.fill")
                .resizable()
                .frame(width: 80, height: 80)
                .foregroundColor(.green)
            
            Text("Pack 1703 Portal")
                .font(.title)
                .fontWeight(.bold)
            
            ProgressView()
                .scaleEffect(1.5)
        }
    }
}

// HomeView has been moved to HomeView.swift for better organization

#Preview {
    ContentView()
}

