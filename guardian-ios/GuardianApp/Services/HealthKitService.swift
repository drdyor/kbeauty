import Foundation
import HealthKit
import UIKit

// MARK: - HealthKit Service
// FEEDBACK: Simplified for MVP - focus on SLEEP DURATION only
// Optional: Resting HR comparison

class HealthKitService: ObservableObject {
    private let healthStore = HKHealthStore()
    
    @Published var authorizationStatus: Bool = false
    @Published var lastSleepDuration: Double? = nil // hours
    @Published var restingHR: Int? = nil
    @Published var restingHRBaseline: Int? = nil
    
    private let sleepType = HKObjectType.categoryType(forIdentifier: .sleepAnalysis)!
    private let restingHRType = HKObjectType.quantityType(forIdentifier: .restingHeartRate)!
    
    init() {
        checkAvailability()
    }
    
    // MARK: - Availability
    
    func checkAvailability() {
        guard HKHealthStore.isHealthDataAvailable() else {
            print("⚠️ HealthKit not available on this device")
            return
        }
        print("✅ HealthKit available")
    }
    
    // MARK: - Authorization
    
    func requestAuthorization() async -> Bool {
        let readTypes: Set<HKObjectType> = [sleepType, restingHRType]
        
        do {
            try await healthStore.requestAuthorization(toShare: [], read: readTypes)
            await MainActor.run {
                self.authorizationStatus = true
            }
            print("✅ HealthKit authorized")
            return true
        } catch {
            print("❌ HealthKit authorization error: \(error)")
            return false
        }
    }
    
    // MARK: - Fetch Sleep Data (MVP Focus)
    
    func fetchLastNightSleep() async -> Double? {
        let calendar = Calendar.current
        let now = Date()
        
        // Get sleep from last 24 hours
        let startOfYesterday = calendar.date(byAdding: .day, value: -1, to: calendar.startOfDay(for: now))!
        let endDate = now
        
        let predicate = HKQuery.predicateForSamples(
            withStart: startOfYesterday,
            end: endDate,
            options: .strictStartDate
        )
        
        return await withCheckedContinuation { continuation in
            let query = HKSampleQuery(
                sampleType: sleepType,
                predicate: predicate,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)]
            ) { _, samples, error in
                
                if let error = error {
                    print("❌ Sleep query error: \(error)")
                    continuation.resume(returning: nil)
                    return
                }
                
                guard let sleepSamples = samples as? [HKCategorySample] else {
                    continuation.resume(returning: nil)
                    return
                }
                
                // Filter for "inBed" or "asleep" samples
                let asleepSamples = sleepSamples.filter { sample in
                    let value = HKCategoryValueSleepAnalysis(rawValue: sample.value)
                    return value == .asleep || value == .inBed
                }
                
                // Calculate total sleep duration
                let totalSeconds = asleepSamples.reduce(0.0) { total, sample in
                    total + sample.endDate.timeIntervalSince(sample.startDate)
                }
                
                let hours = totalSeconds / 3600.0
                
                print("✅ Sleep duration: \(String(format: "%.1f", hours)) hours")
                
                continuation.resume(returning: hours)
            }
            
            healthStore.execute(query)
        }
    }
    
    // MARK: - Fetch Resting HR (Optional for MVP)
    
    func fetchRestingHR() async -> Int? {
        let calendar = Calendar.current
        let now = Date()
        let startOfToday = calendar.startOfDay(for: now)
        
        let predicate = HKQuery.predicateForSamples(
            withStart: startOfToday,
            end: now,
            options: .strictStartDate
        )
        
        return await withCheckedContinuation { continuation in
            let query = HKStatisticsQuery(
                quantityType: restingHRType,
                quantitySamplePredicate: predicate,
                options: .discreteAverage
            ) { _, statistics, error in
                
                if let error = error {
                    print("❌ Resting HR query error: \(error)")
                    continuation.resume(returning: nil)
                    return
                }
                
                guard let average = statistics?.averageQuantity() else {
                    continuation.resume(returning: nil)
                    return
                }
                
                let bpm = Int(average.doubleValue(for: HKUnit.count().unitDivided(by: .minute())))
                print("✅ Resting HR: \(bpm) bpm")
                
                continuation.resume(returning: bpm)
            }
            
            healthStore.execute(query)
        }
    }
    
    // MARK: - Compute Body State (FEEDBACK: Simple MVP logic)
    
    func computeBodyState() async -> BodyState {
        // Fetch sleep data
        let sleepHours = await fetchLastNightSleep()
        await MainActor.run {
            self.lastSleepDuration = sleepHours
        }
        
        // Optional: Fetch resting HR
        let hr = await fetchRestingHR()
        await MainActor.run {
            self.restingHR = hr
        }
        
        // Get baseline (compute from historical data or use default)
        let baseline = restingHRBaseline ?? 60
        
        // Compute state using simple logic
        return BodyState.compute(
            sleepHours: sleepHours,
            restingHR: hr,
            baseline: baseline
        )
    }
    
    // MARK: - Baseline Calculation (Run once per week)
    
    func calculateRestingHRBaseline() async {
        let calendar = Calendar.current
        let now = Date()
        let sevenDaysAgo = calendar.date(byAdding: .day, value: -7, to: now)!
        
        let predicate = HKQuery.predicateForSamples(
            withStart: sevenDaysAgo,
            end: now,
            options: .strictStartDate
        )
        
        let baseline = await withCheckedContinuation { continuation in
            let query = HKStatisticsQuery(
                quantityType: restingHRType,
                quantitySamplePredicate: predicate,
                options: .discreteAverage
            ) { _, statistics, error in
                
                if let error = error {
                    print("❌ Baseline HR query error: \(error)")
                    continuation.resume(returning: nil)
                    return
                }
                
                guard let average = statistics?.averageQuantity() else {
                    continuation.resume(returning: nil)
                    return
                }
                
                let bpm = Int(average.doubleValue(for: HKUnit.count().unitDivided(by: .minute())))
                print("✅ Resting HR baseline (7-day): \(bpm) bpm")
                
                continuation.resume(returning: bpm)
            }
            
            healthStore.execute(query)
        }
        
        if let baseline = baseline {
            await MainActor.run {
                self.restingHRBaseline = baseline
            }
            UserDefaults.standard.set(baseline, forKey: "guardian_resting_hr_baseline")
        }
    }
}
