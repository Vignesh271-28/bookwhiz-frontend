// All API URLs come from here — change only .env files, never hunt through components
const BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

export const API = {

  BASE,

  API_URL:`${BASE}/api`,

  // Auth
  AUTH:         `${BASE}/api/auth`,

  // SuperAdmin
  SUPER_ADMIN:  `${BASE}/api/superadmin`,

  PARTNER_API: `${BASE}/api/superadmin/partners`,

  // Admin
  ADMIN:        `${BASE}/api/admin`,

  // User
  USER:         `${BASE}/api/user`,

  // Permissions
  PERMISSIONS:  `${BASE}/api/permissions/public`,

  // Custom roles
  ROLES:        `${BASE}/api/superadmin/roles`,

  PAYMENTS:      `${BASE}/api/payments`,

  SEATS  : `${BASE}/api/user/seats`,

  // Bookings
  BOOKINGS:     `${BASE}/api/bookings`,

  // Notifications
  NOTIFICATIONS:`${BASE}/api/notifications`,

  // WebSocket
  WS:           `${BASE.replace("http","ws")}/ws`,

  ME:   `${BASE}/api/permissions/me`,

  ROLES:  `${BASE}/api/roles/me`,

  THEATEROWNER: `${BASE}/api/theater-owner`,

  THEATEROWNERREQUEST: `${BASE}/api/admin/requests`,

  PARTNERPORTAL: `${BASE}/api/partner-portal`,

  SUPERADMINPERMISSION: `${BASE}/api/superadmin/permissions`,

  ADMINPERMISSION: `${BASE}/api/admin/permissions`,

  SUPER_ADMIN_ROLES: `${BASE}/api/superadmin/roles`
};

export const APP_NAME = import.meta.env.VITE_APP_NAME ?? "BookWhiz";
export const IS_DEV   = import.meta.env.VITE_APP_ENV === "development";