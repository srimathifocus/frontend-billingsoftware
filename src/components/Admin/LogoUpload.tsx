import React, { useState, useRef } from "react";
import { Upload, X, Check, AlertCircle } from "lucide-react";
import { colors } from "../../theme/colors";

interface LogoUploadProps {
  onUploadSuccess?: () => void;
  currentLogo?: string | null;
}

export const LogoUpload: React.FC<LogoUploadProps> = ({
  onUploadSuccess,
  currentLogo,
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error" | null;
    text: string;
  }>({
    type: null,
    text: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "File size must be less than 5MB" });
      return;
    }

    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Only image files are allowed" });
      return;
    }

    uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setMessage({ type: null, text: "" });

    try {
      const formData = new FormData();
      formData.append("logo", file);

      const token = sessionStorage.getItem("admin_token");
      const response = await fetch("/api/logo/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: "success", text: "Logo uploaded successfully!" });
        if (onUploadSuccess) onUploadSuccess();
      } else {
        setMessage({ type: "error", text: result.message || "Upload failed" });
      }
    } catch (error) {
      console.error("Upload error:", error);
      setMessage({ type: "error", text: "Upload failed. Please try again." });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete the current logo?")) return;

    setUploading(true);
    try {
      const token = sessionStorage.getItem("admin_token");
      const response = await fetch("/api/logo/delete", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: "success", text: "Logo deleted successfully!" });
        if (onUploadSuccess) onUploadSuccess();
      } else {
        setMessage({ type: "error", text: result.message || "Delete failed" });
      }
    } catch (error) {
      console.error("Delete error:", error);
      setMessage({ type: "error", text: "Delete failed. Please try again." });
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Shop Logo Management
      </h3>

      {/* Current Logo Display */}
      {currentLogo && (
        <div className="mb-6 text-center">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Current Logo
          </h4>
          <div className="inline-block relative">
            <img
              src={currentLogo}
              alt="Current Logo"
              className="max-w-32 max-h-32 rounded-lg shadow-md"
            />
            <button
              onClick={handleDelete}
              disabled={uploading}
              className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg transition-colors disabled:opacity-50"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragOver
            ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20"
            : "border-gray-300 dark:border-gray-600"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const files = e.target.files;
            if (files && files.length > 0) {
              handleFileSelect(files[0]);
            }
          }}
        />

        <div className="flex flex-col items-center space-y-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${colors.primary.light}20` }}
          >
            <Upload
              size={32}
              className="text-gray-400"
              style={{ color: colors.primary.medium }}
            />
          </div>

          <div>
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {currentLogo ? "Upload New Logo" : "Upload Shop Logo"}
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Drop your image here, or{" "}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-600 hover:text-blue-800 font-medium"
                style={{ color: colors.primary.medium }}
                disabled={uploading}
              >
                browse
              </button>
            </p>
            <p className="text-xs text-gray-400">
              Supports: PNG, JPG, JPEG • Max size: 5MB
            </p>
          </div>

          {uploading && (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-gray-600">Uploading...</span>
            </div>
          )}
        </div>
      </div>

      {/* Status Message */}
      {message.text && (
        <div
          className={`mt-4 p-3 rounded-lg flex items-center space-x-2 ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.type === "success" ? (
            <Check size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          <span className="text-sm">{message.text}</span>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <h5 className="font-medium text-gray-900 dark:text-white mb-2">
          Logo Guidelines:
        </h5>
        <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
          <li>• Square or rectangular images work best</li>
          <li>• Recommended minimum size: 200x200 pixels</li>
          <li>• Logo will appear in login page and sidebar</li>
          <li>• Only one logo can be active at a time</li>
          <li>• Uploading a new logo will replace the current one</li>
        </ul>
      </div>
    </div>
  );
};
