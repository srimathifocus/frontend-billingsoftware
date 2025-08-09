import { useState, useEffect } from "react";

interface LogoInfo {
  hasLogo: boolean;
  filename?: string;
  size?: number;
  uploadedAt?: string;
}

// Get API base URL based on environment
const getApiBaseUrl = () => {
  return (
    import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.DEV
      ? "/api" // Use Vite proxy in development
      : "https://backend-billingsoftware.onrender.com/api")
  ); // Production backend URL
};

export const useLogo = () => {
  const [logoInfo, setLogoInfo] = useState<LogoInfo>({ hasLogo: false });
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLogoInfo = async () => {
    try {
      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/logo/info`);
      const data = await response.json();
      setLogoInfo(data);

      if (data.hasLogo) {
        // Create URL for logo with timestamp to prevent caching issues
        const timestamp = new Date().getTime();
        setLogoUrl(`${apiBaseUrl}/logo/current?t=${timestamp}`);
      } else {
        setLogoUrl(null);
      }
    } catch (error) {
      console.error("Failed to fetch logo info:", error);
      setLogoInfo({ hasLogo: false });
      setLogoUrl(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshLogo = () => {
    setLoading(true);
    fetchLogoInfo();
  };

  useEffect(() => {
    fetchLogoInfo();
  }, []);

  return {
    logoInfo,
    logoUrl,
    loading,
    refreshLogo,
    hasLogo: logoInfo.hasLogo,
  };
};
