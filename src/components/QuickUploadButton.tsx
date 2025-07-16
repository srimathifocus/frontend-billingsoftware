import { useState } from "react";
import { Plus } from "lucide-react";
import { BannerUploadModal } from "./BannerUploadModal";
import { colors, themeConfig } from "../theme/colors";

interface QuickUploadButtonProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const QuickUploadButton = ({
  className = "",
  size = "md",
}: QuickUploadButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-12 h-12",
    lg: "w-14 h-14",
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`${sizeClasses[size]} rounded-full text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group ${className}`}
        style={{
          backgroundColor: colors.primary.medium,
          borderRadius:
            themeConfig.borderRadius === "rounded-lg"
              ? "50%"
              : themeConfig.borderRadius,
        }}
        title="Quick Upload Banner"
      >
        <Plus
          size={iconSizes[size]}
          className="group-hover:rotate-90 transition-transform duration-200"
        />
      </button>

      <BannerUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};
