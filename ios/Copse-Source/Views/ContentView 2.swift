//
//  ContentView.swift
//  Copse
//
//  Pack 1703 Portal iOS App
//

import SwiftUI

struct ContentView: View {
    @State private var isLoading = true
    @State private var isAuthenticated = false
    
    var body: some View {
        NavigationView {
            if isLoading {
                LoadingView()
            } else if isAuthenticated {
                HomeView()
            } else {
                LoginView(isAuthenticated: $isAuthenticated)
            }
        }
        .onAppear {
            checkAuthenticationStatus()
        }
    }
    
    private func checkAuthenticationStatus() {
        // TODO: Implement Firebase Auth check
        // For now, show login after brief loading
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

struct HomeView: View {
    var body: some View {
        VStack {
            Text("Welcome to Pack 1703!")
                .font(.largeTitle)
                .fontWeight(.bold)
                .padding()
            
            Text("🌲 Copse Portal 🌲")
                .font(.title2)
            
            Spacer()
            
            // TODO: Add navigation to main features
            List {
                NavigationLink("Events", destination: Text("Events Coming Soon"))
                NavigationLink("Chat", destination: Text("Chat Coming Soon"))
                NavigationLink("Calendar", destination: Text("Calendar Coming Soon"))
                NavigationLink("Resources", destination: Text("Resources Coming Soon"))
            }
        }
        .navigationTitle("Home")
    }
}

#Preview {
    ContentView()
}

