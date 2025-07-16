import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Upload,
  Trash2,
  Edit,
  Plus,
  X,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import api from "../utils/api";
import { Banner } from "../types";
import { colors, themeConfig } from "../theme/colors";

interface BannersResponse {
  banners: Banner[];
  total: number;
  page: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const fetchBanners = async (params: {
  page?: number;
  limit?: number;
  type?: string;
}): Promise<BannersResponse> => {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.append("page", params.page.toString());
  if (params.limit) searchParams.append("limit", params.limit.toString());
  if (params.type && params.type !== "all")
    searchParams.append("type", params.type);

  const queryString = searchParams.toString();
  const url = queryString ? `/banners?${queryString}` : "/banners";

  console.log("Fetching banners from:", url);

  const response = await api.get(url);
  console.log("Banners API response:", response.data);

  return response.data;
};

export const BannersPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [updateFile, setUpdateFile] = useState<File | null>(null);
  const [bannerType, setBannerType] = useState<"landscape" | "portrait">(
    "landscape"
  );
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [filterType, setFilterType] = useState<
    "all" | "landscape" | "portrait"
  >("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);

  const queryClient = useQueryClient();

  const {
    data: bannersData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["banners", currentPage, itemsPerPage, filterType],
    queryFn: () =>
      fetchBanners({
        page: currentPage,
        limit: itemsPerPage,
        type: filterType,
      }),
    refetchOnWindowFocus: false,
    staleTime: 30000, // Consider data fresh for 30 seconds
    retry: (failureCount, error) => {
      // Don't retry on 404 errors
      if (error?.response?.status === 404) return false;
      return failureCount < 2;
    },
  });

  const banners = bannersData?.banners || [];
  const totalPages = bannersData?.pages || 1;
  const totalBanners = bannersData?.total || 0;

