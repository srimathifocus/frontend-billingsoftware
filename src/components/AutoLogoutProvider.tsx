import { ReactNode } from "react";
import { useAutoLogout } from "../hooks/useAutoLogout";

interface AutoLogoutProviderProps {
  children: ReactNode;
}

export const AutoLogoutProvider = ({ children }: AutoLogoutProviderProps) => {
  // Initialize auto-logout with 5 minutes timeout and 20 seconds warning
  useAutoLogout({
    timeoutDuration: 5 * 60 * 1000, // 5 minutes
    warningDuration: 20 * 1000, // 20 seconds
  });

  return <>{children}</>;
};
