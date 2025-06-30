import { useState, useEffect } from 'react';
import { User, Mail, Lock, Edit2, Save, X, Eye, EyeOff, LogOut } from 'lucide-react';
import { useAuth } from '../auth/AuthContext'; // Import your AuthContext
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user: contextUser, logout } = useAuth(); // Get user from context
  const navigate = useNavigate();
  
  const [user, setUser] = useState({ username: '', email: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Username editing state
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [usernameLoading, setUsernameLoading] = useState(false);
  
  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Initialize user data from context or fetch from API
  useEffect(() => {
    if (contextUser) {
      // If user data is available in context, use it
      setUser({
        username: contextUser.username || contextUser.user?.username || '',
        email: contextUser.email || contextUser.user?.email || ''
      });
      setNewUsername(contextUser.username || contextUser.user?.username || '');
      setLoading(false);
    } else {
      // Otherwise, fetch from API
      fetchProfile();
    }
  }, [contextUser]);

  const fetchProfile = async () => {
    try {
      // Get token from localStorage or cookies
      const token = localStorage.getItem('access_token') || getCookie('access_token');
      
      const response = await fetch('http://localhost:8000/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setNewUsername(userData.username);
      } else if (response.status === 401) {
        // Token expired or invalid, redirect to login
        navigate('/login');
      } else {
        setError('Failed to load profile');
      }
    } catch (err) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get cookie value
  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  };

  const handleUsernameEdit = () => {
    setIsEditingUsername(true);
    setNewUsername(user.username);
    setError('');
    setSuccess('');
  };

  const handleUsernameSave = async () => {
    if (newUsername.trim().length < 3) {
      setError('Username must be at least 3 characters long');
      return;
    }
    
    if (newUsername === user.username) {
      setIsEditingUsername(false);
      return;
    }

    setUsernameLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token') || getCookie('access_token');
      
      const response = await fetch('http://localhost:8000/api/user/update-username', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ username: newUsername.trim() })
      });

      const data = await response.json();

      if (response.ok) {
        setUser({ ...user, username: newUsername.trim() });
        setIsEditingUsername(false);
        setSuccess('Username updated successfully!');
        
        // Update token if provided
        if (data.new_token) {
          localStorage.setItem('access_token', data.new_token);
        }
      } else {
        setError(data.detail || 'Failed to update username');
      }
    } catch (err) {
      setError('Failed to update username');
    } finally {
      setUsernameLoading(false);
    }
  };

  const handleUsernameCancel = () => {
    setIsEditingUsername(false);
    setNewUsername(user.username);
    setError('');
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    setPasswordLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token') || getCookie('access_token');
      
      const response = await fetch('http://localhost:8000/api/user/change-password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          current_password: passwordData.currentPassword,
          new_password: passwordData.newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Password updated successfully!');
        setShowPasswordForm(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setError(data.detail || 'Failed to update password');
      }
    } catch (err) {
      setError('Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('access_token') || getCookie('access_token');
      
      await fetch('http://localhost:8000/api/user/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });
      
      // Clear local storage and context
      localStorage.removeItem('access_token');
      logout(); // Call logout from AuthContext
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
      // Even if logout fails, clear local data and redirect
      localStorage.removeItem('access_token');
      logout();
      navigate('/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
          <p className="text-gray-600">Manage your account information</p>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-8">
            <div className="flex items-center">
              <div className="bg-white rounded-full p-3 mr-4">
                <User size={32} className="text-indigo-600" />
              </div>
              <div className="text-white">
                <h2 className="text-2xl font-bold">{user.username}</h2>
                <p className="text-indigo-100">{user.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="ml-auto bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Username Section */}
            <div className="border-b border-gray-200 pb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <User size={20} className="text-gray-400 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">Username</h3>
                </div>
              </div>
              
              {!isEditingUsername ? (
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 text-lg">{user.username}</span>
                  <button
                    onClick={handleUsernameEdit}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Edit2 size={16} />
                    Edit
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter new username"
                    disabled={usernameLoading}
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={handleUsernameSave}
                      disabled={usernameLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {usernameLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Save size={16} />
                      )}
                      Save
                    </button>
                    <button
                      onClick={handleUsernameCancel}
                      disabled={usernameLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      <X size={16} />
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Email Section */}
            <div className="border-b border-gray-200 pb-6">
              <div className="flex items-center mb-4">
                <Mail size={20} className="text-gray-400 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Email</h3>
              </div>
              <span className="text-gray-700 text-lg">{user.email}</span>
              <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            {/* Password Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Lock size={20} className="text-gray-400 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">Password</h3>
                </div>
                {!showPasswordForm && (
                  <button
                    onClick={() => setShowPasswordForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Lock size={16} />
                    Change Password
                  </button>
                )}
              </div>

              {showPasswordForm && (
                <div className="space-y-4">
                  {/* Current Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.current ? "text" : "password"}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                        className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('current')}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords.current ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.new ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                        className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('new')}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirm ? "text" : "password"}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                        className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('confirm')}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handlePasswordChange}
                      disabled={passwordLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {passwordLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Save size={16} />
                      )}
                      Save Password
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordForm(false);
                        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                        setError('');
                      }}
                      disabled={passwordLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      <X size={16} />
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;