const BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

export const API = {
  BASE,
  API_URL:              `${BASE}/api`,
  AUTH:                 `${BASE}/api/auth`,
  SUPER_ADMIN:          `${BASE}/api/superadmin`,
  PARTNER_API:          `${BASE}/api/superadmin/partners`,
  ADMIN:                `${BASE}/api/admin`,
  USER:                 `${BASE}/api/user`,
  PERMISSIONS:          `${BASE}/api/permissions/public`,
  PAYMENTS:             `${BASE}/api/payments`,
  SEATS:                `${BASE}/api/user/seats`,
  BOOKINGS:             `${BASE}/api/bookings`,
  NOTIFICATIONS:        `${BASE}/api/notifications`,
  WS:                   `${BASE.replace("http","ws")}/ws`,
  ME:                   `${BASE}/api/permissions/me`,
  ROLES_ME:             `${BASE}/api/roles/me`,          // ✅ renamed
  SUPER_ADMIN_ROLES:    `${BASE}/api/superadmin/roles`,  // ✅ renamed
  THEATEROWNER:         `${BASE}/api/theater-owner`,
  THEATEROWNERREQUEST:  `${BASE}/api/admin/requests`,
  PARTNERPORTAL:        `${BASE}/api/partner-portal`,
  SUPERADMINPERMISSION: `${BASE}/api/superadmin/permissions`,
  ADMINPERMISSION:      `${BASE}/api/admin/permissions`,
};

export const APP_NAME = import.meta.env.VITE_APP_NAME ?? "BookWhiz";
export const IS_DEV   = import.meta.env.VITE_APP_ENV === "development";