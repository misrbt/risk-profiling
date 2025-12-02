import React from 'react';

const UserAvatar = ({ user, size = 'md', className = '', showBorder = false }) => {
  const getUserInitials = () => {
    if (!user) return 'U';
    if (user.first_name && user.last_name) {
      return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
    }
    if (user.first_name) return user.first_name.charAt(0).toUpperCase();
    if (user.username) return user.username.charAt(0).toUpperCase();
    if (user.email) return user.email.charAt(0).toUpperCase();
    return 'U';
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'xs':
        return 'w-6 h-6 text-xs';
      case 'sm':
        return 'w-8 h-8 text-sm';
      case 'md':
        return 'w-10 h-10 text-base';
      case 'lg':
        return 'w-12 h-12 text-lg';
      case 'xl':
        return 'w-16 h-16 text-xl';
      case '2xl':
        return 'w-20 h-20 text-2xl';
      case '3xl':
        return 'w-24 h-24 text-3xl';
      default:
        return 'w-10 h-10 text-base';
    }
  };

  const borderClass = showBorder ? 'border-2 border-white shadow-sm' : '';
  const sizeClasses = getSizeClasses();

  // Add cache busting parameter to force reload of updated images
  const getImageUrl = () => {
    if (!user?.profile_pic) return null;
    const baseUrl = user.profile_pic.startsWith('http') 
      ? user.profile_pic 
      : `${import.meta.env.VITE_API_URL || 'http://risk-profiling.rbtbank.com'}/storage/${user.profile_pic}`;
    
    // Add timestamp to force reload when image changes
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}t=${Date.now()}`;
  };

  return (
    <>
      {user?.profile_pic ? (
        <img 
          src={getImageUrl()} 
          alt="Profile" 
          className={`rounded-full object-cover ${sizeClasses} ${borderClass} ${className}`}
          onError={(e) => {
            // Fallback to initials if image fails to load
            e.target.style.display = 'none';
            e.target.nextElementSibling.style.display = 'flex';
          }}
        />
      ) : null}
      <div 
        className={`bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-medium ${sizeClasses} ${borderClass} ${className} ${user?.profile_pic ? 'hidden' : ''}`}
      >
        {getUserInitials()}
      </div>
    </>
  );
};

export default UserAvatar;