  // Reset to page 1 if current page exceeds total pages
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  // Check for upload parameter in URL and open modal
  useEffect(() => {
    const shouldOpenUpload = searchParams.get("upload");
    if (shouldOpenUpload === "true" && !isUploadModalOpen) {
      setIsUploadModalOpen(true);
      // Clean up the URL parameter
      searchParams.delete("upload");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, isUploadModalOpen]);

  const uploadMutation = useMutation({
    mutationFn: async (data: { files: File[]; type: string }) => {
      const formData = new FormData();
      data.files.forEach((file) => {
        formData.append("banners", file);
      });
      formData.append("type", data.type);

      console.log(
        "Uploading banners:",
        data.files.length,
        "files of type:",
        data.type
      );

      const response = await api.post("/banners", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("Upload response:", response.data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      toast.success(
        `${
          Array.isArray(data) ? data.length : 1
        } banner(s) uploaded successfully!`
      );
      setIsUploadModalOpen(false);
      setSelectedFiles([]);
      setBannerType("landscape");
    },
    onError: (error: any) => {
      console.error("Upload error:", error);
      toast.error(error.response?.data?.message || "Failed to upload banners");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; file: File }) => {
      const formData = new FormData();
      formData.append("banner", data.file);

      console.log("Updating banner:", data.id);

      const response = await api.put(`/banners/${data.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("Update response:", response.data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      toast.success("Banner updated successfully!");
      setIsUpdateModalOpen(false);
      setUpdateFile(null);
      setSelectedBanner(null);
    },
    onError: (error: any) => {
      console.error("Update error:", error);
      toast.error(error.response?.data?.message || "Failed to update banner");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log("Deleting banner:", id);

      const response = await api.delete(`/banners/${id}`);
      console.log("Delete response:", response.data);

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      toast.success("Banner deleted successfully!");
    },
    onError: (error: any) => {
      console.error("Delete error:", error);
      toast.error(error.response?.data?.message || "Failed to delete banner");
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 5) {
      toast.error("Maximum 5 files allowed");
      return;
    }
    setSelectedFiles(files);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select at least one file");
      return;
    }

    uploadMutation.mutate({ files: selectedFiles, type: bannerType });
  };

  const handleUpdateFileSelect = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setUpdateFile(file);
    }
  };

  const handleUpdate = () => {
    if (!updateFile || !selectedBanner) {
      toast.error("Please select a file");
      return;
    }

    updateMutation.mutate({ id: selectedBanner._id, file: updateFile });
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this banner?")) {
      deleteMutation.mutate(id);
    }
  };

  const openUpdateModal = (banner: Banner) => {
    setSelectedBanner(banner);
    setIsUpdateModalOpen(true);
  };

  const closeUpdateModal = () => {
    setIsUpdateModalOpen(false);
    setUpdateFile(null);
    setSelectedBanner(null);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));

    if (imageFiles.length > 5) {
      toast.error("Maximum 5 files allowed");
      return;
    }

    if (imageFiles.length > 0) {
      setSelectedFiles(imageFiles);
      setIsUploadModalOpen(true);
    }
  };

  // Handle filter change
  const handleFilterChange = (
    newFilterType: "all" | "landscape" | "portrait"
  ) => {
    setFilterType(newFilterType);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Generate page numbers for pagination (smart pagination)
  const getPageNumbers = () => {
    const delta = 2; // Number of pages to show around current page
    const pages = [];

    if (totalPages <= 7) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Smart pagination for many pages
      if (currentPage <= 3) {
        // Near beginning
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near end
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // In middle
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - delta; i <= currentPage + delta; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-2"></div>
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-96"></div>
          </div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
        </div>

        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="aspect-video bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                  <div className="flex space-x-2">
                    <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                </div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Banner Management
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Upload and manage your store banners
          </p>
        </div>
        <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <div className="text-red-600 dark:text-red-400 mb-4">
            <ImageIcon size={48} className="mx-auto mb-2" />
            <h3 className="text-lg font-semibold">Failed to load banners</h3>
            <p className="text-sm mt-1">
              {error instanceof Error
                ? error.message
                : "An unexpected error occurred"}
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              style={{ borderRadius: themeConfig.borderRadius }}
            >
              Try Again
            </button>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-4 py-2 text-white rounded-lg hover:shadow-md transition-all"
              style={{
                backgroundColor: colors.primary.medium,
                borderRadius: themeConfig.borderRadius,
              }}
            >
              Upload Banners
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="space-y-6"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragOver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 pointer-events-none">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-xl">
            <Upload size={48} className="mx-auto mb-4 text-blue-500" />
            <p className="text-xl font-semibold text-center">
              Drop your banner images here
            </p>
            <p className="text-gray-600 dark:text-gray-400 text-center mt-2">
              Maximum 5 images allowed
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Banner Management
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Upload and manage your store banners (Max 5 at a time)
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Filter */}
          <select
            value={filterType}
            onChange={(e) =>
              handleFilterChange(
                e.target.value as "all" | "landscape" | "portrait"
              )
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            style={{ borderRadius: themeConfig.borderRadius }}
          >
            <option value="all">All Banners ({totalBanners})</option>
            <option value="landscape">Landscape</option>
            <option value="portrait">Portrait</option>
          </select>

          {/* Upload Button */}
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-white font-medium hover:shadow-md transition-all whitespace-nowrap"
            style={{
              backgroundColor: colors.primary.medium,
              borderRadius: themeConfig.borderRadius,
            }}
          >
            <Plus size={20} />
            <span>Upload Banners</span>
          </button>
        </div>
      </div>

      {/* Banners Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {banners.map((banner) => (
          <div
            key={banner._id}
            className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
            style={{
              borderRadius: themeConfig.borderRadius,
            }}
          >
            <div className="aspect-video bg-gray-100 dark:bg-gray-700 relative">
              <img
                src={banner.imageUrl}
                alt={`Banner - ${banner.type}`}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src =
                    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04NSA4NUwxMTUgMTE1TTExNSA4NUw4NSAxMTUiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPHN2Zz4K";
                }}
              />
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span
                  className="px-2 py-1 text-xs font-medium rounded"
                  style={{
                    backgroundColor: colors.primary.light + "20",
                    color: colors.primary.dark,
                  }}
                >
                  {banner.type}
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openUpdateModal(banner)}
                    className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                    title="Update banner"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(banner._id)}
                    className="p-1 text-red-600 hover:text-red-800 transition-colors"
                    title="Delete banner"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Uploaded: {new Date(banner.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {banners.length === 0 && (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <ImageIcon size={64} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {filterType === "all"
                ? "No banners uploaded yet"
                : `No ${filterType} banners found`}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {filterType === "all"
                ? "Upload your first banner to get started. You can drag and drop images here or use the upload button."
                : `Try changing the filter or upload a ${filterType} banner.`}
            </p>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-lg text-white font-medium hover:shadow-md transition-all"
              style={{
                backgroundColor: colors.primary.medium,
                borderRadius: themeConfig.borderRadius,
              }}
            >
              <Plus size={20} />
              <span>Upload Banner</span>
            </button>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6">
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <span>
              Showing {banners.length} of {totalBanners} banners
              {filterType !== "all" && ` (${filterType})`}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            {/* Previous Button */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center px-2 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{ borderRadius: themeConfig.borderRadius }}
            >
              <ChevronLeft size={16} />
              <span className="hidden sm:inline ml-1">Previous</span>
            </button>

            {/* Page Numbers */}
            <div className="flex items-center space-x-1">
              {getPageNumbers().map((page, index) => {
                if (page === "...") {
                  return (
                    <span
                      key={`ellipsis-${index}`}
                      className="px-2 py-1 text-sm text-gray-500 dark:text-gray-400"
                    >
                      ...
                    </span>
                  );
                }

                const pageNumber = page as number;
                const isCurrentPage = currentPage === pageNumber;

                return (
                  <button
                    key={pageNumber}
                    onClick={() => handlePageChange(pageNumber)}
                    className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                      isCurrentPage
                        ? "text-white shadow-sm"
                        : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                    }`}
                    style={
                      isCurrentPage
                        ? {
                            backgroundColor: colors.primary.medium,
                            borderRadius: themeConfig.borderRadius,
                          }
                        : {
                            borderRadius: themeConfig.borderRadius,
                          }
                    }
                  >
                    {pageNumber}
                  </button>
                );
              })}
            </div>

            {/* Next Button */}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center px-2 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{ borderRadius: themeConfig.borderRadius }}
            >
              <span className="hidden sm:inline mr-1">Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full"
            style={{
              borderRadius: themeConfig.borderRadius,
              width: themeConfig.sizing,
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Upload Banners
              </h3>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Banner Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Banner Type
                </label>
                <select
                  value={bannerType}
                  onChange={(e) =>
                    setBannerType(e.target.value as "landscape" | "portrait")
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  style={{ borderRadius: themeConfig.borderRadius }}
                >
                  <option value="landscape">Landscape</option>
                  <option value="portrait">Portrait</option>
                </select>
              </div>

              {/* File Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Images (Max 5)
                </label>
                <div
                  className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                  style={{ borderRadius: themeConfig.borderRadius }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const files = Array.from(e.dataTransfer.files);
                    const imageFiles = files.filter((file) =>
                      file.type.startsWith("image/")
                    );
                    if (imageFiles.length > 5) {
                      toast.error("Maximum 5 files allowed");
                      return;
                    }
                    setSelectedFiles(imageFiles);
                  }}
                >
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="text-center">
                    <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Click to upload</span> or
                      drag and drop
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      PNG, JPG, GIF up to 1MB each
                    </p>
                  </div>
                </div>
              </div>

              {/* Selected Files Preview */}
              {selectedFiles.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Selected Files ({selectedFiles.length}/5)
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <X size={14} />
                        </button>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                          {file.name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Button */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setIsUploadModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  style={{ borderRadius: themeConfig.borderRadius }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={
                    uploadMutation.isPending || selectedFiles.length === 0
                  }
                  className="flex-1 px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50 transition-all"
                  style={{
                    backgroundColor: colors.primary.medium,
                    borderRadius: themeConfig.borderRadius,
                  }}
                >
                  {uploadMutation.isPending ? "Uploading..." : "Upload"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Banner Modal */}
      {isUpdateModalOpen && selectedBanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full"
            style={{
              borderRadius: themeConfig.borderRadius,
              width: themeConfig.sizing,
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Update Banner
              </h3>
              <button
                onClick={closeUpdateModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Current Banner Preview */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Banner
                </label>
                <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                  <img
                    src={selectedBanner.imageUrl}
                    alt="Current banner"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span
                    className="px-2 py-1 text-xs font-medium rounded"
                    style={{
                      backgroundColor: colors.primary.light + "20",
                      color: colors.primary.dark,
                    }}
                  >
                    {selectedBanner.type}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(selectedBanner.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* File Input for New Banner */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select New Image
                </label>
                <div
                  className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                  style={{ borderRadius: themeConfig.borderRadius }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const files = Array.from(e.dataTransfer.files);
                    const imageFile = files.find((file) =>
                      file.type.startsWith("image/")
                    );
                    if (imageFile) {
                      setUpdateFile(imageFile);
                    }
                  }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUpdateFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="text-center">
                    <Upload size={24} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Click to upload</span> or
                      drag and drop
                    </p>
                  </div>
                </div>
              </div>

              {/* Selected File Preview */}
              {updateFile && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    New Image Preview
                  </label>
                  <div className="relative">
                    <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                      <img
                        src={URL.createObjectURL(updateFile)}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      onClick={() => setUpdateFile(null)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <X size={14} />
                    </button>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {updateFile.name}
                    </p>
                  </div>
                </div>
              )}

              {/* Update Button */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={closeUpdateModal}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  style={{ borderRadius: themeConfig.borderRadius }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={updateMutation.isPending || !updateFile}
                  className="flex-1 px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50 transition-all"
                  style={{
                    backgroundColor: colors.primary.medium,
                    borderRadius: themeConfig.borderRadius,
                  }}
                >
                  {updateMutation.isPending ? "Updating..." : "Update"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
