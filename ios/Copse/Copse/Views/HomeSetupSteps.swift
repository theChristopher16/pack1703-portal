//
//  HomeSetupSteps.swift
//  Copse
//
//  Individual steps for the home setup wizard
//  Beautiful glassmorphism design for each step
//

import SwiftUI

// MARK: - Step 1: Welcome & Basic Info

struct Step1_Welcome: View {
    @Binding var formData: HomeSetupData
    
    var body: some View {
        VStack(spacing: 32) {
            // Header
            VStack(spacing: 12) {
                Image(systemName: "house.fill")
                    .font(.system(size: 60))
                    .foregroundStyle(
                        LinearGradient(
                            gradient: Gradient(colors: [Color.green.opacity(0.8), Color.teal.opacity(0.8)]),
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                
                Text("Let's Set Up Your Home")
                    .font(.system(size: 28, weight: .bold))
                    .foregroundColor(.primary)
                
                Text("We'll help you get started by gathering some basic information about your household")
                    .font(.system(size: 16))
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
            }
            
            // Form
            VStack(spacing: 20) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Household Name *")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(.primary)
                    
                    TextField("e.g., Smith Family, My Home", text: $formData.householdName)
                        .textFieldStyle(.plain)
                        .font(.system(size: 17))
                        .padding()
                        .background(
                            RoundedRectangle(cornerRadius: 12)
                                .fill(.ultraThinMaterial)
                        )
                    
                    Text("This is just for you - make it personal!")
                        .font(.system(size: 13))
                        .foregroundColor(.secondary)
                }
                
                VStack(alignment: .leading, spacing: 8) {
                    Text("Home Address (Optional)")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(.primary)
                    
                    TextField("123 Main Street, City, State", text: $formData.address)
                        .textFieldStyle(.plain)
                        .font(.system(size: 17))
                        .padding()
                        .background(
                            RoundedRectangle(cornerRadius: 12)
                                .fill(.ultraThinMaterial)
                        )
                }
            }
            .padding(.horizontal)
            
            Spacer()
        }
        .padding(.top, 40)
    }
}

// MARK: - Step 2: Household Members

struct Step2_Members: View {
    @Binding var formData: HomeSetupData
    
    var body: some View {
        VStack(spacing: 24) {
            // Header
            VStack(spacing: 12) {
                Image(systemName: "person.2.fill")
                    .font(.system(size: 50))
                    .foregroundColor(.green)
                
                Text("Who Lives Here?")
                    .font(.system(size: 26, weight: .bold))
                    .foregroundColor(.primary)
                
                Text("Add household members (you can add children separately later)")
                    .font(.system(size: 15))
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
            
            // Members list
            VStack(spacing: 12) {
                ForEach($formData.members) { $member in
                    HStack(spacing: 12) {
                        TextField("Name", text: $member.name)
                            .textFieldStyle(.plain)
                            .font(.system(size: 16))
                            .padding()
                            .background(
                                RoundedRectangle(cornerRadius: 12)
                                    .fill(.ultraThinMaterial)
                            )
                        
                        TextField("Relationship", text: $member.relationship)
                            .textFieldStyle(.plain)
                            .font(.system(size: 16))
                            .padding()
                            .frame(width: 140)
                            .background(
                                RoundedRectangle(cornerRadius: 12)
                                    .fill(.ultraThinMaterial)
                            )
                        
                        if formData.members.count > 1 {
                            Button(action: {
                                formData.members.removeAll { $0.id == member.id }
                            }) {
                                Image(systemName: "minus.circle.fill")
                                    .font(.system(size: 24))
                                    .foregroundColor(.red)
                            }
                        }
                    }
                }
                
                Button(action: {
                    formData.members.append(MemberInput(name: "", relationship: ""))
                }) {
                    HStack {
                        Image(systemName: "plus.circle.fill")
                        Text("Add Member")
                    }
                    .font(.system(size: 15, weight: .medium))
                    .foregroundColor(.green)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(
                        RoundedRectangle(cornerRadius: 12)
                            .fill(.ultraThinMaterial)
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(Color.green.opacity(0.3), lineWidth: 2)
                            )
                    )
                }
            }
            .padding(.horizontal)
            
            Spacer()
        }
        .padding(.top, 20)
    }
}

// MARK: - Step 3: Rooms

