import Foundation
import UIKit

#if canImport(WidgetKit)
import WidgetKit
#endif

// MARK: - Shared Store
// CRITICAL: iOS native app is the ONLY writer to guardian_state.json
// Web app requests updates via bridge, widgets are read-only consumers
// This uses App Group CONTAINER FILE (not UserDefaults) for better reliability with widgets

class SharedStore {
    static let shared = SharedStore()
    
    // CHANGE THIS to match your bundle ID:
    private let appGroupID = "group.com.drdyor.bodyboundary.shared"
    private let stateFileName = "guardian_state.json"
    
    private var containerURL: URL? {
        FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroupID)
    }
    
    private var stateFileURL: URL? {
        containerURL?.appendingPathComponent(stateFileName)
    }
    
    private init() {
        // Ensure container exists
        if let url = containerURL {
            print("✅ App Group container: \(url.path)")
        } else {
            print("❌ Failed to access App Group container. Check entitlements.")
        }
    }
    
    // MARK: - Write State (iOS Native Only)
    
    func writeState(_ state: GuardianState) {
        guard let fileURL = stateFileURL else {
            print("❌ Cannot write state: no file URL")
            return
        }
        
        do {
            let encoder = JSONEncoder()
            encoder.dateEncodingStrategy = .iso8601
            encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
            
            let data = try encoder.encode(state)
            try data.write(to: fileURL, options: .atomic)
            
            print("✅ Guardian state written: \(fileURL.path)")
            
            // Notify widgets to refresh
            notifyWidgets()
        } catch {
            print("❌ Failed to write state: \(error)")
        }
    }
    
    // MARK: - Read State (All Components)
    
    func readState() -> GuardianState? {
        guard let fileURL = stateFileURL else {
            print("❌ Cannot read state: no file URL")
            return nil
        }
        
        guard FileManager.default.fileExists(atPath: fileURL.path) else {
            print("⚠️ State file does not exist yet")
            return nil
        }
        
        do {
            let data = try Data(contentsOf: fileURL)
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            
            let state = try decoder.decode(GuardianState.self, from: data)
            print("✅ Guardian state read successfully")
            return state
        } catch {
            print("❌ Failed to read state: \(error)")
            return nil
        }
    }
    
    // MARK: - Notify Widgets
    
    private func notifyWidgets() {
        #if canImport(WidgetKit)
        WidgetCenter.shared.reloadAllTimelines()
        print("📱 Widgets notified to reload")
        #endif
    }
    
    // MARK: - Quick Update Methods
    
    func updateNextEvent(_ event: CalendarEvent?) {
        var currentState = readState() ?? createEmptyState()
        currentState = GuardianState(
            nextEvent: event,
            privateTiles: currentState.privateTiles,
            suggestedAction: currentState.suggestedAction,
            bodyState: currentState.bodyState,
            updatedAt: Date(),
            activeSession: currentState.activeSession
        )
        writeState(currentState)
    }
    
    func updateBodyState(_ bodyState: BodyState) {
        var currentState = readState() ?? createEmptyState()
        currentState = GuardianState(
            nextEvent: currentState.nextEvent,
            privateTiles: currentState.privateTiles,
            suggestedAction: currentState.suggestedAction,
            bodyState: bodyState,
            updatedAt: Date(),
            activeSession: currentState.activeSession
        )
        writeState(currentState)
    }
    
    func updateActiveSession(_ session: ActiveSession?) {
        var currentState = readState() ?? createEmptyState()
        currentState = GuardianState(
            nextEvent: currentState.nextEvent,
            privateTiles: currentState.privateTiles,
            suggestedAction: currentState.suggestedAction,
            bodyState: currentState.bodyState,
            updatedAt: Date(),
            activeSession: session
        )
        writeState(currentState)
    }
    
    func addPrivateTile(_ tile: PrivateTile) {
        var currentState = readState() ?? createEmptyState()
        var tiles = currentState.privateTiles
        
        // Replace if exists, otherwise append
        if let index = tiles.firstIndex(where: { $0.id == tile.id }) {
            tiles[index] = tile
        } else {
            tiles.append(tile)
        }
        
        currentState = GuardianState(
            nextEvent: currentState.nextEvent,
            privateTiles: tiles,
            suggestedAction: currentState.suggestedAction,
            bodyState: currentState.bodyState,
            updatedAt: Date(),
            activeSession: currentState.activeSession
        )
        writeState(currentState)
    }
    
    // MARK: - Helpers
    
    private func createEmptyState() -> GuardianState {
        return GuardianState(
            nextEvent: nil,
            privateTiles: [],
            suggestedAction: nil,
            bodyState: nil,
            updatedAt: Date(),
            activeSession: nil
        )
    }
    
    // MARK: - Debug
    
    func printState() {
        if let state = readState() {
            print("=== Guardian State ===")
            print("Updated: \(state.updatedAt)")
            print("Next Event: \(state.nextEvent?.title ?? "None")")
            print("Private Tiles: \(state.privateTiles.count)")
            print("Body State: \(state.bodyState?.badgeText ?? "Unknown")")
            print("Active Session: \(state.activeSession?.focusModeLabel ?? "None")")
            print("===================")
        } else {
            print("⚠️ No state available")
        }
    }
}
