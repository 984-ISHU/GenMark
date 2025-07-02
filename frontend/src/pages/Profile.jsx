import { useState, useEffect } from 'react';
import { User, Mail, Lock, Edit2, Save, X, Eye, EyeOff, LogOut } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  getUserProfile, 
  updateUsername, 
  changePassword, 
  logoutUser 
} from '../lib/api';

const Profile = () => {
  const { user: contextUser, logout } = useAuth();
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
    if (contextUser && contextUser.email) {
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
      const response = await getUserProfile();
      const userData = response.data;
      
      console.log('Frontend - API Response:', userData); // Debug line
      console.log('Frontend - Email field:', userData.email); // Debug line
      
      setUser(userData);
      setNewUsername(userData.username);
    } catch (err) {
      console.error('Profile fetch error:', err);
      
      if (err.response?.status === 401) {
        // Token expired or invalid, redirect to login
        navigate('/login');
      } else {
        setError('Failed to load profile');
        toast.error('Failed to load profile');
      }
    } finally {
      setLoading(false);
    }
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
      toast.error('Username must be at least 3 characters long');
      return;
    }
    
    if (newUsername === user.username) {
      setIsEditingUsername(false);
      return;
    }

    setUsernameLoading(true);
    setError('');

    try {
      const response = await updateUsername({ username: newUsername.trim() });
      const data = response.data;

      setUser({ ...user, username: newUsername.trim() });
      setIsEditingUsername(false);
      setSuccess('Username updated successfully!');
      toast.success('Username updated successfully!');
      
      // Update token if provided
      if (data.new_token) {
        localStorage.setItem('access_token', data.new_token);
      }
    } catch (err) {
      console.error('Username update error:', err);
      const errorMessage = err.response?.data?.detail || 'Failed to update username';
      setError(errorMessage);
      toast.error(errorMessage);
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
      toast.error('New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      toast.error('New password must be at least 6 characters long');
      return;
    }

    setPasswordLoading(true);
    setError('');

    try {
      await changePassword({
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword
      });

      setSuccess('Password updated successfully!');
      toast.success('Password updated successfully!');
      setShowPasswordForm(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      console.error('Password change error:', err);
      const errorMessage = err.response?.data?.detail || 'Failed to update password';
      setError(errorMessage);
      toast.error(errorMessage);
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
      await logoutUser();
      
      // Clear local storage and context
      localStorage.removeItem('access_token');
      logout(); // Call logout from AuthContext
      toast.success('Logged out successfully!');
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
      // Even if logout fails, clear local data and redirect
      localStorage.removeItem('access_token');
      logout();
      toast.success('Logged out successfully!');
      navigate('/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-screen bg-gradient-to-br from-purple-300 via-pink-400 to-indigo-300 font-sans p-6 overflow-hidden flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-lg p-8 rounded-2xl shadow-2xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-purple-700 font-semibold">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-purple-300 via-pink-400 to-indigo-300 font-sans p-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-extrabold text-purple-700 tracking-tight">
            GenMark
          </h1>
          <p className="text-font-bold mt-1">
            👤 Profile Settings
          </p>
        </div>
        <div>
          <button
            className="bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-semibold py-2 px-6 rounded-3xl shadow-md hover:from-purple-700 hover:to-fuchsia-700 transition-all duration-200"
            onClick={() => navigate("/dashboard")}
          >
            🧠 Back to Dashboard
          </button>
        </div>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg max-w-4xl mx-auto">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg max-w-4xl mx-auto">
          {success}
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto">
        {/* Profile Header Card */}
        <div className="bg-white/80 backdrop-blur-lg border border-purple-200 shadow-2xl hover:shadow-purple-300 transition-shadow duration-300 rounded-2xl mb-6">
          <div className="bg-gradient-to-r from-purple-500 to-fuchsia-600 px-8 py-8 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-white rounded-full p-4 mr-6">
                  <User size={40} className="text-purple-600" />
                </div>
                <div className="text-white">
                  <h2 className="text-3xl font-bold">{user.username}</h2>
                  <p className="text-purple-100 text-lg">{user.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-full transition-colors flex items-center gap-2 font-semibold"
              >
                <LogOut size={20} />
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Username Section */}
          <div className="bg-white/80 backdrop-blur-lg border border-purple-200 shadow-2xl hover:shadow-purple-300 transition-shadow duration-300 rounded-2xl p-6">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-lg mr-4">
                <User size={20} />
              </div>
              <h3 className="text-xl font-bold text-purple-700">Username</h3>
            </div>
            
            {!isEditingUsername ? (
              <div className="space-y-4">
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                  <span className="text-purple-800 text-lg font-semibold">{user.username}</span>
                </div>
                <button
                  onClick={handleUsernameEdit}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white rounded-xl hover:from-purple-700 hover:to-fuchsia-700 transition-all duration-200 font-semibold"
                >
                  <Edit2 size={18} />
                  Edit Username
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-white rounded-xl border border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                  placeholder="Enter new username"
                  disabled={usernameLoading}
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleUsernameSave}
                    disabled={usernameLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 font-semibold"
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
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-200 font-semibold"
                  >
                    <X size={16} />
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Email Section */}
          <div className="bg-white/80 backdrop-blur-lg border border-purple-200 shadow-2xl hover:shadow-purple-300 transition-shadow duration-300 rounded-2xl p-6">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-lg mr-4">
                <Mail size={20} />
              </div>
              <h3 className="text-xl font-bold text-purple-700">Email</h3>
            </div>
            <div className="space-y-4">
              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200">
                <span className="text-indigo-800 text-lg font-semibold">{user.email}</span>
              </div>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                📧 Email cannot be changed for security reasons
              </p>
            </div>
          </div>
        </div>

        {/* Password Section */}
        <div className="bg-white/80 backdrop-blur-lg border border-purple-200 shadow-2xl hover:shadow-purple-300 transition-shadow duration-300 rounded-2xl p-6 mt-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center text-white text-lg mr-4">
                <Lock size={20} />
              </div>
              <h3 className="text-xl font-bold text-purple-700">Password</h3>
            </div>
            {!showPasswordForm && (
              <button
                onClick={() => setShowPasswordForm(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-xl hover:from-pink-700 hover:to-rose-700 transition-all duration-200 font-semibold"
              >
                <Lock size={16} />
                Change Password
              </button>
            )}
          </div>

          {showPasswordForm && (
            <div className="space-y-6">
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
                    className="w-full px-4 py-3 pr-12 bg-white rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('current')}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
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
                    className="w-full px-4 py-3 pr-12 bg-white rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('new')}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
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
                    className="w-full px-4 py-3 pr-12 bg-white rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirm')}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
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
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 font-semibold"
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
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-200 font-semibold"
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
  );
};

export default Profile;