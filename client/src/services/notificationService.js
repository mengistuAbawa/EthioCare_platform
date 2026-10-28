import api from "./api";

export const getUnreadNotificationCount = () => api.get("/notifications/unread-count");
export const getMyNotifications = (params) => api.get("/notifications/my", { params });
const notifyNotificationStateChanged = () => {
  window.dispatchEvent(new Event("ethiocare:notifications-updated"));
};

export const markMyNotificationRead = async (notificationId) => {
  const response = await api.patch(`/notifications/my/${notificationId}/read`);
  notifyNotificationStateChanged();
  return response;
};

export const markAllMyNotificationsRead = async () => {
  const response = await api.patch("/notifications/my/read-all");
  notifyNotificationStateChanged();
  return response;
};
