import { createContext, useContext, useEffect, useState } from "react";
import { getUserProfile, logoutUser } from "../lib/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, fetch the user using the session cookie
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await getUserProfile();
        setUser(res.data);
      } catch (err) {
        console.log("Not logged in or session expired.");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = (userData) => {
    setUser(userData); // Called after successful login
  };

  const logout = async () => {
    try {
      await logoutUser(); // Invalidate session on backend
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setUser(null); // Clear context
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
