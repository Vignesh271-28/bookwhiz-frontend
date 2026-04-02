const routesConfig = [
    // ── Public ──
    { path: "/login", element: "Login", public: true },
    { path: "/register", element: "Register", public: true },
    { path: "/partner/register", element: "PartnerRegister", public: true },
  
    // ── User ──
    {
      path: "/",
      element: "Home",
      roles: ["USER","MANAGER","ADMIN","SUPER_ADMIN"]
    },
    { path: "/dashboard", element: "UserDashboard" },
    { path: "/events/:id", element: "EventDetails" },
    { path: "/movies/:movieId/review", element: "MovieReviewPage" },
    { path: "/shows/:showId/seats", element: "SeatSelection" },
    { path: "/booking/:bookingId", element: "BookingSummary" },
    { path: "/payment/:paymentId", element: "PaymentStatus" },
    { path: "/my-bookings", element: "MyBookings" },
  
    // ── Manager ──
    {
      path: "/partner",
      layout: "PartnerLayout",
      roles: ["MANAGER"],
      children: [
        { index: true, element: "PartnerDashboard" }
      ]
    },
  
    // ── Admin ──
    {
      path: "/admin",
      layout: "AdminLayout",
      roles: ["ADMIN"],
      children: [
        { index: true, element: "AdminDashboard" },
        { path: "bookings", element: "AdminBookings" },
        { path: "users", element: "AdminUsers" }
      ]
    },
  
    // ── SuperAdmin ──
    {
      path: "/superadmin",
      layout: "SuperAdminLayout",
      roles: ["SUPER_ADMIN"],
      children: [
        { index: true, element: "SuperAdminDashboard" },
        { path: "home", element: "Home" },
        { path: "my-bookings", element: "MyBookings" }
      ]
    }
  ];
  
  export default routesConfig;