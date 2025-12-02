import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import AdminSidebar from "../components/layout/AdminSidebar";
import AdminNavbar from "../components/layout/AdminNavbar";
import Footer from "./Footer";

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Always fixed/sticky */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } lg:block`}
      >
        <AdminSidebar
          user={user}
          collapsed={sidebarCollapsed}
          onToggleCollapse={setSidebarCollapsed}
          onMobileClose={() => setMobileMenuOpen(false)}
        />
      </div>

      {/* Main Content Area with responsive margin */}
      <div
        className={`flex flex-col min-h-screen transition-all duration-300 ${
          sidebarCollapsed ? "lg:ml-16" : "lg:ml-80"
        }`}
      >
        {/* Sticky Top Navigation */}
        <div className="sticky top-0 z-40">
          <AdminNavbar
            user={user}
            onLogout={logout}
            onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
          />
        </div>

        {/* Page Content - Centered within the available space */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 scrollbar-hide">
          <div className="w-full max-w-screen-xl 2xl:max-w-screen-2xl mx-auto p-3  sm:p-4 lg:p-6 pb-24 my-10">
            <Outlet />
          </div>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default AdminLayout;
