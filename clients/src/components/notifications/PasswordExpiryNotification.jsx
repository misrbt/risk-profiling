import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Swal from 'sweetalert2';

const PasswordExpiryNotification = () => {
  const { user, isAuthenticated } = useAuth();
  const [hasShownNotification, setHasShownNotification] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user || hasShownNotification) {
      return;
    }

    // Check days until password expires
    const daysUntilExpires = localStorage.getItem('days_until_password_expires');

    if (daysUntilExpires && parseInt(daysUntilExpires) > 0) {
      const days = parseInt(daysUntilExpires);

      // Show notification if password expires in 7 days or less
      if (days <= 7) {
        const isToday = days === 0;
        const isTomorrow = days === 1;

        let message = '';
        if (isToday) {
          message = 'Your password expires today! Please change it soon to avoid account disruption.';
        } else if (isTomorrow) {
          message = 'Your password expires tomorrow! Please change it soon.';
        } else {
          message = `Your password will expire in ${days} days. Please change it soon.`;
        }

        Swal.fire({
          icon: 'warning',
          title: 'Password Expiring Soon',
          text: message,
          confirmButtonText: 'OK',
          customClass: {
            popup: 'rounded-2xl',
            confirmButton: 'px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700',
          },
          buttonsStyling: false,
          allowOutsideClick: true,
        });

        setHasShownNotification(true);
      }
    }
  }, [user, isAuthenticated, hasShownNotification]);

  return null; // This component doesn't render anything
};

export default PasswordExpiryNotification;
