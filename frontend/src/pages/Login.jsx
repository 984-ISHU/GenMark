import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { loginUser, registerUser } from "../lib/api";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Sparkles,
  ArrowRight,
} from "lucide-react";

function Login() {
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Get redirect path from URL or default to dashboard
  const searchParams = new URLSearchParams(location.search);
  const redirect = searchParams.get("redirect") || "/dashboard";

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let response;

      if (isLogin) {
        // Login using API function
        response = await loginUser({
          identifier,
          password,
        });
      } else {
        // Register using API function
        console.log("Sending register request with:", {
          username,
          email,
          password,
        });

        response = await registerUser({
          username,
          email,
          password,
        });
        
        // After successful registration, automatically log in
        if (response.status === 200) {
          response = await loginUser({
            identifier: username, // Use username as identifier
            password,
          });
        }
      }

      // Handle successful authentication
      const userData = response.data;
      console.log("Login response:", userData);

      // Don't manually set cookies - let the backend handle httpOnly cookies
      // Store user data in localStorage and context
      if (userData.user) {
        localStorage.setItem("user", JSON.stringify(userData.user));
        login(userData.user);
      } else {
        // Fallback for registration response
        localStorage.setItem("user", JSON.stringify(userData));
        login(userData);
      }

      navigate(redirect, { replace: true });

    } catch (err) {
      console.error("Authentication error:", err.response?.data);
      setError(err.response?.data?.detail || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-4 -left-4 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -right-8 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-700"></div>
        <div className="absolute -bottom-8 left-1/3 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-300"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-3 mr-3">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight">
              GenMark
            </h1>
          </div>
          <p className="text-white/90 text-lg font-medium">
            🎯 Personalized Marketing Studio
          </p>
        </div>

        {/* Auth Form */}
        <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              {isLogin ? "Welcome Back!" : "Join GenMark"}
            </h2>
            <p className="text-gray-600">
              {isLogin
                ? "Sign in to continue creating amazing content"
                : "Create your account and start building"}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            {/* Register fields */}
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Username
                  </label>
                  <input
                    type="text"
                    placeholder="Choose a username"
                    className="w-full p-4 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 placeholder-gray-500"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required={!isLogin}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="w-full p-4 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 placeholder-gray-500"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required={!isLogin}
                  />
                </div>
              </>
            )}

            {/* Login field */}
            {isLogin && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Username or Email
                </label>
                <input
                  type="text"
                  placeholder="Enter username or email"
                  className="w-full p-4 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 placeholder-gray-500"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required={isLogin}
                />
              </div>
            )}

            {/* Password field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="w-full p-4 pr-12 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 placeholder-gray-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 text-white p-4 rounded-xl font-semibold text-lg hover:from-purple-700 hover:via-pink-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  {isLogin ? "Sign In" : "Create Account"}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Error message */}
          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              {error}
            </div>
          )}

          {/* Toggle auth mode */}
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            </p>
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
                // Clear form fields when switching
                setIdentifier("");
                setUsername("");
                setEmail("");
                setPassword("");
              }}
              className="mt-2 bg-gradient-to-br from-slate-400 via-purple-500 to-slate-400 text-gray-800 hover:text-purple-700 font-semibold text-lg transition-colors hover:underline"
            >
              {isLogin ? "Create new account" : "Sign in instead"}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-white/70 text-sm">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;