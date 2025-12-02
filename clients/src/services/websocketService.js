import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Make Pusher available globally for Echo
window.Pusher = Pusher;

class WebSocketService {
  constructor() {
    this.echo = null;
    this.isConnected = false;
    this.connectionCallbacks = [];
    this.disconnectionCallbacks = [];
    this.initialized = false;
    this.channels = new Map();
  }

  initialize() {
    if (this.initialized) {
      return this.echo;
    }

    const token = localStorage.getItem('authToken');

    if (!token) {
      console.warn('No auth token found, WebSocket connection cannot be established');
      return null;
    }

    try {
      const config = {
        key: import.meta.env.VITE_REVERB_APP_KEY,
        host: import.meta.env.VITE_REVERB_HOST,
        port: import.meta.env.VITE_REVERB_PORT,
        scheme: import.meta.env.VITE_REVERB_SCHEME
      };

      console.log('Initializing WebSocket with Reverb config:', config);

      this.echo = new Echo({
        broadcaster: 'reverb',
        key: config.key,
        wsHost: config.host,
        wsPort: config.port,
        wssPort: config.port,
        forceTLS: (config.scheme === 'https'),
        enabledTransports: ['ws'],
        disableStats: true,
        authEndpoint: `${import.meta.env.VITE_API_BASE_URL}/broadcasting/auth`,
        auth: {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        },
      });

      console.log('Echo instance created:', this.echo);

      // Setup connection event listeners
      if (this.echo.connector && this.echo.connector.pusher) {
        console.log('Setting up WebSocket event listeners');

        this.echo.connector.pusher.connection.bind('connecting', () => {
          console.log('WebSocket connecting...');
        });

        this.echo.connector.pusher.connection.bind('connected', () => {
          console.log('WebSocket connected successfully!');
          this.isConnected = true;
          this.connectionCallbacks.forEach(callback => callback());
        });

        this.echo.connector.pusher.connection.bind('unavailable', () => {
          console.log('WebSocket unavailable');
          this.isConnected = false;
        });

        this.echo.connector.pusher.connection.bind('failed', () => {
          console.error('WebSocket connection failed');
          this.isConnected = false;
        });

        this.echo.connector.pusher.connection.bind('disconnected', () => {
          console.log('WebSocket disconnected');
          this.isConnected = false;
          this.disconnectionCallbacks.forEach(callback => callback());
        });

        this.echo.connector.pusher.connection.bind('error', (error) => {
          console.error('WebSocket connection error:', error);
          this.isConnected = false;
        });

        this.echo.connector.pusher.connection.bind('state_change', (states) => {
          console.log('WebSocket state change:', states);
        });
      } else {
        console.error('WebSocket connector not available');
      }

      this.initialized = true;
      console.log('WebSocket service initialized');

      return this.echo;
    } catch (error) {
      console.error('Failed to initialize WebSocket service:', error);
      return null;
    }
  }

  getEcho() {
    if (!this.echo) {
      return this.initialize();
    }
    return this.echo;
  }

  isWebSocketConnected() {
    return this.isConnected;
  }

  onConnected(callback) {
    this.connectionCallbacks.push(callback);
    // Call immediately if already connected
    if (this.isConnected) {
      callback();
    }
  }

  onDisconnected(callback) {
    this.disconnectionCallbacks.push(callback);
  }

  disconnect() {
    if (this.echo) {
      console.log('Disconnecting WebSocket service');
      this.echo.disconnect();
      this.echo = null;
      this.initialized = false;
      this.isConnected = false;
      this.channels.clear();
    }
  }

  // Reconnect with new token
  reconnect() {
    this.disconnect();
    return this.initialize();
  }

  // Subscribe to a channel
  subscribeToChannel(channelName, events = {}) {
    const echo = this.getEcho();
    if (!echo) {
      console.warn('Cannot subscribe to channel - WebSocket not initialized');
      return null;
    }

    const channel = echo.channel(channelName);
    this.channels.set(channelName, channel);

    // Bind events
    Object.entries(events).forEach(([eventName, handler]) => {
      channel.listen(eventName, handler);
    });

    return channel;
  }

  // Subscribe to a private channel
  subscribeToPrivateChannel(channelName, events = {}) {
    const echo = this.getEcho();
    if (!echo) {
      console.warn('Cannot subscribe to private channel - WebSocket not initialized');
      return null;
    }

    const channel = echo.private(channelName);
    this.channels.set(channelName, channel);

    // Bind events
    Object.entries(events).forEach(([eventName, handler]) => {
      channel.listen(eventName, handler);
    });

    return channel;
  }

  // Leave a channel
  leaveChannel(channelName) {
    if (this.echo) {
      this.echo.leave(channelName);
      this.channels.delete(channelName);
    }
  }

  // Get connection status
  getStatus() {
    return {
      isConnected: this.isConnected,
      initialized: this.initialized,
      channels: Array.from(this.channels.keys())
    };
  }
}

// Export a singleton instance
const websocketService = new WebSocketService();
export default websocketService;