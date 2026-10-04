import { db } from '../db.js';

export function getNotifications(req, res) {
  const notifs = db.getNotificationsByUserId(req.user.id);
  const unreadCount = notifs.filter(n => !n.read).length;

  return res.json({
    success: true,
    total: notifs.length,
    unreadCount,
    notifications: notifs
  });
}

export function markAsRead(req, res) {
  const notif = db.markNotificationAsRead(req.params.id, req.user.id);
  if (!notif) {
    return res.status(404).json({ success: false, error: 'Notification not found' });
  }

  return res.json({
    success: true,
    message: 'Notification marked as read',
    notification: notif
  });
}

export function markAllRead(req, res) {
  db.markAllNotificationsRead(req.user.id);
  return res.json({
    success: true,
    message: 'All notifications marked as read'
  });
}
