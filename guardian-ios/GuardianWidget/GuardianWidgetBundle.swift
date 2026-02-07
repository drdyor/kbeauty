import WidgetKit
import SwiftUI

@main
struct GuardianWidgetBundle: WidgetBundle {
    var body: some Widget {
        HomeScreenWidget()
        LockScreenWidget()
    }
}
