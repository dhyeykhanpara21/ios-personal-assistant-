// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "SiriLife",
    platforms: [
        .iOS(.v16),
        .macOS(.v13)
    ],
    products: [
        .library(
            name: "SiriLife",
            targets: ["SiriLife"]
        ),
    ],
    dependencies: [],
    targets: [
        .target(
            name: "SiriLife",
            dependencies: [],
            path: "SiriLife",
            resources: [
                .process("Resources")
            ]
        ),
        .testTarget(
            name: "SiriLifeTests",
            dependencies: ["SiriLife"],
            path: "SiriLifeTests"
        ),
    ]
)
