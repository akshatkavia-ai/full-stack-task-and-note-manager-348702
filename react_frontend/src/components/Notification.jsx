const notificationLabels = {
  error: "Error",
  success: "Success"
};

// PUBLIC_INTERFACE
/**
 * Displays a status message in the application notification region.
 *
 * @param {{ notification: { type: "error" | "success", message: string } | null, onDismiss: () => void }} props - Notification state and dismiss handler.
 * @returns {JSX.Element|null} The accessible notification, or nothing when absent.
 */
export default function Notification({ notification, onDismiss }) {
  if (!notification) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      className={`notification notification--${notification.type}`}
      role="status"
    >
      <div>
        <strong>{notificationLabels[notification.type] || "Notice"}:</strong>{" "}
        {notification.message}
      </div>
      <button
        aria-label="Dismiss notification"
        className="icon-button"
        onClick={onDismiss}
        type="button"
      >
        ×
      </button>
    </div>
  );
}
