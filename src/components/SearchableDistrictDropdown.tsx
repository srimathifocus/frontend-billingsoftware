import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, MapPin } from "lucide-react";
import { colors } from "../theme/colors";

// Tamil Nadu Districts List
const TAMIL_NADU_DISTRICTS = [
  "Ariyalur",
  "Chengalpattu",
  "Chennai",
  "Coimbatore",
  "Cuddalore",
  "Dharmapuri",
  "Dindigul",
  "Erode",
  "Kallakurichi",
  "Kanchipuram",
  "Kanniyakumari",
  "Karur",
  "Krishnagiri",
  "Madurai",
  "Mayiladuthurai",
  "Nagapattinam",
  "Namakkal",
  "Nilgiris",
  "Perambalur",
  "Pudukkottai",
  "Ramanathapuram",
  "Ranipet",
  "Salem",
  "Sivaganga",
  "Tenkasi",
  "Thanjavur",
  "Theni",
  "Thoothukudi",
  "Tiruchirappalli",
  "Tirunelveli",
  "Tirupathur",
  "Tiruppur",
  "Tiruvallur",
  "Tiruvannamalai",
  "Tiruvarur",
  "Vellore",
  "Viluppuram",
  "Virudhunagar",
];

interface SearchableDistrictDropdownProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
}

export const SearchableDistrictDropdown: React.FC<
  SearchableDistrictDropdownProps
> = ({
  value,
  onChange,
  error,
  placeholder = "Select district",
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredDistricts, setFilteredDistricts] =
    useState(TAMIL_NADU_DISTRICTS);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter districts based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredDistricts(TAMIL_NADU_DISTRICTS);
    } else {
      const filtered = TAMIL_NADU_DISTRICTS.filter((district) =>
        district.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredDistricts(filtered);
    }
  }, [searchTerm]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (district: string) => {
    onChange(district);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchTerm("");
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Main Input */}
      <div
        className={`w-full px-3 py-2 border rounded-lg cursor-pointer flex items-center justify-between dark:bg-gray-800 dark:text-white ${
          error
            ? "border-red-500"
            : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
        } ${isOpen ? "ring-2 ring-blue-500 border-blue-500" : ""}`}
        onClick={handleToggle}
        style={{
          ...(error && { borderColor: colors.primary.dark }),
          ...(isOpen && {
            borderColor: colors.primary.light,
            boxShadow: `0 0 0 2px ${colors.primary.light}20`,
          }),
        }}
      >
        <div className="flex items-center gap-2 flex-1">
          <MapPin className="h-4 w-4 text-gray-400" />
          <span
            className={
              value
                ? "text-gray-900 dark:text-white"
                : "text-gray-500 dark:text-gray-400"
            }
          >
            {value || placeholder}
          </span>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search districts..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                style={{
                  focusRingColor: colors.primary.light,
                }}
              />
            </div>
          </div>

          {/* Districts List */}
          <div className="max-h-48 overflow-y-auto">
            {filteredDistricts.length > 0 ? (
              filteredDistricts.map((district) => (
                <div
                  key={district}
                  className={`px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-sm ${
                    value === district
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                      : "text-gray-900 dark:text-white"
                  }`}
                  onClick={() => handleSelect(district)}
                  style={{
                    ...(value === district && {
                      backgroundColor: colors.primary.light + "20",
                      color: colors.primary.dark,
                    }),
                  }}
                >
                  {district}
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                No districts found
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-sm mt-1" style={{ color: colors.primary.dark }}>
          {error}
        </p>
      )}
    </div>
  );
};
