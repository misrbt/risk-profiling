import { SESSION_TIMEOUT, TOKEN_REFRESH_INTERVAL, LOGGING_ENABLED, DEBUG_ENABLED, API_ENDPOINTS } from '../config/constants';

// Session Manager for handling authentication timeouts and auto-logout
class SessionManager {
  constructor() {
    this.inactivityTimer = null;
    this.refreshTimer = null;
    this.inactivityTimeout = SESSION_TIMEOUT * 60 * 1000; // Convert minutes to milliseconds - will be updated from settings
    this.refreshInterval = TOKEN_REFRESH_INTERVAL * 60 * 1000; // Convert minutes to milliseconds
    this.lastActivity = Date.now();
    this.isActive = false;
    this.autoLogoutMinutes = SESSION_TIMEOUT; // Default fallback
    
    // Events to track user activity
    this.activityEvents = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'keydown'
    ];
    
    // Bind methods to preserve context
    this.handleActivity = this.handleActivity.bind(this);
    this.autoLogout = this.autoLogout.bind(this);
    this.refreshToken = this.refreshToken.bind(this);
    this.startAutoRefresh = this.startAutoRefresh.bind(this);
  }

  // Initialize session management
  async init(authContext) {
    this.authContext = authContext;

    if (authContext.isAuthenticated) {
      // Load auto logout settings before starting tracking
      await this.loadAutoLogoutSettings();
      this.startTracking();
    }
  }

  // Load auto logout settings from backend
  async loadAutoLogoutSettings() {
    try {
      if (LOGGING_ENABLED) console.log('SessionManager: Loading auto logout settings...');

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://risk-profiling.rbtbank.com/api'}/admin/system-settings/group/security`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Accept': 'application/json',
        },
      });

      if (LOGGING_ENABLED) console.log('SessionManager: Settings API response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        if (LOGGING_ENABLED) console.log('SessionManager: Settings API response data:', data);

        if (data.success && data.data) {
          const autoLogoutSetting = data.data.find(setting => setting.key === 'auto_logout_minutes');
          if (LOGGING_ENABLED) console.log('SessionManager: Found auto_logout_minutes setting:', autoLogoutSetting);

          if (autoLogoutSetting) {
            const minutes = parseInt(autoLogoutSetting.value) || SESSION_TIMEOUT;
            this.updateAutoLogoutTimeout(minutes);
            if (LOGGING_ENABLED) console.log('SessionManager: Auto logout setting loaded:', minutes, 'minutes');
          } else {
            if (LOGGING_ENABLED) console.log('SessionManager: No auto_logout_minutes setting found, using default:', SESSION_TIMEOUT);
            this.updateAutoLogoutTimeout(SESSION_TIMEOUT);
          }
        } else {
          if (LOGGING_ENABLED) console.log('SessionManager: Settings API returned no data, using default:', SESSION_TIMEOUT);
          this.updateAutoLogoutTimeout(SESSION_TIMEOUT);
        }
      } else {
        if (LOGGING_ENABLED) console.log('SessionManager: Settings API request failed, using default:', SESSION_TIMEOUT);
        this.updateAutoLogoutTimeout(SESSION_TIMEOUT);
      }
    } catch (error) {
      if (DEBUG_ENABLED) console.error('SessionManager: Failed to load auto logout settings:', error);
      // Use default timeout on error
      this.updateAutoLogoutTimeout(SESSION_TIMEOUT);
    }
  }

  // Update auto logout timeout value
  updateAutoLogoutTimeout(minutes) {
    this.autoLogoutMinutes = minutes;
    this.inactivityTimeout = minutes * 60 * 1000; // Convert to milliseconds

    if (LOGGING_ENABLED) console.log('SessionManager: updateAutoLogoutTimeout called with:', minutes, 'minutes');
    if (LOGGING_ENABLED) console.log('SessionManager: inactivityTimeout set to:', this.inactivityTimeout, 'milliseconds');
    if (LOGGING_ENABLED) console.log('SessionManager: isActive:', this.isActive);

    // If currently tracking and timeout changed, restart the timer
    if (this.isActive) {
      if (LOGGING_ENABLED) console.log('SessionManager: Restarting inactivity timer due to timeout change');
      this.resetInactivityTimer();
    }

    if (LOGGING_ENABLED) console.log('SessionManager: Auto logout timeout updated to:', minutes, 'minutes');
  }

  // Start tracking user activity and token expiry
  startTracking() {
    this.isActive = true;
    this.lastActivity = Date.now();
    
    // Add activity listeners
    this.activityEvents.forEach(event => {
      document.addEventListener(event, this.handleActivity, true);
    });
    
    // Start inactivity timer
    this.startInactivityTimer();
    
    // Start automatic token refresh
    this.startAutoRefresh();
    
    if (LOGGING_ENABLED) console.log('Session tracking started - timeout:', this.autoLogoutMinutes, 'minutes, refresh:', TOKEN_REFRESH_INTERVAL, 'minutes');
  }

  // Stop tracking (on logout)
  stopTracking() {
    this.isActive = false;
    
    // Remove activity listeners
    this.activityEvents.forEach(event => {
      document.removeEventListener(event, this.handleActivity, true);
    });
    
    // Clear timers
    this.clearInactivityTimer();
    this.clearAutoRefresh();
    
    if (LOGGING_ENABLED) console.log('Session tracking stopped');
  }

  // Handle user activity
  handleActivity() {
    if (!this.isActive) return;
    
    this.lastActivity = Date.now();
    
    // Reset inactivity timer on activity
    this.resetInactivityTimer();
  }

  // Start inactivity timer
  startInactivityTimer() {
    this.clearInactivityTimer();

    if (LOGGING_ENABLED) console.log('SessionManager: startInactivityTimer called');
    if (LOGGING_ENABLED) console.log('SessionManager: autoLogoutMinutes:', this.autoLogoutMinutes);
    if (LOGGING_ENABLED) console.log('SessionManager: inactivityTimeout:', this.inactivityTimeout);

    // Skip auto logout if timeout is set to 0 (disabled)
    if (this.autoLogoutMinutes === 0) {
      if (LOGGING_ENABLED) console.log('SessionManager: Auto logout is disabled (set to 0 minutes)');
      return;
    }

    if (LOGGING_ENABLED) console.log('SessionManager: Setting timeout for', this.inactivityTimeout, 'milliseconds (', this.autoLogoutMinutes, 'minutes)');

    this.inactivityTimer = setTimeout(() => {
      if (LOGGING_ENABLED) console.log('SessionManager: TIMEOUT TRIGGERED - User inactive for', this.autoLogoutMinutes, 'minutes - auto logout');
      this.autoLogout('inactivity');
    }, this.inactivityTimeout);

    if (LOGGING_ENABLED) console.log('SessionManager: Inactivity timer started successfully, timer ID:', this.inactivityTimer);
  }

  // Reset inactivity timer
  resetInactivityTimer() {
    this.startInactivityTimer();
  }

  // Clear inactivity timer
  clearInactivityTimer() {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
  }

  // Simple token check - just verify token exists
  checkToken() {
    const token = localStorage.getItem('authToken');
    if (!token && this.authContext.isAuthenticated) {
      if (LOGGING_ENABLED) console.log('No token found, logging out');
      this.autoLogout('no_token');
    }
  }

  // Get simple token from localStorage
  getToken() {
    return localStorage.getItem('authToken');
  }

  // Auto logout with reason
  autoLogout(reason) {
    if (!this.authContext) return;
    
    this.stopTracking();
    
    // Show appropriate message based on reason
    const messages = {
      inactivity: 'You have been logged out due to inactivity.',
      token_expired: 'Your token has expired. Please log in again.',
      token_expiring: 'Your token is about to expire. Please log in again.',
      token_invalid: 'Your session has expired. Please log in again.',
      no_token: 'Authentication required. Please log in.',
      refresh_failed: 'Failed to refresh session. Please log in again.',
      refresh_error: 'Session refresh error. Please log in again.'
    };
    
    const message = messages[reason] || 'You have been logged out.';
    
    // Call logout from auth context
    this.authContext.logout().then(() => {
      // Show beautiful SweetAlert notification
      if (window.Swal) {
        window.Swal.fire({
          icon: reason === 'inactivity' ? 'info' : 'warning',
          title: reason === 'inactivity' ? 'Session Timeout' : 'Session Expired',
          text: message,
          confirmButtonText: 'Login Again',
          confirmButtonColor: '#3b82f6',
          allowOutsideClick: false,
          allowEscapeKey: false,
          showClass: {
            popup: 'animate__animated animate__fadeInDown'
          },
          hideClass: {
            popup: 'animate__animated animate__fadeOutUp'
          },
          customClass: {
            confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200',
            popup: 'rounded-xl shadow-2xl',
            title: 'text-gray-800 font-semibold text-xl',
            content: 'text-gray-600 text-base'
          },
          didOpen: () => {
            // Optional: Auto-redirect after showing the dialog
            if (reason === 'inactivity') {
              // Give user a moment to read the message
              setTimeout(() => {
                if (window.location.pathname !== '/login') {
                  window.location.href = '/login';
                }
              }, 2000);
            }
          }
        }).then((result) => {
          // Redirect when user clicks "Login Again"
          if (result.isConfirmed) {
            if (window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
          }
        });
      } else {
        // Fallback to a more styled custom dialog if SweetAlert2 is not available
        this.showCustomDialog(message, reason);
      }
    });
  }

  // Custom dialog fallback if SweetAlert2 is not available
  showCustomDialog(message, reason) {
    // Create a beautiful custom dialog
    const dialogHTML = `
      <div id="session-dialog-overlay" style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        backdrop-filter: blur(4px);
      ">
        <div style="
          background: white;
          padding: 2rem;
          border-radius: 1rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          max-width: 400px;
          width: 90%;
          text-align: center;
          animation: slideInUp 0.3s ease-out;
        ">
          <div style="
            width: 60px;
            height: 60px;
            margin: 0 auto 1rem;
            background: ${reason === 'inactivity' ? '#3b82f6' : '#f59e0b'};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
          ">
            ${reason === 'inactivity' ? '⏰' : '⚠️'}
          </div>
          <h3 style="
            margin: 0 0 1rem;
            color: #1f2937;
            font-size: 1.5rem;
            font-weight: 600;
          ">
            ${reason === 'inactivity' ? 'Session Timeout' : 'Session Expired'}
          </h3>
          <p style="
            margin: 0 0 2rem;
            color: #6b7280;
            font-size: 1rem;
            line-height: 1.5;
          ">
            ${message}
          </p>
          <button id="session-dialog-button" style="
            background: #3b82f6;
            color: white;
            border: none;
            padding: 0.75rem 2rem;
            border-radius: 0.5rem;
            font-size: 1rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          " onmouseover="this.style.background='#2563eb'" onmouseout="this.style.background='#3b82f6'">
            Login Again
          </button>
        </div>
      </div>
      <style>
        @keyframes slideInUp {
          from {
            transform: translateY(30px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      </style>
    `;

    // Add dialog to page
    document.body.insertAdjacentHTML('beforeend', dialogHTML);
    
    // Handle button click
    document.getElementById('session-dialog-button').onclick = () => {
      document.getElementById('session-dialog-overlay').remove();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    };

    // Auto-redirect for inactivity after 3 seconds
    if (reason === 'inactivity') {
      setTimeout(() => {
        const dialog = document.getElementById('session-dialog-overlay');
        if (dialog) {
          dialog.remove();
        }
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }, 3000);
    }
  }

  // Simple token refresh without JWT decoding
  async refreshToken() {
    if (!this.isActive) return false;
    
    try {
      const currentToken = localStorage.getItem('authToken');
      if (!currentToken) {
        if (LOGGING_ENABLED) console.log('No token available for refresh');
        return false;
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://risk-profiling.rbtbank.com/api'}/${API_ENDPOINTS.REFRESH_TOKEN}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.data.token) {
          // Update token in localStorage
          localStorage.setItem('authToken', data.data.token);
          
          // Update axios headers
          if (window.axios) {
            window.axios.defaults.headers.common['Authorization'] = `Bearer ${data.data.token}`;
          }

          // Update auth context if user data is included
          if (data.data.user && this.authContext.setUserData) {
            this.authContext.setUserData(data.data.user);
          }
          
          this.lastActivity = Date.now();
          this.resetInactivityTimer();
          
          if (LOGGING_ENABLED) console.log('Token refreshed successfully');
          
          return true;
        }
      }
      
      return false;
    } catch (error) {
      if (DEBUG_ENABLED) console.error('Token refresh error:', error);
      return false;
    }
  }

  // Get time remaining until auto logout
  getTimeUntilLogout() {
    if (!this.isActive || this.autoLogoutMinutes === 0) return 0;

    const timePassed = Date.now() - this.lastActivity;
    const timeRemaining = this.inactivityTimeout - timePassed;
    return Math.max(0, timeRemaining);
  }

  // Refresh session (extend the current session)
  async refreshSession() {
    if (!this.isActive) return false;

    try {
      // Reset activity timer
      this.lastActivity = Date.now();
      this.resetInactivityTimer();

      // Optionally refresh the token too
      const tokenRefreshed = await this.refreshToken();

      if (LOGGING_ENABLED) console.log('Session refreshed successfully');

      return true;
    } catch (error) {
      if (DEBUG_ENABLED) console.error('Session refresh failed:', error);
      return false;
    }
  }

  // Reload auto logout settings (called when settings are updated)
  async reloadSettings() {
    if (this.authContext && this.authContext.isAuthenticated) {
      await this.loadAutoLogoutSettings();
      if (LOGGING_ENABLED) console.log('Auto logout settings reloaded');
    }
  }

  // Check if user is active
  isUserActive() {
    return this.isActive;
  }

  // Debug function to get current session status
  getDebugInfo() {
    const timePassed = Date.now() - this.lastActivity;
    const timeRemaining = this.getTimeUntilLogout();

    return {
      isActive: this.isActive,
      autoLogoutMinutes: this.autoLogoutMinutes,
      inactivityTimeout: this.inactivityTimeout,
      lastActivity: new Date(this.lastActivity).toLocaleTimeString(),
      timePassed: Math.round(timePassed / 1000) + 's',
      timeRemaining: Math.round(timeRemaining / 1000) + 's',
      timerExists: !!this.inactivityTimer,
      events: this.activityEvents
    };
  }

  // Start automatic token refresh every 6 hours
  startAutoRefresh() {
    this.clearAutoRefresh();
    
    this.refreshTimer = setInterval(async () => {
      if (this.isActive && this.authContext && this.authContext.isAuthenticated) {
        if (LOGGING_ENABLED) console.log('Performing automatic', TOKEN_REFRESH_INTERVAL, 'minute token refresh...');
        try {
          const success = await this.refreshToken();
          if (success) {
            if (LOGGING_ENABLED) console.log('Automatic token refresh successful');
          } else {
            if (LOGGING_ENABLED) console.log('Automatic token refresh failed');
          }
        } catch (error) {
          if (DEBUG_ENABLED) console.error('Error during automatic token refresh:', error);
        }
      }
    }, this.refreshInterval);
    
    if (LOGGING_ENABLED) console.log('Automatic token refresh scheduled every', TOKEN_REFRESH_INTERVAL, 'minutes');
  }

  // Clear automatic token refresh timer
  clearAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }
}

// Create singleton instance
const sessionManager = new SessionManager();

// Make force cleanup available globally for debugging
if (typeof window !== 'undefined') {
  window.clearAllTokens = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    // Clear any axios headers
    if (window.axios && window.axios.defaults && window.axios.defaults.headers) {
      delete window.axios.defaults.headers.common['Authorization'];
    }
    if (LOGGING_ENABLED) console.log('All tokens cleared');
    window.location.reload();
  };

  // Make session debug info available globally
  window.getSessionDebugInfo = () => {
    const info = sessionManager.getDebugInfo();
    console.table(info);
    return info;
  };

  // Make manual auto logout test available globally
  window.testAutoLogout = (seconds = 10) => {
    console.log(`Testing auto logout in ${seconds} seconds...`);
    sessionManager.updateAutoLogoutTimeout(seconds / 60); // Convert to minutes
    sessionManager.resetInactivityTimer();
  };
}

export default sessionManager;