//
//  HomeSetupWizard.swift
//  Copse
//
//  Beautiful glassmorphism home setup wizard
//  Guides users through creating or joining a home
//

import SwiftUI

struct HomeSetupWizard: View {
    @Environment(\.dismiss) var dismiss
    @StateObject private var homeService = HomeService.shared
    @State private var setupMode: SetupMode? = nil
    @State private var currentStep = 1
    @State private var formData = HomeSetupData()
    @State private var isSaving = false
    @State private var errorMessage: String?
    
    let totalSteps = 6
    
    var body: some View {
        ZStack {
            // Gradient background
            LinearGradient(
                gradient: Gradient(colors: [
                    Color(red: 0.95, green: 0.98, blue: 0.95),
                    Color(red: 0.94, green: 0.97, blue: 0.96),
                    Color(red: 0.94, green: 0.98, blue: 0.99)
                ]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()
            
            VStack(spacing: 0) {
                if setupMode == nil {
                    // Initial choice: Create or Join
                    CreateOrJoinView(onSelect: { mode in
                        withAnimation(.spring(response: 0.4)) {
                            setupMode = mode
                        }
                    })
                } else if setupMode == .join {
                    // Join existing home flow
                    JoinHomeView(onComplete: {
                        dismiss()
                    })
                } else {
                    // Create new home wizard
                    VStack(spacing: 0) {
                        // Header with progress
                        SetupHeader(currentStep: currentStep, totalSteps: totalSteps)
                        
                        // Content
                        ScrollView {
                            VStack(spacing: 24) {
                                switch currentStep {
                                case 1:
                                    Step1_Welcome(formData: $formData)
                                case 2:
                                    Step2_Members(formData: $formData)
                                case 3:
                                    Step3_Rooms(formData: $formData)
                                case 4:
                                    Step4_VehiclesPets(formData: $formData)
                                case 5:
                                    Step5_Children(formData: $formData)
                                case 6:
                                    Step6_Complete(formData: $formData)
                                default:
                                    EmptyView()
                                }
                            }
                            .padding()
                        }
                        
                        // Navigation buttons
                        SetupFooter(
                            currentStep: currentStep,
                            totalSteps: totalSteps,
                            isSaving: isSaving,
                            canGoNext: canGoNext,
                            onBack: {
                                if currentStep > 1 {
                                    withAnimation {
                                        currentStep -= 1
                                    }
                                } else {
                                    withAnimation {
                                        setupMode = nil
                                    }
                                }
                            },
                            onNext: {
                                withAnimation {
                                    currentStep += 1
                                }
                            },
                            onComplete: {
                                Task {
                                    await handleComplete()
                                }
                            }
                        )
                    }
                }
            }
        }
        .alert("Error", isPresented: Binding(
            get: { errorMessage != nil },
            set: { if !$0 { errorMessage = nil } }
        )) {
            Button("OK") { errorMessage = nil }
        } message: {
            if let error = errorMessage {
                Text(error)
            }
        }
    }
    
    private var canGoNext: Bool {
        switch currentStep {
        case 1:
            return !formData.householdName.isEmpty
        case 2:
            return !formData.members.filter { !$0.name.isEmpty }.isEmpty
        default:
            return true
        }
    }
    
    private func handleComplete() async {
        isSaving = true
        errorMessage = nil
        
        do {
            let rooms = formData.rooms + formData.customRooms
            
            _ = try await homeService.createHousehold(
                name: formData.householdName,
                address: formData.address.isEmpty ? nil : formData.address,
                members: formData.members.map { $0.name },
                rooms: rooms.map { Room(
                    id: "",
                    name: $0.name,
                    icon: $0.icon,
                    type: $0.type,
                    notes: nil,
                    lastCleaned: nil,
                    cleaningFrequency: .weekly
                )},
                hasVehicles: formData.hasVehicles,
                hasPets: formData.hasPets
            )
            
            await MainActor.run {
                isSaving = false
                dismiss()
            }
            
        } catch {
            await MainActor.run {
                isSaving = false
                errorMessage = error.localizedDescription
            }
        }
    }
}

// MARK: - Setup Mode

enum SetupMode {
    case create
    case join
}

// MARK: - Setup Data

struct HomeSetupData {
    var householdName = ""
    var address = ""
    var members: [MemberInput] = [MemberInput(name: "", relationship: "self")]
    var rooms: [RoomInput] = DEFAULT_ROOMS.map { RoomInput(name: $0.name, icon: $0.icon, type: $0.type) }
    var customRooms: [RoomInput] = []
    var hasVehicles = false
    var hasPets = false
    var children: [ChildInput] = []
}

struct MemberInput: Identifiable {
    let id = UUID()
    var name: String
    var relationship: String
}

struct RoomInput: Identifiable {
    let id = UUID()
    var name: String
    var icon: String
    var type: RoomType
}

struct ChildInput: Identifiable {
    let id = UUID()
    var name: String
    var age: Int?
    var grade: String?
}

// MARK: - Create or Join View

struct CreateOrJoinView: View {
    let onSelect: (SetupMode) -> Void
    
    var body: some View {
        VStack(spacing: 40) {
            Spacer()
            
            // Title
            VStack(spacing: 16) {
                Image(systemName: "house.fill")
                    .font(.system(size: 80))
                    .foregroundStyle(
                        LinearGradient(
                            gradient: Gradient(colors: [
                                Color.green.opacity(0.8),
                                Color.teal.opacity(0.8)
                            ]),
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                
                Text("Welcome to Copse Home")
                    .font(.system(size: 32, weight: .bold))
                    .foregroundColor(.primary)
                
                Text("Your life's operating system starts here")
                    .font(.system(size: 18))
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
            
            Spacer()
            
            // Options
            VStack(spacing: 20) {
                OptionCard(
                    icon: "plus.circle.fill",
                    title: "Create a New Home",
                    description: "Set up your household and invite family members",
                    color: .green
                ) {
                    onSelect(.create)
                }
                
                OptionCard(
                    icon: "person.2.fill",
                    title: "Join an Existing Home",
                    description: "Enter an invitation code from a family member",
                    color: .blue
                ) {
                    onSelect(.join)
                }
            }
            .padding(.horizontal, 30)
            
            Spacer()
        }
        .padding()
    }
}

struct OptionCard: View {
    let icon: String
    let title: String
    let description: String
    let color: Color
    let action: () -> Void
    @State private var isPressed = false
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 20) {
                ZStack {
                    Circle()
                        .fill(
                            LinearGradient(
                                gradient: Gradient(colors: [
                                    color.opacity(0.8),
                                    color.opacity(0.6)
                                ]),
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 64, height: 64)
                    
                    Image(systemName: icon)
                        .font(.system(size: 30))
                        .foregroundColor(.white)
                }
                
                VStack(alignment: .leading, spacing: 6) {
                    Text(title)
                        .font(.system(size: 20, weight: .semibold))
                        .foregroundColor(.primary)
                    
                    Text(description)
                        .font(.system(size: 14))
                        .foregroundColor(.secondary)
                        .lineLimit(2)
                }
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(.secondary)
            }
            .padding(24)
            .background(
                RoundedRectangle(cornerRadius: 20)
                    .fill(.ultraThinMaterial)
                    .shadow(color: color.opacity(0.2), radius: 12, x: 0, y: 6)
            )
            .scaleEffect(isPressed ? 0.98 : 1.0)
            .animation(.spring(response: 0.3, dampingFraction: 0.6), value: isPressed)
        }
        .buttonStyle(PlainButtonStyle())
        .simultaneousGesture(
            DragGesture(minimumDistance: 0)
                .onChanged { _ in isPressed = true }
                .onEnded { _ in isPressed = false }
        )
    }
}

// MARK: - Setup Header

struct SetupHeader: View {
    let currentStep: Int
    let totalSteps: Int
    
    var body: some View {
        VStack(spacing: 16) {
            // Progress bar
            HStack(spacing: 8) {
                ForEach(1...totalSteps, id: \.self) { step in
                    RoundedRectangle(cornerRadius: 4)
                        .fill(step <= currentStep ? 
                              LinearGradient(
                                gradient: Gradient(colors: [Color.green.opacity(0.8), Color.teal.opacity(0.8)]),
                                startPoint: .leading,
                                endPoint: .trailing
                              ) :
                              LinearGradient(
                                gradient: Gradient(colors: [Color.gray.opacity(0.2), Color.gray.opacity(0.2)]),
                                startPoint: .leading,
                                endPoint: .trailing
                              )
                        )
                        .frame(height: 4)
                }
            }
            .padding(.horizontal)
            
            Text("Step \(currentStep) of \(totalSteps)")
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(.secondary)
        }
        .padding(.vertical, 20)
        .background(
            ZStack {
                Color.white.opacity(0.1)
                Rectangle()
                    .fill(.ultraThinMaterial)
            }
        )
    }
}

// MARK: - Setup Footer

struct SetupFooter: View {
    let currentStep: Int
    let totalSteps: Int
    let isSaving: Bool
    let canGoNext: Bool
    let onBack: () -> Void
    let onNext: () -> Void
    let onComplete: () -> Void
    
    var body: some View {
        HStack(spacing: 16) {
            Button(action: onBack) {
                HStack {
                    Image(systemName: "chevron.left")
                    Text("Back")
                }
                .font(.system(size: 16, weight: .semibold))
                .foregroundColor(.primary)
                .frame(maxWidth: .infinity)
                .padding()
                .background(
                    RoundedRectangle(cornerRadius: 16)
                        .fill(.ultraThinMaterial)
                )
            }
            .frame(maxWidth: .infinity)
            
            if currentStep < totalSteps {
                Button(action: onNext) {
                    HStack {
                        Text("Next")
                        Image(systemName: "chevron.right")
                    }
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(
                        Capsule()
                            .fill(
                                LinearGradient(
                                    gradient: Gradient(colors: [
                                        Color.green.opacity(canGoNext ? 0.8 : 0.4),
                                        Color.teal.opacity(canGoNext ? 0.8 : 0.4)
                                    ]),
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                    )
                }
                .disabled(!canGoNext)
                .frame(maxWidth: .infinity)
            } else {
                Button(action: onComplete) {
                    HStack {
                        if isSaving {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        } else {
                            Text("Complete")
                            Image(systemName: "checkmark.circle.fill")
                        }
                    }
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(
                        Capsule()
                            .fill(
                                LinearGradient(
                                    gradient: Gradient(colors: [
                                        Color.green.opacity(0.8),
                                        Color.teal.opacity(0.8)
                                    ]),
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                    )
                }
                .disabled(isSaving)
                .frame(maxWidth: .infinity)
            }
        }
        .padding()
        .background(
            Rectangle()
                .fill(.ultraThinMaterial)
        )
    }
}

#Preview {
    HomeSetupWizard()
}

