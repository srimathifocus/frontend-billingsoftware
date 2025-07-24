import { useEffect, useRef, useCallback } from "react";
import { toast } from "react-toastify";
import { useAuth } from "./useAuth";

interface UseAutoLogoutOptions {
  timeoutDuration?: number; // in milliseconds, default 5 minutes
  warningDuration?: number; // in milliseconds, default 20 seconds before logout
}

export const useAutoLogout = ({
  timeoutDuration = 5 * 60 * 1000, // 5 minutes
  warningDuration = 20 * 1000, // 20 seconds
}: UseAutoLogoutOptions = {}) => {
  const { logout, isAuthenticated } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningToastRef = useRef<any>(null);

  const clearTimeouts = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }
    if (warningToastRef.current) {
      toast.dismiss(warningToastRef.current);
      warningToastRef.current = null;
    }
  }, []);

  const handleLogout = useCallback(() => {
    clearTimeouts();
    logout();
    toast.error("Session expired due to inactivity. Please login again.");
  }, [logout, clearTimeouts]);

  const showWarning = useCallback(() => {
    let countdown = Math.ceil(warningDuration / 1000);

    const updateToast = () => {
      if (countdown > 0) {
        warningToastRef.current = toast.warning(
          `You will be logged out in ${countdown} seconds due to inactivity. Move your mouse or click anywhere to stay logged in.`,
          {
            toastId: "logout-warning",
            autoClose: false,
            closeOnClick: false,
            draggable: false,
            hideProgressBar: false,
            position: "top-center",
            className: "logout-warning-toast",
          }
        );
        countdown--;
        setTimeout(updateToast, 1000);
      }
    };

    updateToast();
  }, [warningDuration]);

  const resetTimer = useCallback(() => {
    if (!isAuthenticated) return;

    clearTimeouts();

    // Set warning timer (timeout - warning duration)
    warningTimeoutRef.current = setTimeout(() => {
      showWarning();
    }, timeoutDuration - warningDuration);

    // Set logout timer
    timeoutRef.current = setTimeout(() => {
      handleLogout();
    }, timeoutDuration);
  }, [
    isAuthenticated,
    timeoutDuration,
    warningDuration,
    showWarning,
    handleLogout,
  ]);

  useEffect(() => {
    if (!isAuthenticated) {
      clearTimeouts();
      return;
    }

    // Events that indicate user activity
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
      "keydown",
    ];

    // Reset timer on any user activity
    const resetOnActivity = () => {
      // Dismiss warning toast if it exists
      if (warningToastRef.current) {
        toast.dismiss(warningToastRef.current);
        warningToastRef.current = null;
      }
      resetTimer();
    };

    // Add event listeners
    events.forEach((event) => {
      document.addEventListener(event, resetOnActivity, true);
    });

    // Initialize timer
    resetTimer();

    // Cleanup function
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, resetOnActivity, true);
      });
      clearTimeouts();
    };
  }, [isAuthenticated, resetTimer, clearTimeouts]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeouts();
    };
  }, [clearTimeouts]);

  return {
    resetTimer,
    clearTimeouts,
  };
};
