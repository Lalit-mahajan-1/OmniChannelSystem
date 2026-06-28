import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  type: "ticket" | "task" | "mention" | "system";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  link?: string;
  priority?: "low" | "medium" | "high" | "critical";
}

interface NotificationSettings {
  emailAlerts: boolean;
  browserNotifications: boolean;
  soundAlerts: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  settings: NotificationSettings;
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  updateSettings: (settings: Partial<NotificationSettings>) => void;
  requestBrowserPermission: () => Promise<boolean>;
}

// ── Context ───────────────────────────────────────────────────────────────────

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// ── Provider ──────────────────────────────────────────────────────────────────

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    // Load from localStorage
    const saved = localStorage.getItem("notifications");
    return saved ? JSON.parse(saved) : [];
  });

  const [settings, setSettings] = useState<NotificationSettings>(() => {
    const saved = localStorage.getItem("notificationSettings");
    return saved
      ? JSON.parse(saved)
      : {
          emailAlerts: true,
          browserNotifications: false,
          soundAlerts: false,
        };
  });

  const [lastTicketCount, setLastTicketCount] = useState<number>(0);
  const [lastMessageCount, setLastMessageCount] = useState<number>(0);
  const [lastComplaintCount, setLastComplaintCount] = useState<number>(0);

  // Calculate unread count
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Save to localStorage whenever notifications change
  useEffect(() => {
    localStorage.setItem("notifications", JSON.stringify(notifications));
  }, [notifications]);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem("notificationSettings", JSON.stringify(settings));
  }, [settings]);

  // Poll for new tickets (every 30 seconds)
  const { data: ticketStats } = useQuery({
    queryKey: ["ticketStats"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/ticket-intelligence/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch ticket stats");
      return res.json();
    },
    refetchInterval: 30000, // Poll every 30 seconds
    enabled: true,
  });

  const { data: inboxData } = useQuery({
    queryKey: ["notif-inbox"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const employerId = user?._id || user?.id;
      if (!employerId) return null;
      const res = await fetch(`${import.meta.env.VITE_API_URL}/webhook/chats?employerId=${employerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      return res.json();
    },
    refetchInterval: 30000,
    enabled: true,
  });

  useEffect(() => {
    if (inboxData?.data) {
      const totalUnread = inboxData.data.reduce((s: number, c: any) => s + (c.unreadCount || 0), 0);
      if (lastMessageCount > 0 && totalUnread > lastMessageCount) {
        const newCount = totalUnread - lastMessageCount;
        addNotification({
          type: "ticket",
          title: "New WhatsApp Message",
          message: `${newCount} new message${newCount > 1 ? "s" : ""} in inbox`,
          priority: "medium",
          link: "/dashboard",
        });
      }
      setLastMessageCount(totalUnread);
    }
  }, [inboxData]);

  // Detect new tickets
  useEffect(() => {
    if (ticketStats?.data) {
      const currentTotal = ticketStats.data.totalTickets || 0;

      // Check if there are new tickets
      if (lastTicketCount > 0 && currentTotal > lastTicketCount) {
        const newTicketCount = currentTotal - lastTicketCount;
        addNotification({
          type: "ticket",
          title: "New Ticket Alert",
          message: `${newTicketCount} new ticket${newTicketCount > 1 ? "s" : ""} received`,
          priority: "high",
          link: "/dashboard/tickets",
        });
      }

      setLastTicketCount(currentTotal);
    }
  }, [ticketStats]);

  // Add notification
  const addNotification = (notification: Omit<Notification, "id" | "timestamp" | "read">) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random()}`,
      timestamp: new Date(),
      read: false,
    };

    setNotifications((prev) => [newNotification, ...prev].slice(0, 50)); // Keep last 50

    // Show toast notification
    toast(notification.title, {
      description: notification.message,
      duration: 5000,
    });

    // Show browser notification if enabled and permitted
    if (settings.browserNotifications && "Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification(notification.title, {
          body: notification.message,
          icon: "/favicon.ico",
          tag: newNotification.id,
        });
      }
    }

    // Play sound if enabled
    if (settings.soundAlerts) {
      playNotificationSound();
    }
  };

  // Mark as read
  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Clear all notifications
  const clearNotifications = () => {
    setNotifications([]);
  };

  // Update settings
  const updateSettings = (newSettings: Partial<NotificationSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // Request browser notification permission
  const requestBrowserPermission = async (): Promise<boolean> => {
    if (!("Notification" in window)) {
      toast.error("Browser notifications are not supported");
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        toast.success("Browser notifications enabled");
        return true;
      }
    }

    toast.error("Browser notification permission denied");
    return false;
  };

  // Play notification sound
  const playNotificationSound = () => {
    try {
      const audio = new Audio("/notification.mp3");
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Silent fail if audio doesn't play
      });
    } catch (err) {
      // Silent fail
    }
  };

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    settings,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    updateSettings,
    requestBrowserPermission,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
}
