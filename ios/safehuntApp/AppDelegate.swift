import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import GoogleMaps
import AuthenticationServices
import SafariServices
import FBSDKCoreKit
// import RNFBMessaging
import Firebase
import UserNotifications

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    FirebaseApp.configure()

    // Facebook SDK Initialization
    ApplicationDelegate.shared.application(
      application,
      didFinishLaunchingWithOptions: launchOptions
    )

    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    // RNFirebase Messaging (isHeadless support)
    // let initialProps = RNFBMessagingModule.addCustomProps(
    //   toUserProps: nil,
    //   withLaunchOptions: launchOptions
    // )
    // Pass props to React Native
    // delegate.initialProps = initialProps

    GMSServices.provideAPIKey("AIzaSyDfERDiOAjbLmRs1XZYleJhmr7GJQ6lPaM")

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "safehuntApp",
      in: window,
      launchOptions: launchOptions
    )

    UNUserNotificationCenter.current().delegate = self
    application.registerForRemoteNotifications()

    return true
  }

  // Facebook Login Callback
  func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey : Any] = [:]
  ) -> Bool {

    if ApplicationDelegate.shared.application(
      app,
      open: url,
      options: options
    ) {
      return true
    }

    return false
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {

  // var initialProps: [AnyHashable: Any]?

  override func sourceURL(for bridge: RCTBridge) -> URL? {
    bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }

  // override func prepareInitialProps() -> [AnyHashable : Any]! {
  //   return initialProps ?? [:]
  // }
}

extension AppDelegate: UNUserNotificationCenterDelegate {

  func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    willPresent notification: UNNotification,
    withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
  ) {
    completionHandler([.banner, .sound, .badge])
  }
}