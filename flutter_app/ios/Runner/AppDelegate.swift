import CoreLocation
import Flutter
import UIKit

@main
@objc class AppDelegate: FlutterAppDelegate, FlutterImplicitEngineDelegate {
  private var headingChannel: FlutterEventChannel?
  private var headingStreamHandler: HeadingStreamHandler?

  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  func didInitializeImplicitFlutterEngine(_ engineBridge: FlutterImplicitEngineBridge) {
    GeneratedPluginRegistrant.register(with: engineBridge.pluginRegistry)
    let channel = FlutterEventChannel(
      name: "stampy/heading",
      binaryMessenger: engineBridge.applicationRegistrar.messenger()
    )
    let streamHandler = HeadingStreamHandler()
    channel.setStreamHandler(streamHandler)
    headingChannel = channel
    headingStreamHandler = streamHandler
  }
}

private final class HeadingStreamHandler: NSObject, FlutterStreamHandler,
  CLLocationManagerDelegate
{
  private let locationManager = CLLocationManager()
  private var eventSink: FlutterEventSink?

  override init() {
    super.init()
    locationManager.delegate = self
    locationManager.headingOrientation = .portrait
    locationManager.headingFilter = 3
  }

  func onListen(
    withArguments arguments: Any?,
    eventSink events: @escaping FlutterEventSink
  ) -> FlutterError? {
    stopHeadingUpdates()
    eventSink = events

    guard CLLocationManager.headingAvailable() else {
      finishUnavailable(events)
      return nil
    }

    locationManager.startUpdatingHeading()
    return nil
  }

  func onCancel(withArguments arguments: Any?) -> FlutterError? {
    stopHeadingUpdates()
    return nil
  }

  func locationManager(
    _ manager: CLLocationManager,
    didUpdateHeading newHeading: CLHeading
  ) {
    guard newHeading.headingAccuracy.isFinite, newHeading.headingAccuracy >= 0 else {
      eventSink?(nil)
      return
    }

    let trueHeading = newHeading.trueHeading
    let magneticHeading = newHeading.magneticHeading
    let heading = isValid(trueHeading) ? trueHeading : magneticHeading
    eventSink?(isValid(heading) ? normalize(heading) : nil)
  }

  func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
    eventSink?(nil)
  }

  private func isValid(_ heading: CLLocationDirection) -> Bool {
    heading.isFinite && heading >= 0 && heading < 360
  }

  private func normalize(_ heading: CLLocationDirection) -> CLLocationDirection {
    (heading.truncatingRemainder(dividingBy: 360) + 360)
      .truncatingRemainder(dividingBy: 360)
  }

  private func finishUnavailable(_ events: @escaping FlutterEventSink) {
    events(nil)
    events(FlutterEndOfEventStream)
    eventSink = nil
  }

  private func stopHeadingUpdates() {
    locationManager.stopUpdatingHeading()
    eventSink = nil
  }
}