struct Step3_Rooms: View {
    @Binding var formData: HomeSetupData
    
    var body: some View {
        VStack(spacing: 24) {
            // Header
            VStack(spacing: 12) {
                Image(systemName: "door.left.hand.open")
                    .font(.system(size: 50))
                    .foregroundColor(.purple)
                
                Text("Your Rooms & Spaces")
                    .font(.system(size: 26, weight: .bold))
                    .foregroundColor(.primary)
                
                Text("Select the rooms you have (you can add more later)")
                    .font(.system(size: 15))
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
            
            // Common rooms grid
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 12) {
                ForEach($formData.rooms) { $room in
                    RoomToggleCard(room: $room)
                }
            }
            .padding(.horizontal)
            
            Spacer()
        }
        .padding(.top, 20)
    }
}

struct RoomToggleCard: View {
    @Binding var room: RoomInput
    @State private var isSelected = true
    
    var body: some View {
        Button(action: {
            isSelected.toggle()
        }) {
            VStack(spacing: 12) {
                ZStack {
                    RoundedRectangle(cornerRadius: 12)
                        .fill(
                            isSelected ?
                            LinearGradient(
                                gradient: Gradient(colors: [Color.purple.opacity(0.8), Color.blue.opacity(0.6)]),
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ) :
                            LinearGradient(
                                gradient: Gradient(colors: [Color.gray.opacity(0.2), Color.gray.opacity(0.2)]),
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 50, height: 50)
                    
                    Image(systemName: room.icon)
                        .font(.system(size: 24))
                        .foregroundColor(isSelected ? .white : .gray)
                }
                
                Text(room.name)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(.primary)
            }
            .padding(16)
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(.ultraThinMaterial)
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(isSelected ? Color.purple.opacity(0.5) : Color.gray.opacity(0.2), lineWidth: 2)
                    )
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Step 4: Vehicles & Pets

struct Step4_VehiclesPets: View {
    @Binding var formData: HomeSetupData
    
    var body: some View {
        VStack(spacing: 32) {
            // Header
            VStack(spacing: 12) {
                HStack(spacing: 20) {
                    Image(systemName: "car.fill")
                        .font(.system(size: 40))
                        .foregroundColor(.blue)
                    Image(systemName: "pawprint.fill")
                        .font(.system(size: 40))
                        .foregroundColor(.orange)
                }
                
                Text("Vehicles & Pets")
                    .font(.system(size: 26, weight: .bold))
                    .foregroundColor(.primary)
                
                Text("Do you have vehicles or pets to manage?")
                    .font(.system(size: 15))
                    .foregroundColor(.secondary)
            }
            
            // Options
            VStack(spacing: 16) {
                ToggleOptionCard(
                    icon: "car.fill",
                    title: "Manage Vehicles",
                    description: "Track maintenance, mileage, and expenses",
                    color: .blue,
                    isOn: $formData.hasVehicles
                )
                
                ToggleOptionCard(
                    icon: "pawprint.fill",
                    title: "Manage Pets",
                    description: "Track vet appointments and medications",
                    color: .orange,
                    isOn: $formData.hasPets
                )
            }
            .padding(.horizontal)
            
            Spacer()
        }
        .padding(.top, 40)
    }
}

struct ToggleOptionCard: View {
    let icon: String
    let title: String
    let description: String
    let color: Color
    @Binding var isOn: Bool
    
    var body: some View {
        Button(action: {
            withAnimation(.spring(response: 0.3)) {
                isOn.toggle()
            }
        }) {
            HStack(spacing: 16) {
                ZStack {
                    RoundedRectangle(cornerRadius: 12)
                        .fill(
                            LinearGradient(
                                gradient: Gradient(colors: [
                                    color.opacity(isOn ? 0.8 : 0.3),
                                    color.opacity(isOn ? 0.6 : 0.2)
                                ]),
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 50, height: 50)
                    
                    Image(systemName: icon)
                        .font(.system(size: 24))
                        .foregroundColor(.white)
                }
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(title)
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundColor(.primary)
                    
                    Text(description)
                        .font(.system(size: 13))
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                Image(systemName: isOn ? "checkmark.circle.fill" : "circle")
                    .font(.system(size: 28))
                    .foregroundColor(isOn ? .green : .gray.opacity(0.3))
            }
            .padding(20)
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(.ultraThinMaterial)
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(isOn ? color.opacity(0.4) : Color.gray.opacity(0.1), lineWidth: 2)
                    )
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Step 5: Children

struct Step5_Children: View {
    @Binding var formData: HomeSetupData
    
    var body: some View {
        VStack(spacing: 24) {
            // Header
            VStack(spacing: 12) {
                Image(systemName: "figure.and.child.holdinghands")
                    .font(.system(size: 50))
                    .foregroundColor(.pink)
                
                Text("Add Children (Optional)")
                    .font(.system(size: 26, weight: .bold))
                    .foregroundColor(.primary)
                
                Text("Add children to your household for chore assignments and calendar management")
                    .font(.system(size: 15))
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
            }
            
            if formData.children.isEmpty {
                VStack(spacing: 16) {
                    Text("No children added yet")
                        .font(.system(size: 15))
                        .foregroundColor(.secondary)
                    
                    Button(action: {
                        formData.children.append(ChildInput(name: "", age: nil, grade: nil))
                    }) {
                        HStack {
                            Image(systemName: "plus.circle.fill")
                            Text("Add Child")
                        }
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(.white)
                        .padding(.horizontal, 24)
                        .padding(.vertical, 12)
                        .background(
                            Capsule()
                                .fill(
                                    LinearGradient(
                                        gradient: Gradient(colors: [Color.pink.opacity(0.8), Color.purple.opacity(0.6)]),
                                        startPoint: .leading,
                                        endPoint: .trailing
                                    )
                                )
                        )
                    }
                }
                .padding(.top, 40)
            } else {
                ScrollView {
                    VStack(spacing: 12) {
                        ForEach($formData.children) { $child in
                            ChildInputCard(child: $child, onRemove: {
                                formData.children.removeAll { $0.id == child.id }
                            })
                        }
                        
                        Button(action: {
                            formData.children.append(ChildInput(name: "", age: nil, grade: nil))
                        }) {
                            HStack {
                                Image(systemName: "plus.circle.fill")
                                Text("Add Another Child")
                            }
                            .font(.system(size: 15, weight: .medium))
                            .foregroundColor(.pink)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(
                                RoundedRectangle(cornerRadius: 12)
                                    .fill(.ultraThinMaterial)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 12)
                                            .stroke(Color.pink.opacity(0.3), lineWidth: 2)
                                    )
                            )
                        }
                    }
                }
                .padding(.horizontal)
            }
            
            Spacer()
        }
        .padding(.top, 20)
    }
}

struct ChildInputCard: View {
    @Binding var child: ChildInput
    let onRemove: () -> Void
    
    var body: some View {
        VStack(spacing: 12) {
            HStack {
                TextField("Child's Name", text: $child.name)
                    .textFieldStyle(.plain)
                    .font(.system(size: 17, weight: .medium))
                
                Button(action: onRemove) {
                    Image(systemName: "trash.fill")
                        .font(.system(size: 16))
                        .foregroundColor(.red)
                }
            }
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(.ultraThinMaterial)
            )
            
            HStack(spacing: 12) {
                TextField("Age", value: $child.age, format: .number)
                    .textFieldStyle(.plain)
                    .font(.system(size: 15))
                    .padding()
                    .background(
                        RoundedRectangle(cornerRadius: 12)
                            .fill(.ultraThinMaterial)
                    )
                    .frame(maxWidth: .infinity)
                
                TextField("Grade", text: Binding(
                    get: { child.grade ?? "" },
                    set: { child.grade = $0.isEmpty ? nil : $0 }
                ))
                    .textFieldStyle(.plain)
                    .font(.system(size: 15))
                    .padding()
                    .background(
                        RoundedRectangle(cornerRadius: 12)
                            .fill(.ultraThinMaterial)
                    )
                    .frame(maxWidth: .infinity)
            }
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(.ultraThinMaterial)
                .shadow(color: Color.pink.opacity(0.1), radius: 8, x: 0, y: 4)
        )
    }
}

// MARK: - Step 6: Complete

struct Step6_Complete: View {
    @Binding var formData: HomeSetupData
    
    var body: some View {
        VStack(spacing: 32) {
            VStack(spacing: 16) {
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 80))
                    .foregroundStyle(
                        LinearGradient(
                            gradient: Gradient(colors: [Color.green.opacity(0.8), Color.teal.opacity(0.8)]),
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                
                Text("All Set!")
                    .font(.system(size: 32, weight: .bold))
                    .foregroundColor(.primary)
                
                Text("Your home is ready")
                    .font(.system(size: 18))
                    .foregroundColor(.secondary)
            }
            
            // Summary
            VStack(spacing: 16) {
                SummaryRow(icon: "house.fill", title: "Home", value: formData.householdName, color: .green)
                SummaryRow(icon: "person.2.fill", title: "Members", value: "\(formData.members.filter { !$0.name.isEmpty }.count)", color: .blue)
                SummaryRow(icon: "door.left.hand.open", title: "Rooms", value: "\(formData.rooms.count)", color: .purple)
                
                if formData.hasVehicles {
                    SummaryRow(icon: "car.fill", title: "Vehicles", value: "Enabled", color: .blue)
                }
                
                if formData.hasPets {
                    SummaryRow(icon: "pawprint.fill", title: "Pets", value: "Enabled", color: .orange)
                }
                
                if !formData.children.isEmpty {
                    SummaryRow(icon: "figure.and.child.holdinghands", title: "Children", value: "\(formData.children.count)", color: .pink)
                }
            }
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(.ultraThinMaterial)
                    .shadow(color: Color.black.opacity(0.05), radius: 8, x: 0, y: 4)
            )
            .padding(.horizontal)
            
            Text("Tap 'Complete' to finish setup and access your home chat!")
                .font(.system(size: 14))
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
            
            Spacer()
        }
        .padding(.top, 40)
    }
}

struct SummaryRow: View {
    let icon: String
    let title: String
    let value: String
    let color: Color
    
    var body: some View {
        HStack(spacing: 16) {
            Image(systemName: icon)
                .font(.system(size: 20))
                .foregroundColor(color)
                .frame(width: 30)
            
            Text(title)
                .font(.system(size: 16))
                .foregroundColor(.secondary)
            
            Spacer()
            
            Text(value)
                .font(.system(size: 16, weight: .semibold))
                .foregroundColor(.primary)
        }
    }
}

// MARK: - Join Home View

struct JoinHomeView: View {
    let onComplete: () -> Void
    @State private var invitationCode = ""
    @State private var isJoining = false
    @State private var errorMessage: String?
    
    var body: some View {
        VStack(spacing: 32) {
            Spacer()
            
            VStack(spacing: 16) {
                Image(systemName: "envelope.open.fill")
                    .font(.system(size: 70))
                    .foregroundColor(.blue)
                
                Text("Join a Home")
                    .font(.system(size: 28, weight: .bold))
                    .foregroundColor(.primary)
                
                Text("Enter the invitation code you received")
                    .font(.system(size: 16))
                    .foregroundColor(.secondary)
            }
            
            VStack(spacing: 16) {
                TextField("Invitation Code", text: $invitationCode)
                    .textFieldStyle(.plain)
                    .font(.system(size: 20, weight: .medium))
                    .multilineTextAlignment(.center)
                    .padding()
                    .background(
                        RoundedRectangle(cornerRadius: 12)
                            .fill(.ultraThinMaterial)
                    )
                    .textCase(.uppercase)
                
                if let error = errorMessage {
                    Text(error)
                        .font(.system(size: 14))
                        .foregroundColor(.red)
                }
            }
            .padding(.horizontal, 30)
            
            Button(action: handleJoin) {
                HStack {
                    if isJoining {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: .white))
                    } else {
                        Text("Join Home")
                        Image(systemName: "arrow.right.circle.fill")
                    }
                }
                .font(.system(size: 17, weight: .semibold))
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding()
                .background(
                    Capsule()
                        .fill(
                            LinearGradient(
                                gradient: Gradient(colors: [Color.blue.opacity(0.8), Color.purple.opacity(0.6)]),
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                )
            }
            .disabled(isJoining || invitationCode.isEmpty)
            .padding(.horizontal, 30)
            
            Spacer()
        }
    }
    
    private func handleJoin() {
        isJoining = true
        errorMessage = nil
        
        Task {
            // TODO: Implement join logic
            try? await Task.sleep(nanoseconds: 1_000_000_000)
            
            await MainActor.run {
                isJoining = false
                // For now, just complete
                onComplete()
            }
        }
    }
}

#Preview {
    Step1_Welcome(formData: .constant(HomeSetupData()))
}

