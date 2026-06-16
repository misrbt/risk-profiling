import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useAuth } from '../contexts/AuthContext';
import { UserAvatar } from '../components/ui';
import { API_BASE_URL, API_ENDPOINTS } from '../config/constants';
import { successAlert, errorAlert, confirmationAlert } from '../utils/sweetAlertConfig';
import TwoFactorSetupModal from '../components/auth/TwoFactorSetupModal';

export default function ProfilePage() {
  const { user, isComplianceOfficer, updateProfile, logout, setUserData } = useAuth();

  const [twoFactorStatus, setTwoFactorStatus] = useState(null);
  const [loadingTwoFactor, setLoadingTwoFactor] = useState(true);
  const [showTwoFactorSetupModal, setShowTwoFactorSetupModal] = useState(false);
  const [twoFactorActionLoading, setTwoFactorActionLoading] = useState(false);

  const fetchTwoFactorStatus = async () => {
    try {
      const response = await axios.get('/two-factor/status');
      if (response.data.success) {
        setTwoFactorStatus(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load 2FA status:', error);
    } finally {
      setLoadingTwoFactor(false);
    }
  };

  useEffect(() => {
    fetchTwoFactorStatus();
  }, []);

  const promptPassword = async (title, confirmButtonText) => {
    const { value: password } = await Swal.fire({
      title,
      input: 'password',
      inputPlaceholder: 'Enter your current password',
      showCancelButton: true,
      confirmButtonText,
      customClass: { popup: 'rounded-2xl' },
      inputValidator: (value) => (!value ? 'Password is required' : undefined),
    });
    return password;
  };

  const handleDisableTwoFactor = async () => {
    const password = await promptPassword('Disable Two-Factor Authentication', 'Disable');
    if (!password) return;

    setTwoFactorActionLoading(true);
    try {
      const response = await axios.post('/two-factor/disable', { password });
      if (response.data.success) {
        await successAlert('2FA Disabled', 'Two-factor authentication has been disabled for your account.');
        await fetchTwoFactorStatus();
      }
    } catch (error) {
      await errorAlert('Failed', error.response?.data?.message || 'Failed to disable two-factor authentication.');
    } finally {
      setTwoFactorActionLoading(false);
    }
  };

  const handleRegenerateRecoveryCodes = async () => {
    const password = await promptPassword('Regenerate Recovery Codes', 'Regenerate');
    if (!password) return;

    setTwoFactorActionLoading(true);
    try {
      const response = await axios.post('/two-factor/recovery-codes/regenerate', { password });
      if (response.data.success) {
        const codes = response.data.data.recovery_codes.join('\n');
        await Swal.fire({
          title: 'New Recovery Codes',
          html: `<p class="text-sm text-gray-600 mb-3">Your old recovery codes no longer work. Save these in a secure place:</p><pre class="text-left bg-gray-50 p-3 rounded-lg text-sm">${codes}</pre>`,
          icon: 'success',
          customClass: { popup: 'rounded-2xl' },
        });
      }
    } catch (error) {
      await errorAlert('Failed', error.response?.data?.message || 'Failed to regenerate recovery codes.');
    } finally {
      setTwoFactorActionLoading(false);
    }
  };
  
  // Password strength validation function
  const validatePasswordStrength = (password) => {
    const errors = [];
    
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }
    
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }
    
    if (!/(?=.*\d)/.test(password)) {
      errors.push("Password must contain at least one number");
    }
    
    if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?])/.test(password)) {
      errors.push("Password must contain at least one symbol");
    }
    
    return errors;
  };
  
  // Real-time password strength checker
  const checkPasswordStrength = (password) => {
    const strength = {
      hasMinLength: password.length >= 8,
      hasUppercase: /(?=.*[A-Z])/.test(password),
      hasLowercase: /(?=.*[a-z])/.test(password),
      hasNumber: /(?=.*\d)/.test(password),
      hasSymbol: /(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?])/.test(password),
      score: 0
    };
    
    // Calculate score
    strength.score = Object.values(strength).filter(val => val === true).length - 1; // -1 to exclude score itself
    
    return strength;
  };
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const fileInputRef = useRef(null);
  
  // Form states
  const [profileForm, setProfileForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    middle_initial: user?.middle_initial || '',
    username: user?.username || '',
    email: user?.email || ''
  });
  
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  
  const [passwordStrength, setPasswordStrength] = useState({
    hasMinLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSymbol: false,
    score: 0
  });
  
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const getUserDisplayName = () => {
    if (!user) return 'User';
    if (user.full_name) return user.full_name;
    if (user.first_name && user.last_name) {
      return user.middle_initial 
        ? `${user.first_name} ${user.middle_initial}. ${user.last_name}`
        : `${user.first_name} ${user.last_name}`;
    }
    return user.username || user.email || 'User';
  };

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

  const getUserRole = () => {
    if (!user || !user.roles || user.roles.length === 0) return 'User';
    return user.roles.map(role => role.name).join(', ');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Handle profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.put(
        API_ENDPOINTS.PROFILE,
        profileForm,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
      
      await updateProfile(response.data.user);
      setIsEditing(false);
      await successAlert('Profile Updated!', 'Your profile has been updated successfully.');
    } catch (error) {
      await errorAlert('Update Failed!', error.response?.data?.message || 'Failed to update profile.');
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      await errorAlert('Password Mismatch!', 'New password and confirmation do not match.');
      return;
    }
    
    if (passwordForm.new_password.length < 8) {
      await errorAlert('Weak Password!', 'Password must be at least 8 characters long.');
      return;
    }
    
    // Strong password validation
    const passwordErrors = validatePasswordStrength(passwordForm.new_password);
    if (passwordErrors.length > 0) {
      await errorAlert('Weak Password!', passwordErrors.join('. ') + '.');
      return;
    }
    
    setIsUpdating(true);
    
    try {
      const token = localStorage.getItem('authToken');
      await axios.put(
        API_ENDPOINTS.CHANGE_PASSWORD,
        {
          current_password: passwordForm.current_password,
          password: passwordForm.new_password,
          password_confirmation: passwordForm.confirm_password
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
      
      setShowPasswordModal(false);
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      setPasswordStrength({ hasMinLength: false, hasUppercase: false, hasLowercase: false, hasNumber: false, hasSymbol: false, score: 0 });
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      
      const result = await successAlert('Password Changed!', 'Your password has been changed successfully. You will be logged out for security.');
      if (result.isConfirmed) {
        logout();
      }
    } catch (error) {
      await errorAlert('Password Change Failed!', error.response?.data?.message || 'Failed to change password.');
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Handle profile picture upload
  const handleProfilePictureUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      await errorAlert('Invalid File!', 'Please select an image file.');
      return;
    }
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      await errorAlert('File Too Large!', 'Please select an image smaller than 5MB.');
      return;
    }
    
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('profile_picture', file);
      
      const token = localStorage.getItem('authToken');
      const response = await axios.post(
        API_ENDPOINTS.UPLOAD_PROFILE_PICTURE,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
            'Accept': 'application/json'
          }
        }
      );
      
      if (response.data.success && response.data.user) {
        // Update the user in context and localStorage directly
        const updatedUser = response.data.user;
        setUserData(updatedUser);
        
        // Clear the file input
        event.target.value = '';
        
        await successAlert('Profile Picture Updated!', 'Your profile picture has been uploaded successfully.');
      } else {
        throw new Error(response.data.message || 'Upload failed');
      }
    } catch (error) {
      await errorAlert('Upload Failed!', error.response?.data?.message || 'Failed to upload profile picture.');
    } finally {
      setIsUploading(false);
    }
  };
  
  const InfoCard = ({ label, value, icon, editable = false, field }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{label}</p>
          {isEditing && editable ? (
            <input
              type="text"
              value={profileForm[field] || ''}
              onChange={(e) => setProfileForm(prev => ({ ...prev, [field]: e.target.value }))}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={`Enter ${label.toLowerCase()}`}
            />
          ) : (
            <p className="text-lg font-semibold text-gray-900">{value}</p>
          )}
        </div>
      </div>
    </div>
  );

  // Loading state
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <UserAvatar user={user} size="3xl" showBorder={true} />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-full flex items-center justify-center transition-colors shadow-lg"
                title="Upload Profile Picture"
              >
                {isUploading ? (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleProfilePictureUpload}
                className="hidden"
              />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{getUserDisplayName()}</h1>
              <p className="text-lg text-gray-600">{getUserRole()}</p>
              <div className="flex items-center space-x-4 mt-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                  isComplianceOfficer() 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {isComplianceOfficer() ? 'Compliance Officer' : 'User'}
                </span>
                <span className="text-sm text-gray-500">
                  Active Status: {user?.status || 'active'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoCard
              label="Email Address"
              value={user?.email || 'Not available'}
              icon="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              editable={true}
              field="email"
            />
            
            <InfoCard
              label="Username"
              value={user?.username || 'Not available'}
              icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              editable={true}
              field="username"
            />
            
            <InfoCard
              label="First Name"
              value={user?.first_name || 'Not available'}
              icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              editable={true}
              field="first_name"
            />
            
            <InfoCard
              label="Last Name"
              value={user?.last_name || 'Not available'}
              icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              editable={true}
              field="last_name"
            />
            
            <InfoCard
              label="Middle Initial"
              value={user?.middle_initial || 'None'}
              icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              editable={true}
              field="middle_initial"
            />
            
            <InfoCard
              label="Account Created"
              value={formatDate(user?.created_at)}
              icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </div>
        </div>

        {/* Roles & Permissions */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Roles & Permissions</h2>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Assigned Roles</h3>
                <div className="flex flex-wrap gap-2">
                  {user?.roles && user.roles.length > 0 ? (
                    user.roles.map((role) => (
                      <span
                        key={role.id}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          role.slug === 'compliance'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {role.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500">No roles assigned</span>
                  )}
                </div>
              </div>

              {user?.roles && user.roles.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Permissions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {user.roles.flatMap(role => role.permissions || []).map((permission) => (
                      <div key={permission.id} className="flex items-center text-sm text-gray-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                        {permission.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Account Information */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Information</h2>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Account Status</h3>
                <p className={`text-lg font-semibold ${
                  user?.status === 'active' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {user?.status === 'active' ? 'Active' : 'Inactive'}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
                <p className="text-lg font-semibold text-gray-900">
                  {formatDate(user?.updated_at)}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Profile Picture</h3>
                <p className="text-lg font-semibold text-gray-900">
                  {user?.profile_pic ? 'Uploaded' : 'Not uploaded'}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">User ID</h3>
                <p className="text-lg font-semibold text-gray-900">
                  #{user?.id || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Two-Factor Authentication */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Two-Factor Authentication</h2>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {loadingTwoFactor ? (
              <p className="text-gray-500 text-sm">Checking status...</p>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        twoFactorStatus?.enabled
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {twoFactorStatus?.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                    {!twoFactorStatus?.enabled && twoFactorStatus?.is_required && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        Required for your role
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    {twoFactorStatus?.enabled
                      ? 'A code from your authenticator app is required each time you log in.'
                      : 'Add an authenticator app as a second factor when signing in.'}
                  </p>
                </div>
                <div className="flex gap-3">
                  {twoFactorStatus?.enabled ? (
                    <>
                      <button
                        onClick={handleRegenerateRecoveryCodes}
                        disabled={twoFactorActionLoading}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-gray-700 font-medium rounded-lg transition-colors text-sm"
                      >
                        Regenerate Recovery Codes
                      </button>
                      <button
                        onClick={handleDisableTwoFactor}
                        disabled={twoFactorActionLoading}
                        className="px-4 py-2 bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-700 font-medium rounded-lg transition-colors text-sm"
                      >
                        Disable
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setShowTwoFactorSetupModal(true)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-sm"
                    >
                      Enable Two-Factor Authentication
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap gap-4">
          {isEditing ? (
            <>
              <button 
                onClick={handleProfileUpdate}
                disabled={isUpdating}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
              >
                {isUpdating ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                <span>{isUpdating ? 'Saving...' : 'Save Changes'}</span>
              </button>
              <button 
                onClick={() => {
                  setIsEditing(false);
                  setProfileForm({
                    first_name: user?.first_name || '',
                    last_name: user?.last_name || '',
                    middle_initial: user?.middle_initial || '',
                    username: user?.username || '',
                    email: user?.email || ''
                  });
                }}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Cancel</span>
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => setIsEditing(true)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Edit Profile</span>
              </button>
              
              <button 
                onClick={() => setShowPasswordModal(true)}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Change Password</span>
              </button>

              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
              >
                {isUploading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                )}
                <span>{isUploading ? 'Uploading...' : 'Upload Profile Picture'}</span>
              </button>
            </>
          )}
        </div>
        
        {/* Password Change Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Change Password</h2>
                  <button 
                    onClick={() => {
                      setShowPasswordModal(false);
                      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      setPasswordStrength({ hasMinLength: false, hasUppercase: false, hasLowercase: false, hasNumber: false, hasSymbol: false, score: 0 });
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        required
                        value={passwordForm.current_password}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, current_password: e.target.value }))}
                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showCurrentPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        required
                        minLength={8}
                        value={passwordForm.new_password}
                        onChange={(e) => {
                          const newPassword = e.target.value;
                          setPasswordForm(prev => ({ ...prev, new_password: newPassword }));
                          setPasswordStrength(checkPasswordStrength(newPassword));
                        }}
                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter new password (min 8 characters)"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showNewPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    
                    {/* Password Strength Indicator */}
                    {passwordForm.new_password && (
                      <div className="mt-3 space-y-2">
                        {/* Strength Bar */}
                        <div className="flex space-x-1">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <div
                              key={level}
                              className={`h-2 flex-1 rounded-full transition-all duration-200 ${
                                level <= passwordStrength.score
                                  ? passwordStrength.score <= 2
                                    ? 'bg-red-500'
                                    : passwordStrength.score <= 3
                                    ? 'bg-yellow-500'
                                    : passwordStrength.score <= 4
                                    ? 'bg-blue-500'
                                    : 'bg-green-500'
                                  : 'bg-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                        
                        {/* Requirements Checklist */}
                        <div className="grid grid-cols-1 gap-1 text-xs">
                          <div className={`flex items-center space-x-2 ${passwordStrength.hasMinLength ? 'text-green-600' : 'text-gray-500'}`}>
                            <span className={`w-3 h-3 rounded-full flex items-center justify-center ${passwordStrength.hasMinLength ? 'bg-green-100' : 'bg-gray-100'}`}>
                              {passwordStrength.hasMinLength ? '✓' : '○'}
                            </span>
                            <span>At least 8 characters</span>
                          </div>
                          <div className={`flex items-center space-x-2 ${passwordStrength.hasUppercase ? 'text-green-600' : 'text-gray-500'}`}>
                            <span className={`w-3 h-3 rounded-full flex items-center justify-center ${passwordStrength.hasUppercase ? 'bg-green-100' : 'bg-gray-100'}`}>
                              {passwordStrength.hasUppercase ? '✓' : '○'}
                            </span>
                            <span>One uppercase letter (A-Z)</span>
                          </div>
                          <div className={`flex items-center space-x-2 ${passwordStrength.hasLowercase ? 'text-green-600' : 'text-gray-500'}`}>
                            <span className={`w-3 h-3 rounded-full flex items-center justify-center ${passwordStrength.hasLowercase ? 'bg-green-100' : 'bg-gray-100'}`}>
                              {passwordStrength.hasLowercase ? '✓' : '○'}
                            </span>
                            <span>One lowercase letter (a-z)</span>
                          </div>
                          <div className={`flex items-center space-x-2 ${passwordStrength.hasNumber ? 'text-green-600' : 'text-gray-500'}`}>
                            <span className={`w-3 h-3 rounded-full flex items-center justify-center ${passwordStrength.hasNumber ? 'bg-green-100' : 'bg-gray-100'}`}>
                              {passwordStrength.hasNumber ? '✓' : '○'}
                            </span>
                            <span>One number (0-9)</span>
                          </div>
                          <div className={`flex items-center space-x-2 ${passwordStrength.hasSymbol ? 'text-green-600' : 'text-gray-500'}`}>
                            <span className={`w-3 h-3 rounded-full flex items-center justify-center ${passwordStrength.hasSymbol ? 'bg-green-100' : 'bg-gray-100'}`}>
                              {passwordStrength.hasSymbol ? '✓' : '○'}
                            </span>
                            <span>One symbol (!@#$%^&*)</span>
                          </div>
                        </div>
                        
                        {/* Strength Label */}
                        <div className="text-xs font-medium">
                          Password strength: 
                          <span className={`ml-1 ${
                            passwordStrength.score <= 2 ? 'text-red-600' :
                            passwordStrength.score <= 3 ? 'text-yellow-600' :
                            passwordStrength.score <= 4 ? 'text-blue-600' : 'text-green-600'
                          }`}>
                            {passwordStrength.score <= 2 ? 'Weak' :
                             passwordStrength.score <= 3 ? 'Fair' :
                             passwordStrength.score <= 4 ? 'Good' : 'Strong'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        value={passwordForm.confirm_password}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm_password: e.target.value }))}
                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showConfirmPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {passwordForm.new_password && passwordForm.confirm_password && (
                      <div className={`mt-2 text-xs flex items-center space-x-2 ${
                        passwordForm.new_password === passwordForm.confirm_password ? 'text-green-600' : 'text-red-600'
                      }`}>
                        <span className={`w-3 h-3 rounded-full flex items-center justify-center ${
                          passwordForm.new_password === passwordForm.confirm_password ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {passwordForm.new_password === passwordForm.confirm_password ? '✓' : '✗'}
                        </span>
                        <span>
                          {passwordForm.new_password === passwordForm.confirm_password ? 'Passwords match' : 'Passwords do not match'}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordModal(false);
                        setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      setPasswordStrength({ hasMinLength: false, hasUppercase: false, hasLowercase: false, hasNumber: false, hasSymbol: false, score: 0 });
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
                      }}
                      className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isUpdating}
                      className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
                    >
                      {isUpdating ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Updating...</span>
                        </>
                      ) : (
                        <span>Change Password</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        <TwoFactorSetupModal
          isOpen={showTwoFactorSetupModal}
          onClose={() => setShowTwoFactorSetupModal(false)}
          onComplete={fetchTwoFactorStatus}
        />
      </div>
    </div>
  );
}