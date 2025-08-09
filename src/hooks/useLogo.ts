import { useState, useEffect } from "react";

interface LogoInfo {
  hasLogo: boolean;
  filename?: string;
  size?: number;
  uploadedAt?: string;
}

export const useLogo = () => {
  const [logoInfo, setLogoInfo] = useState<LogoInfo>({ hasLogo: false });
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLogoInfo = async () => {
    try {
      const response = await fetch("/api/logo/info");
      const data = await response.json();
      setLogoInfo(data);

      if (data.hasLogo) {
        // Create URL for logo with timestamp to prevent caching issues
        const timestamp = new Date().getTime();
        setLogoUrl(`/api/logo/current?t=${timestamp}`);
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
