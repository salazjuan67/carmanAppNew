import UserNotifications

/// Pass-through NSE (no OneSignal SDK). Exists so EAS can sign the extension
/// target already registered for this app without linking OneSignal into the main binary.
/// Always call contentHandler: if iOS launches the NSE (mutable-content) and we
/// skip it, the banner is dropped when the app is killed.
class NotificationService: UNNotificationServiceExtension {
  var contentHandler: ((UNNotificationContent) -> Void)?
  var bestAttemptContent: UNNotificationContent?

  override func didReceive(
    _ request: UNNotificationRequest,
    withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void
  ) {
    self.contentHandler = contentHandler
    let content =
      (request.content.mutableCopy() as? UNMutableNotificationContent) ?? request.content
    bestAttemptContent = content
    contentHandler(content)
  }

  override func serviceExtensionTimeWillExpire() {
    if let contentHandler {
      contentHandler(bestAttemptContent ?? UNNotificationContent())
    }
  }
}
