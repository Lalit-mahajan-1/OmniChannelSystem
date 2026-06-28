import { useState, useRef, useEffect } from "react";
import { Bell, Check, CheckCheck, Trash2, X } from "lucide-react";
import { useNotifications } from "@/context/NotificationContext";
import { useNavigate } from "react-router-dom";

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } =
    useNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    if (notification.link) {
      navigate(notification.link);
    }
    setIsOpen(false);
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "critical":
        return "#ef4444";
      case "high":
        return "#f59e0b";
      case "medium":
        return "#3b82f6";
      default:
        return "#64748b";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "ticket":
        return "🎫";
      case "task":
        return "✅";
      case "mention":
        return "💬";
      case "system":
        return "⚙️";
      default:
        return "🔔";
    }
  };

  return (
    <div style={{ position: "relative" }} ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "relative",
          width: 40,
          height: 40,
          borderRadius: 10,
          border: "none",
          background: isOpen ? "#FFF3CD" : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "background 0.2s",
        }}
      >
        <Bell style={{ width: 18, height: 18, color: "#1A1A1A" }} />
        {unreadCount > 0 && (
          <div
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              minWidth: 18,
              height: 18,
              borderRadius: 9,
              background: "linear-gradient(135deg, #ef4444, #dc2626)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 10,
              fontWeight: 600,
              color: "#fff",
              padding: "0 5px",
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </div>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: 50,
            right: 0,
            width: 380,
            maxHeight: 500,
            background: "#FFFFFF",
            border: "1px solid #E5E7EB",
            borderRadius: 12,
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
            zIndex: 1000,
            overflow: "hidden",
            fontFamily: "DM Sans, sans-serif",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 20px",
              borderBottom: "1px solid #E5E7EB",
            }}
          >
            <div>
              <h3
                style={{
                  fontWeight: 600,
                  fontSize: 15,
                  color: "#111827",
                  margin: 0,
                }}
              >
                Notifications
              </h3>
              <p style={{ fontSize: 12, color: "#6B7280", margin: 0 }}>
                {unreadCount} unread
              </p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {notifications.length > 0 && (
                <>
                  <button
                    onClick={markAllAsRead}
                    title="Mark all as read"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      border: "none",
                      background: "rgba(62,207,106,0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    <CheckCheck style={{ width: 14, height: 14, color: "#3ecf6a" }} />
                  </button>
                  <button
                    onClick={clearNotifications}
                    title="Clear all"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      border: "none",
                      background: "rgba(239,68,68,0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    <Trash2 style={{ width: 14, height: 14, color: "#ef4444" }} />
                  </button>
                </>
              )}
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: "none",
                  background: "rgba(255,255,255,0.06)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <X style={{ width: 14, height: 14, color: "#94a3b8" }} />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div
            style={{
              maxHeight: 420,
              overflowY: "auto",
            }}
          >
            {notifications.length === 0 ? (
              <div
                style={{
                  padding: 40,
                  textAlign: "center",
                  color: "#64748b",
                }}
              >
                <Bell
                  style={{
                    width: 48,
                    height: 48,
                    margin: "0 auto 12px",
                    opacity: 0.3,
                  }}
                />
                <p style={{ margin: 0, fontSize: 14 }}>No notifications yet</p>
                <p style={{ margin: "4px 0 0", fontSize: 12 }}>
                  You'll see updates here when they arrive
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  style={{
                    padding: "14px 20px",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                    background: notification.read
                      ? "transparent"
                      : "rgba(62,207,106,0.05)",
                    cursor: notification.link ? "pointer" : "default",
                    transition: "background 0.2s",
                    display: "flex",
                    gap: 12,
                  }}
                  onMouseEnter={(e) => {
                    if (notification.link) {
                      e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = notification.read
                      ? "transparent"
                      : "rgba(62,207,106,0.05)";
                  }}
                >
                  {/* Icon */}
                  <div style={{ fontSize: 20 }}>{getTypeIcon(notification.type)}</div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 4,
                      }}
                    >
                      <h4
                        style={{
                          fontWeight: 600,
                          fontSize: 13,
                          color: "#1A1A1A",
                          margin: 0,
                          flex: 1,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {notification.title}
                      </h4>
                      {notification.priority && (
                        <div
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: getPriorityColor(notification.priority),
                          }}
                        />
                      )}
                    </div>
                    <p
                      style={{
                        fontSize: 12,
                        color: "#94a3b8",
                        margin: "0 0 4px",
                        lineHeight: 1.4,
                      }}
                    >
                      {notification.message}
                    </p>
                    <p
                      style={{
                        fontSize: 11,
                        color: "#64748b",
                        margin: 0,
                      }}
                    >
                      {formatTimestamp(notification.timestamp)}
                    </p>
                  </div>

                  {/* Read indicator */}
                  {!notification.read && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification.id);
                      }}
                      title="Mark as read"
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 6,
                        border: "none",
                        background: "rgba(62,207,106,0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        flexShrink: 0,
                      }}
                    >
                      <Check style={{ width: 12, height: 12, color: "#3ecf6a" }} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Format timestamp
function formatTimestamp(timestamp: Date): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
