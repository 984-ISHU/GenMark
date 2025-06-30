import { useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

function Login() {
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Get redirect path from URL or default to dashboard
  const searchParams = new URLSearchParams(location.search);
  const redirect = searchParams.get("redirect") || "/dashboard";

  const handleAuth = async () => {
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        // Login - Debug the request
        console.log("Sending login request with:", { identifier, password });
        
        const res = await axios.post("http://localhost:8000/api/user/login", {
          identifier,
          password,
        }, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        // Store token in localStorage
        if (res.data.access_token) {
          localStorage.setItem('access_token', res.data.access_token);
        }
        
        // Also set cookie if needed
        if (res.data.access_token) {
          document.cookie = `access_token=${res.data.access_token}; path=/; secure; samesite=lax; max-age=86400`; // 24 hours
        }
        
        login(res.data);
        navigate(redirect, { replace: true });
      } else {
        // Register - Debug the request
        console.log("Sending register request with:", { username, email, password });
        
        const res = await axios.post("http://localhost:8000/api/user/register", {
          username,
          email,
          password,
        }, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        // Store token in localStorage
        if (res.data.access_token) {
          localStorage.setItem('access_token', res.data.access_token);
        }
        
        // Also set cookie if needed
        if (res.data.access_token) {
          document.cookie = `access_token=${res.data.access_token}; path=/; secure; samesite=lax; max-age=86400`; // 24 hours
        }
        
        login(res.data);
        navigate(redirect, { replace: true });
      }
    } catch (err) {
      console.error("Authentication error:", err.response?.data);
      setError(err.response?.data?.detail || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
          {isLogin ? "Login to Your Account" : "Create an Account"}
        </h2>
        
        {!isLogin && (
          <>
            <input
              type="text"
              placeholder="Username"
              className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              type="email"
              placeholder="Email"
              className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </>
        )}
        
        {isLogin && (
          <input
            type="text"
            placeholder="Username or Email"
            className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />
        )}
        
        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 border border-gray-300 rounded-lg mb-6 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        
        <button
          onClick={handleAuth}
          disabled={loading}
          className="w-full bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {loading ? "Please wait..." : isLogin ? "Login" : "Register"}
        </button>
        
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        
        <p className="text-center mt-4 text-gray-600">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            {isLogin ? "Register" : "Login"}
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;