/**
 * Enhanced Product Notifications System - Style 1 Integration
 * Features: Toast notifications, accessibility, rich content support
 */

import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from "lucide-react";
import type React from "react";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title?: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationContextValue {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, "id">) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}

interface NotificationProviderProps {
  children: React.ReactNode;
  maxNotifications?: number;
  defaultDuration?: number;
}

export function NotificationProvider({
  children,
  maxNotifications = 5,
  defaultDuration = 5000,
}: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback(
    (notification: Omit<Notification, "id">) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newNotification: Notification = {
        ...notification,
        id,
        duration: notification.duration ?? defaultDuration,
      };

      setNotifications((prev) => {
        const updated = [newNotification, ...prev];
        // Keep only the most recent notifications
        return updated.slice(0, maxNotifications);
      });

      // Auto-remove non-persistent notifications
      if (!newNotification.persistent && newNotification.duration && newNotification.duration > 0) {
        setTimeout(() => {
          removeNotification(id);
        }, newNotification.duration);
      }
    },
    [maxNotifications, defaultDuration],
  );

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const value: NotificationContextValue = {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
}

function NotificationContainer() {
  const { notifications } = useNotifications();

  if (notifications.length === 0) return null;

  return (
    <div
      className="fixed top-4 right-4 z-toast space-y-3 pointer-events-none"
      aria-live="polite"
      aria-label="Notifications"
    >
      {notifications.map((notification) => (
        <NotificationItem key={notification.id} notification={notification} />
      ))}
    </div>
  );
}

interface NotificationItemProps {
  notification: Notification;
}

function NotificationItem({ notification }: NotificationItemProps) {
  const { removeNotification } = useNotifications();
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Animation management
  useEffect(() => {
    // Trigger enter animation
    setTimeout(() => setIsVisible(true), 50);
  }, []);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      removeNotification(notification.id);
    }, 200);
  }, [notification.id, removeNotification]);

  const handleAction = useCallback(() => {
    if (notification.action) {
      notification.action.onClick();
      handleClose();
    }
  }, [notification.action, handleClose]);

  const iconMap = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const colorMap = {
    success: "text-green-600 dark:text-green-400",
    error: "text-red-600 dark:text-red-400",
    warning: "text-amber-600 dark:text-amber-400",
    info: "text-blue-600 dark:text-blue-400",
  };

  const bgColorMap = {
    success: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
    error: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
    warning: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
    info: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
  };

  const Icon = iconMap[notification.type];

  return (
    <div
      className={cn(
        "pointer-events-auto max-w-md w-full",
        "transform transition-all duration-300 ease-out",
        isVisible && !isExiting
          ? "translate-x-0 opacity-100 scale-100"
          : "translate-x-full opacity-0 scale-95",
      )}
      role="alert"
      aria-live="assertive"
    >
      <div className={cn("p-4 border rounded-lg shadow-lg", bgColorMap[notification.type])}>
        <div className="flex items-start">
          {/* Icon */}
          <div className={cn("shrink-0 mr-3 mt-0.5", colorMap[notification.type])}>
            <Icon className="w-5 h-5" aria-hidden="true" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {notification.title && (
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                {notification.title}
              </h4>
            )}
            <p className="text-sm text-gray-700 dark:text-gray-300">{notification.message}</p>

            {/* Action Button */}
            {notification.action && (
              <div className="mt-3">
                <button
                  onClick={handleAction}
                  className={cn(
                    "text-sm font-medium px-3 py-1.5 rounded-md",
                    "hover:bg-white/50 dark:hover:bg-gray-800/50",
                    "focus:outline-hidden focus:ring-2 focus:ring-offset-1",
                    "transition-colors duration-200",
                    colorMap[notification.type],
                  )}
                >
                  {notification.action.label}
                </button>
              </div>
            )}
          </div>

          {/* Close Button */}
          <div className="shrink-0 ml-3">
            <button
              onClick={handleClose}
              className={cn(
                "inline-flex rounded-md p-1.5",
                "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300",
                "hover:bg-gray-100 dark:hover:bg-gray-800",
                "focus:outline-hidden focus:ring-2 focus:ring-offset-1 focus:ring-gray-500",
                "transition-colors duration-200",
              )}
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar for timed notifications */}
        {!notification.persistent && notification.duration && notification.duration > 0 && (
          <div className="mt-3 bg-gray-200 dark:bg-gray-700 rounded-full h-1 overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all ease-linear", {
                "bg-green-500": notification.type === "success",
                "bg-red-500": notification.type === "error",
                "bg-amber-500": notification.type === "warning",
                "bg-blue-500": notification.type === "info",
              })}
              style={{
                animation: `shrink ${notification.duration}ms linear`,
                transformOrigin: "left center",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Utility hooks for common notification types
export function useSuccessNotification() {
  const { addNotification } = useNotifications();

  return useCallback(
    (message: string, title?: string, options?: Partial<Omit<Notification, "id" | "type">>) => {
      addNotification({
        type: "success",
        message,
        title,
        ...options,
      });
    },
    [addNotification],
  );
}

export function useErrorNotification() {
  const { addNotification } = useNotifications();

  return useCallback(
    (message: string, title?: string, options?: Partial<Omit<Notification, "id" | "type">>) => {
      addNotification({
        type: "error",
        message,
        title,
        persistent: true, // Errors should be persistent by default
        ...options,
      });
    },
    [addNotification],
  );
}

export function useInfoNotification() {
  const { addNotification } = useNotifications();

  return useCallback(
    (message: string, title?: string, options?: Partial<Omit<Notification, "id" | "type">>) => {
      addNotification({
        type: "info",
        message,
        title,
        ...options,
      });
    },
    [addNotification],
  );
}

export function useWarningNotification() {
  const { addNotification } = useNotifications();

  return useCallback(
    (message: string, title?: string, options?: Partial<Omit<Notification, "id" | "type">>) => {
      addNotification({
        type: "warning",
        message,
        title,
        ...options,
      });
    },
    [addNotification],
  );
}

// Add CSS animation for progress bar
const styles = `
@keyframes shrink {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}
`;

// Inject styles into document head
if (typeof document !== "undefined") {
  const styleElement = document.createElement("style");
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
}

export default NotificationProvider;
