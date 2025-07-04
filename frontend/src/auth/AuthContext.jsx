import { createContext, useContext, useEffect, useState } from "react";
import { getUserProfile } from "../lib/api"; // Import this to fetch profile using cookie

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from cookie/session on initial mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await getUserProfile(); // This will use the httpOnly cookie
        setUser(res.data); // Set user from API
      } catch (err) {
        console.log("No active session");
        setUser(null); // Not logged in
      } finally {
        setLoading(false); // Done loading
      }
    };

    fetchUser();
  }, []);

  const login = (userData) => {
    setUser(userData); // You might not need localStorage anymore
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
