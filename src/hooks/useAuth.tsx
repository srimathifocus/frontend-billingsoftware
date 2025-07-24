import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
} from "react";
import { User } from "../types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);

    // Clean up any old localStorage data (migration from localStorage to sessionStorage)
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");

    // Clear any corrupted data first
    const savedToken = sessionStorage.getItem("admin_token");
    const savedUser = sessionStorage.getItem("admin_user");

    console.log("Checking saved data:", { savedToken, savedUser });

    if (
      savedToken &&
      savedUser &&
      savedToken !== "undefined" &&
      savedUser !== "undefined"
    ) {
      try {
        const parsedUser = JSON.parse(savedUser);
        if (parsedUser && typeof parsedUser === "object") {
          setToken(savedToken);
          setUser(parsedUser);
          console.log("Successfully restored auth state");
        } else {
          throw new Error("Invalid user data");
        }
      } catch (error) {
        console.error("Error parsing saved user data:", error);
        // Clear corrupted data
        sessionStorage.removeItem("admin_token");
        sessionStorage.removeItem("admin_user");
        setToken(null);
        setUser(null);
      }
    } else {
      // Clear any undefined values
      if (savedToken === "undefined" || savedUser === "undefined") {
        sessionStorage.removeItem("admin_token");
        sessionStorage.removeItem("admin_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = (token: string, user: User) => {
    try {
      sessionStorage.setItem("admin_token", token);
      sessionStorage.setItem("admin_user", JSON.stringify(user));
      setToken(token);
      setUser(user);
      console.log("Login successful, token saved:", token);
    } catch (error) {
      console.error("Error saving login data:", error);
    }
  };

  const logout = () => {
    sessionStorage.removeItem("admin_token");
    sessionStorage.removeItem("admin_user");
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser: User) => {
    try {
      sessionStorage.setItem("admin_user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      console.log("User updated successfully:", updatedUser);
    } catch (error) {
      console.error("Error updating user data:", error);
    }
  };

  const isAuthenticated = !!token && !!user;

  console.log("useAuth state:", {
    hasToken: !!token,
    hasUser: !!user,
    isAuthenticated,
    isLoading,
    tokenLength: token?.length || 0,
  });

  const value = {
    user,
    token,
    login,
    logout,
    updateUser,
    isAuthenticated,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
