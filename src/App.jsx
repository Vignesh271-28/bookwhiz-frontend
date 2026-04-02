import { Routes, Route, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import Navbar from "./components/common/Navbar";
import ProtectedRoute from "./routes/ProtectedRoute";
import routesConfig from "./routes/routesConfig";

// import all components
import { Pages } from "./components/ComponentMap";
import { Layouts } from "./layouts/LayoutMap";

export default function App() {
  const location = useLocation();

  const hideNavbar =
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/partner") ||
    location.pathname.startsWith("/superadmin");

  const renderRoutes = (routes) =>
    routes.map((route, index) => {

      if (route.public) {
        const Component = Pages[route.element];
        return <Route key={index} path={route.path} element={<Component />} />;
      }

      if (route.layout) {
        const Layout = Layouts[route.layout];

        return (
          <Route
            key={index}
            path={route.path}
            element={
              <ProtectedRoute roles={route.roles}>
                <Layout />
              </ProtectedRoute>
            }
          >
            {route.children.map((child, i) => {
              const Component = Pages[child.element];

              return (
                <Route
                  key={i}
                  index={child.index}
                  path={child.path}
                  element={<Component />}
                />
              );
            })}
          </Route>
        );
      }

      // Normal protected route
      const Component = Pages[route.element];

      return (
        <Route
          key={index}
          path={route.path}
          element={
            <ProtectedRoute roles={route.roles}>
              <Component />
            </ProtectedRoute>
          }
        />
      );
    });

  return (
    <>
      {!hideNavbar && <Navbar />}

      <Routes>
        {renderRoutes(routesConfig)}

        {/* 403 */}
        <Route path="/unauthorized" element={
          <div className="min-h-screen flex items-center justify-center">
            <h2 className="text-2xl font-bold text-red-600">
              403 – Unauthorized Access
            </h2>
          </div>
        } />
      </Routes>

      <ToastContainer position="top-center" autoClose={3000} />
    </>
  );
}