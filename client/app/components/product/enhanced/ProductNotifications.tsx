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
  title?: string | undefined;
  message: string;
  duration?: number | undefined;
  persistent?: boolean | undefined;
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
  maxNotifications?: number | undefined;
  defaultDuration?: number | undefined;
}

export function NotificationProvider({
  children,
  maxNotifications = 5,
  defaultDuration = 5000,
}: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  }, []);

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
    [maxNotifications, defaultDuration, removeNotification],
  );

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
      className="pointer-events-none fixed top-4 right-4 z-toast space-y-3"
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
        "pointer-events-auto w-full max-w-md",
        "transform transition-all duration-300 ease-out",
        isVisible && !isExiting
          ? "translate-x-0 scale-100 opacity-100"
          : "translate-x-full scale-95 opacity-0",
      )}
      role="alert"
      aria-live="assertive"
    >
      <div className={cn("rounded-lg border p-4 shadow-lg", bgColorMap[notification.type])}>
        <div className="flex items-start">
          {/* Icon */}
          <div className={cn("mt-0.5 mr-3 shrink-0", colorMap[notification.type])}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            {notification.title && (
              <h4 className="mb-1 font-semibold text-foreground text-sm dark:text-foreground">
                {notification.title}
              </h4>
            )}
            <p className="text-foreground/80 text-sm dark:text-muted-foreground/50">
              {notification.message}
            </p>

            {/* Action Button */}
            {notification.action && (
              <div className="mt-3">
                <button
                  onClick={handleAction}
                  className={cn(
                    "rounded-md px-3 py-1.5 font-medium text-sm",
                    "hover:bg-white/50 dark:hover:bg-muted/80/50",
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
          <div className="ml-3 shrink-0">
            <button
              onClick={handleClose}
              className={cn(
                "inline-flex rounded-md p-1.5",
                "text-muted-foreground/70 hover:text-muted-foreground dark:hover:text-muted-foreground/50",
                "hover:bg-muted dark:hover:bg-muted/80",
                "focus:outline-hidden focus:ring-2 focus:ring-muted-foreground focus:ring-offset-1",
                "transition-colors duration-200",
              )}
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar for timed notifications */}
        {!notification.persistent && notification.duration && notification.duration > 0 && (
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-muted/20 dark:bg-muted/70">
            <div
              className={cn("notification-progress h-full rounded-full", {
                "bg-green-500": notification.type === "success",
                "bg-red-500": notification.type === "error",
                "bg-amber-500": notification.type === "warning",
                "bg-blue-500": notification.type === "info",
              })}
              style={{ animationDuration: `${notification.duration}ms` }}
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

export default NotificationProvider;
