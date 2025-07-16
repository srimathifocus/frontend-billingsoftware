import { useState, useEffect } from "react";
import { useDebounce } from "./useDebounce";
import api from "../utils/api";
import { ProductCodeCheckResponse } from "../types";

interface ProductCodeValidationState {
  isChecking: boolean;
  isAvailable: boolean | null;
  message: string;
  isValid: boolean;
  hasChecked: boolean;
}

export const useProductCodeValidation = (
  productCode: string,
  isEditing: boolean = false
) => {
  const [validationState, setValidationState] =
    useState<ProductCodeValidationState>({
      isChecking: false,
      isAvailable: null,
      message: "",
      isValid: false,
      hasChecked: false,
    });

  // Debounce the product code to avoid excessive API calls
  const debouncedProductCode = useDebounce(productCode, 800);

  // Function to validate product code format
  const isValidFormat = (code: string): boolean => {
    // Check if the code contains only alphanumeric characters
    const alphanumericRegex = /^[A-Z0-9]+$/;
    return alphanumericRegex.test(code);
  };

  // Function to check product code availability
  const checkProductCodeAvailability = async (code: string) => {
    if (!code || code.length < 3) {
      setValidationState({
        isChecking: false,
        isAvailable: null,
        message:
          code.length > 0 ? "Product code must be at least 3 characters" : "",
        isValid: false,
        hasChecked: false,
      });
      return;
    }

    if (!isValidFormat(code)) {
      setValidationState({
        isChecking: false,
        isAvailable: null,
        message: "Product code must contain only alphanumeric characters",
        isValid: false,
        hasChecked: false,
      });
      return;
    }

    setValidationState((prev) => ({
      ...prev,
      isChecking: true,
      message: "Checking availability...",
    }));

    try {
      const response = await api.get<ProductCodeCheckResponse>(
        `/products/check-code/${code.toUpperCase()}`
      );

      const { isAvailable, message } = response.data;

      setValidationState({
        isChecking: false,
        isAvailable,
        message,
        isValid: isAvailable,
        hasChecked: true,
      });
    } catch (error) {
      console.error("Error checking product code:", error);
      setValidationState({
        isChecking: false,
        isAvailable: false,
        message: "Error checking product code availability",
        isValid: false,
        hasChecked: true,
      });
    }
  };

  // Effect to check product code when debounced value changes
  useEffect(() => {
    if (
      debouncedProductCode &&
      debouncedProductCode.length >= 3 &&
      !isEditing
    ) {
      checkProductCodeAvailability(debouncedProductCode);
    } else if (!debouncedProductCode) {
      setValidationState({
        isChecking: false,
        isAvailable: null,
        message: "",
        isValid: false,
        hasChecked: false,
      });
    }
  }, [debouncedProductCode, isEditing]);

  // Manual verification function for button click
  const verifyProductCode = () => {
    if (productCode && !isEditing) {
      // Force immediate check without debounce
      checkProductCodeAvailability(productCode);
    } else if (!productCode) {
      setValidationState({
        isChecking: false,
        isAvailable: null,
        message: "Please enter a product code",
        isValid: false,
        hasChecked: false,
      });
    }
  };

  return {
    ...validationState,
    verifyProductCode,
  };
};
