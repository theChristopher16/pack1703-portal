//
//  LoginView.swift
//  Copse
//
//  Pack 1703 Portal iOS App - Login Screen
//

import SwiftUI

struct LoginView: View {
    @StateObject private var firebaseService = FirebaseService.shared
    @State private var email = ""
    @State private var password = ""
    @State private var isLoading = false
    @State private var errorMessage = ""
    
    var body: some View {
        VStack(spacing: 30) {
            // Logo and Branding
            VStack(spacing: 10) {
                Image(systemName: "leaf.fill")
                    .resizable()
                    .frame(width: 100, height: 100)
                    .foregroundColor(.green)
                
                Text("Pack 1703 Portal")
                    .font(.system(size: 32, weight: .bold))
                
                Text("🌲 Copse 🌲")
                    .font(.title3)
                    .foregroundColor(.secondary)
            }
            .padding(.top, 50)
            
            // Login Form
            VStack(spacing: 20) {
                TextField("Email", text: $email)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .textContentType(.emailAddress)
                    .autocapitalization(.none)
                    .keyboardType(.emailAddress)
                    .padding(.horizontal)
                
                SecureField("Password", text: $password)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .textContentType(.password)
                    .padding(.horizontal)
                
                if !errorMessage.isEmpty {
                    Text(errorMessage)
                        .foregroundColor(.red)
                        .font(.caption)
                        .padding(.horizontal)
                }
                
                Button(action: handleLogin) {
                    if isLoading {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: .white))
                    } else {
                        Text("Sign In")
                            .fontWeight(.semibold)
                    }
                }
                .frame(maxWidth: .infinity)
                .frame(height: 50)
                .background(Color.green)
                .foregroundColor(.white)
                .cornerRadius(10)
                .padding(.horizontal)
                .disabled(isLoading || email.isEmpty || password.isEmpty)
                
                // Social Sign-In Options
                VStack(spacing: 15) {
                    Text("Or sign in with")
                        .foregroundColor(.secondary)
                        .font(.caption)
                    
                    HStack(spacing: 20) {
                        Button(action: handleGoogleSignIn) {
                            Image(systemName: "g.circle.fill")
                                .resizable()
                                .frame(width: 40, height: 40)
                                .foregroundColor(.red)
                        }
                        
                        Button(action: handleAppleSignIn) {
                            Image(systemName: "apple.logo")
                                .resizable()
                                .frame(width: 35, height: 40)
                                .foregroundColor(.black)
                        }
                    }
                }
                .padding(.top, 20)
            }
            
            Spacer()
            
            // Footer
            Text("Need help? Contact your den leader")
                .font(.caption)
                .foregroundColor(.secondary)
                .padding(.bottom, 20)
        }
    }
    
    private func handleLogin() {
        isLoading = true
        errorMessage = ""
        
        Task {
            do {
                try await firebaseService.signIn(email: email, password: password)
                // Auth state will be updated automatically via FirebaseService listener
                await MainActor.run {
                    isLoading = false
                }
            } catch {
                await MainActor.run {
                    isLoading = false
                    errorMessage = error.localizedDescription
                }
            }
        }
    }
    
    private func handleGoogleSignIn() {
        isLoading = true
        errorMessage = ""
        
        print("🔵 Google Sign-In button tapped")
        
        Task {
            do {
                print("🔵 Starting Google Sign-In flow...")
                try await firebaseService.signInWithGoogle()
                print("🔵 Google Sign-In successful!")
                // Auth state will be updated automatically via FirebaseService listener
                await MainActor.run {
                    isLoading = false
                }
            } catch {
                print("🔴 Google Sign-In error: \(error.localizedDescription)")
                print("🔴 Full error: \(error)")
                await MainActor.run {
                    isLoading = false
                    errorMessage = error.localizedDescription
                }
            }
        }
    }
    
    private func handleAppleSignIn() {
        // TODO: Implement Apple Sign-In
        print("Apple Sign-In tapped")
    }
}

#Preview {
    LoginView()
}

