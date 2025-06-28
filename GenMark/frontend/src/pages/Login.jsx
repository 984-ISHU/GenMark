import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Login() {
  const [isLogin, setIsLogin] = useState(true); // Toggle between login/signup
  const [identifier, setIdentifier] = useState(""); // email or username
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState(""); // only for signup
  const [email, setEmail] = useState("");       // only for signup

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async () => {
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        // Login
        const res = await axios.post("http://localhost:8000/api/user/login", {
          identifier,
          password,
        });
        // Store user (optional)
        localStorage.setItem("user", JSON.stringify(res.data));
        navigate("/dashboard");
      } else {
        // Register
        const res = await axios.post("http://localhost:8000/api/user/register", {
          username,
          email,
          password,
        });
        localStorage.setItem("user", JSON.stringify(res.data));
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white shadow-lg p-6 rounded space-y-6">
        <h2 className="text-2xl font-semibold text-center">
          {isLogin ? "Login to Your Account" : "Create an Account"}
        </h2>

        {!isLogin && (
          <>
            <input
              className="w-full px-4 py-2 border rounded"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              className="w-full px-4 py-2 border rounded"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </>
        )}

        {isLogin && (
          <input
            className="w-full px-4 py-2 border rounded"
            placeholder="Username or Email"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />
        )}

        <input
          type="password"
          className="w-full px-4 py-2 border rounded"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleAuth}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? "Please wait..." : isLogin ? "Login" : "Register"}
        </button>

        {error && <div className="text-red-600 text-center">{error}</div>}

        <p className="text-sm text-center text-gray-600">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            className="text-blue-600 hover:underline"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? "Register" : "Login"}
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;
