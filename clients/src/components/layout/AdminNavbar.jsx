import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, Transition } from "@headlessui/react";
import {
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  UserIcon,
  CogIcon,
  Bars3Icon,
} from "@heroicons/react/24/outline";

const AdminNavbar = ({ user, onLogout, onMobileMenuToggle }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate("/login");
  };

  return (
    <header className="bg-white shadow-lg border-b border-slate-200/60">
      <div className="flex items-center justify-between px-3 sm:px-4 lg:px-6 py-4">
        {/* Mobile menu button */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onMobileMenuToggle}
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          
          {/* Page Title - This can be dynamic based on current route */}
          <div>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-800">
              Admin Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">
              Welcome back, {user?.first_name || "Administrator"}
            </p>
          </div>
        </div>

        {/* Right side - Notifications and User Menu */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}

          {/* User Menu */}
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center space-x-2 sm:space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-white" />
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium text-gray-900">
                  {user?.full_name ||
                    `${user?.first_name} ${user?.last_name}` ||
                    user?.username}
                </p>
                <p className="text-xs text-gray-600">System Administrator</p>
              </div>
            </Menu.Button>

            <Transition
              enter="transition ease-out duration-200"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                <div className="p-1">
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        to="/admin/profile"
                        className={`${
                          active ? "bg-gray-100" : ""
                        } flex items-center px-4 py-2 text-sm text-gray-700 rounded-md`}
                      >
                        <UserCircleIcon className="w-4 h-4 mr-3" />
                        View Profile
                      </Link>
                    )}
                  </Menu.Item>

                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        to="/admin/settings/general"
                        className={`${
                          active ? "bg-gray-100" : ""
                        } flex items-center px-4 py-2 text-sm text-gray-700 rounded-md`}
                      >
                        <CogIcon className="w-4 h-4 mr-3" />
                        Settings
                      </Link>
                    )}
                  </Menu.Item>

                  <div className="border-t border-gray-200 my-1"></div>

                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleLogout}
                        className={`${
                          active ? "bg-red-50 text-red-700" : "text-gray-700"
                        } flex items-center w-full px-4 py-2 text-sm rounded-md`}
                      >
                        <ArrowRightOnRectangleIcon className="w-4 h-4 mr-3" />
                        Sign out
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </header>
  );
};

export default AdminNavbar;
