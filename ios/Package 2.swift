// swift-tools-version: 5.9
// Package.swift for Copse iOS App - Pack 1703 Portal

import PackageDescription

let package = Package(
    name: "Copse",
    platforms: [
        .iOS(.v16)
    ],
    products: [
        .library(
            name: "Copse",
            targets: ["Copse"]
        )
    ],
    dependencies: [
        // Firebase iOS SDK
        .package(
            url: "https://github.com/firebase/firebase-ios-sdk.git",
            from: "10.20.0"
        )
    ],
    targets: [
        .target(
            name: "Copse",
            dependencies: [
                .product(name: "FirebaseAuth", package: "firebase-ios-sdk"),
                .product(name: "FirebaseFirestore", package: "firebase-ios-sdk"),
                .product(name: "FirebaseStorage", package: "firebase-ios-sdk"),
                .product(name: "FirebaseFunctions", package: "firebase-ios-sdk"),
                .product(name: "FirebaseMessaging", package: "firebase-ios-sdk")
            ]
        ),
        .testTarget(
            name: "CopseTests",
            dependencies: ["Copse"]
        )
    ]
)

