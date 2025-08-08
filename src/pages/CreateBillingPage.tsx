import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  User,
  Package,
  CreditCard,
  Plus,
  Trash2,
  Save,
  MapPin,
  Phone,
  UserCheck,
  Printer,
  CheckCircle,
  ArrowLeft,
  X,
  AlertCircle,
  Info,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import api from "../utils/api";
import { BillingCreateRequest } from "../types";
import { colors, themeConfig } from "../theme/colors";
import { InvoiceViewButtons } from "../components/InvoiceViewButtons";

import { SearchableDistrictDropdown } from "../components/SearchableDistrictDropdown";

const createBilling = async (data: BillingCreateRequest) => {
  const response = await api.post("/billing/create", data);
  return response.data;
};

const fetchMasterItems = async () => {
  const response = await api.get("/items/master");
  return response.data;
};

export const CreateBillingPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedMasterItems, setSelectedMasterItems] = useState<{
    [key: number]: any;
  }>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdLoanData, setCreatedLoanData] = useState<any>(null);

  // Fetch master items for dropdowns
  const {
    data: masterItems = [],
    isLoading: masterItemsLoading,
    error: masterItemsError,
  } = useQuery({
    queryKey: ["master-items"],
    queryFn: fetchMasterItems,
  });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    trigger,
    clearErrors,
    reset,
  } = useForm<BillingCreateRequest>({
    defaultValues: {
      customer: {
        name: "",
        phone: "",
        address: {
          doorNo: "",
          street: "",
          town: "",
          district: "",
          pincode: "",
        },
        nominee: "",
      },
      items: [
        {
          code: "",
          name: "",
          category: "",
          carat: "",
          weight: "",
          estimatedValue: "",
        },
      ],
      loan: {
        amount: "",
        interestType: "monthly",
        interestPercent: 2.5,
        validity: "6",
      },
      payment: {
        cash: "",
        online: "",
      },
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const mutation = useMutation({
    mutationFn: createBilling,
    onSuccess: (response, variables) => {
      // Show success toast
      toast.success("Billing created successfully!", {
        position: "top-right",
        autoClose: 3000,
      });

      // Set created loan data and show success modal
      setCreatedLoanData({
        loanId: response.data.loanId,
        loanObjectId: response.data.loanObjectId,
        customerName: variables.customer.name,
      });
      setShowSuccessModal(true);

      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["active-loans"] });
      queryClient.invalidateQueries({ queryKey: ["billing-stats"] });

      // Reset form
      setCurrentStep(1);
      reset();
    },
    onError: (error: any) => {
      console.error("Billing creation error:", error);

      const errorMessage =
        error.response?.data?.message || "Failed to create billing";
      const errorType = error.response?.data?.error;

      // Show specific error messages based on error type
      if (errorType === "DUPLICATE_KEY_ERROR") {
        toast.error(
          "Duplicate Item Error",
          `${errorMessage}. Please use different item codes.`
        );
      } else if (errorType === "VALIDATION_ERROR") {
        const errors = error.response?.data?.errors;
        if (errors && errors.length > 0) {
          errors.forEach((err: string) =>
            toast.error("Validation Failed", err)
          );
        } else {
          toast.error("Validation Error", errorMessage);
        }
      } else {
        toast.error("Creation Failed", errorMessage);
      }
    },
  });

  const onSubmit = (data: BillingCreateRequest) => {
    // Generate unique codes for items if they don't have them
    const processedData = {
      ...data,
      items: data.items.map((item, index) => ({
        ...item,
        code: item.code || `BILLING_${Date.now()}_${index}`,
      })),
    };

    mutation.mutate(processedData);
  };

  // Step validation functions
  const validateStep1 = async () => {
    const result = await trigger([
      "customer.name",
      "customer.phone",
      "customer.address.doorNo",
      "customer.address.street",
      "customer.address.town",
      "customer.address.district",
      "customer.address.pincode",
      "customer.nominee",
    ]);
    return result;
  };

  const validateStep2 = async () => {
    const items = watch("items");

    // Check if at least one item exists
    if (!items || items.length === 0) {
      toast.warning(
        "No Items Added",
        "At least one item is required to proceed to the next step."
      );
      return false;
    }

    const result = await trigger("items");
    return result;
  };

  const handleNextStep = async () => {
    let isValid = false;

    if (currentStep === 1) {
      isValid = await validateStep1();
      if (!isValid) {
        toast.error(
          "Step 1 Incomplete",
          "Please complete all required customer information fields before proceeding."
        );
        // Scroll to top to show error fields
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
    } else if (currentStep === 2) {
      isValid = await validateStep2();
      if (!isValid) {
        toast.error(
          "Step 2 Incomplete",
          "Please complete all required item information fields before proceeding."
        );
        // Scroll to top to show error fields
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
    }

    if (isValid) {
      setCurrentStep(currentStep + 1);

      // Clear errors for the step we're moving to
      if (currentStep === 1) {
        // Moving to step 2, clear item errors
        clearErrors("items");
      } else if (currentStep === 2) {
        // Moving to step 3, clear loan and payment errors
        clearErrors(["loan", "payment"]);
      }

      // Scroll to top when moving to next step
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevStep = () => {
    const prevStep = Math.max(1, currentStep - 1);
    setCurrentStep(prevStep);

    // Clear errors for the step we're moving to
    if (prevStep === 1) {
      // Moving to step 1, clear customer errors
      clearErrors("customer");
    } else if (prevStep === 2) {
      // Moving to step 2, clear item errors
      clearErrors("items");
    }

    // Scroll to top when moving to previous step
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const watchedLoanAmount = watch("loan.amount");
  const watchedPayment = watch("payment");
  const watchedItems = watch("items");

  // Calculate total estimated value from all items
  const totalEstimatedValue =
    watchedItems?.reduce((sum: number, item: any) => {
      const itemValue = Number(item?.estimatedValue || 0);
      return sum + itemValue;
    }, 0) || 0;

  const totalPayment =
    Number(watchedPayment.cash || 0) + Number(watchedPayment.online || 0);
  const paymentBalance = Number(watchedLoanAmount || 0) - totalPayment;

  // Handle master item selection
  const handleMasterItemSelect = (index: number, masterItemId: string) => {
    if (!masterItemId) {
      // Clear selection if empty value is selected
      setSelectedMasterItems((prev) => {
        const newState = { ...prev };
        delete newState[index];
        return newState;
      });
      setValue(`items.${index}.code`, "");
      setValue(`items.${index}.name`, "");
      setValue(`items.${index}.category`, "");
      setValue(`items.${index}.carat`, "");
      return;
    }

    const masterItem = masterItems.find(
      (item: any) => item._id === masterItemId
    );
    if (masterItem) {
      setSelectedMasterItems((prev) => ({ ...prev, [index]: masterItem }));
      setValue(`items.${index}.code`, masterItem.code);
      setValue(`items.${index}.name`, masterItem.name);
      // Clear category and carat since user will select from available options
      setValue(`items.${index}.category`, "");
      setValue(`items.${index}.carat`, "");
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <div
          className="p-2 rounded-lg"
          style={{ backgroundColor: colors.primary[100] }}
        >
          <User
            className="h-5 w-5 sm:h-6 sm:w-6"
            style={{ color: colors.primary.dark }}
          />
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
            Customer Information
          </h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Enter customer details
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            {...register("customer.name", { required: "Name is required" })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:border-transparent dark:bg-gray-800 dark:text-white"
            style={{
              ...(errors.customer?.name && {
                borderColor: colors.primary.dark,
              }),
              ...(register("customer.name").name && {
                focusRingColor: colors.primary.light,
              }),
            }}
            placeholder="Enter customer name"
          />
          {errors.customer?.name && (
            <p className="text-sm mt-1" style={{ color: colors.primary.dark }}>
              {errors.customer.name.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Phone Number *
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="tel"
              {...register("customer.phone", {
                required: "Phone number is required",
                pattern: {
                  value: /^[0-9]{10}$/,
                  message: "Phone number must be 10 digits",
                },
              })}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:border-transparent dark:bg-gray-800 dark:text-white"
              style={{
                ...(errors.customer?.phone && {
                  borderColor: colors.primary.dark,
                }),
              }}
              placeholder="Enter phone number"
            />
          </div>
          {errors.customer?.phone && (
            <p className="text-sm mt-1" style={{ color: colors.primary.dark }}>
              {errors.customer.phone.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Door No *
          </label>
          <input
            type="text"
            {...register("customer.address.doorNo", {
              required: "Door number is required",
            })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:border-transparent dark:bg-gray-800 dark:text-white"
            style={{
              ...(errors.customer?.address?.doorNo && {
                borderColor: colors.primary.dark,
              }),
            }}
            placeholder="Door number"
          />
          {errors.customer?.address?.doorNo && (
            <p className="text-sm mt-1" style={{ color: colors.primary.dark }}>
              {errors.customer.address.doorNo.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Street *
          </label>
          <input
            type="text"
            {...register("customer.address.street", {
              required: "Street is required",
            })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:border-transparent dark:bg-gray-800 dark:text-white"
            style={{
              ...(errors.customer?.address?.street && {
                borderColor: colors.primary.dark,
              }),
            }}
            placeholder="Street name"
          />
          {errors.customer?.address?.street && (
            <p className="text-sm mt-1" style={{ color: colors.primary.dark }}>
              {errors.customer.address.street.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Town *
          </label>
          <input
            type="text"
            {...register("customer.address.town", {
              required: "Town is required",
            })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:border-transparent dark:bg-gray-800 dark:text-white"
            style={{
              ...(errors.customer?.address?.town && {
                borderColor: colors.primary.dark,
              }),
            }}
            placeholder="Town name"
          />
          {errors.customer?.address?.town && (
            <p className="text-sm mt-1" style={{ color: colors.primary.dark }}>
              {errors.customer.address.town.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            District *
          </label>
          <SearchableDistrictDropdown
            value={watch("customer.address.district") || ""}
            onChange={(value) => {
              setValue("customer.address.district", value);
              // Trigger validation for the field
              if (value) {
                // Clear any existing error
                setValue("customer.address.district", value, {
                  shouldValidate: true,
                });
              }
            }}
            error={errors.customer?.address?.district?.message}
            placeholder="Select district"
            required={true}
          />
          {/* Hidden input for form validation */}
          <input
            type="hidden"
            {...register("customer.address.district", {
              required: "District is required",
            })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Pincode *
          </label>
          <input
            type="text"
            {...register("customer.address.pincode", {
              required: "Pincode is required",
            })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:border-transparent dark:bg-gray-800 dark:text-white"
            style={{
              ...(errors.customer?.address?.pincode && {
                borderColor: colors.primary.dark,
              }),
            }}
            placeholder="Pincode"
          />
          {errors.customer?.address?.pincode && (
            <p className="text-sm mt-1" style={{ color: colors.primary.dark }}>
              {errors.customer.address.pincode.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nominee *
          </label>
          <div className="relative">
            <UserCheck className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              {...register("customer.nominee", {
                required: "Nominee is required",
              })}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:border-transparent dark:bg-gray-800 dark:text-white"
              style={{
                ...(errors.customer?.nominee && {
                  borderColor: colors.primary.dark,
                }),
              }}
              placeholder="Nominee name"
            />
          </div>
          {errors.customer?.nominee && (
            <p className="text-sm mt-1" style={{ color: colors.primary.dark }}>
              {errors.customer.nominee.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: colors.primary[100] }}
          >
            <Package
              className="h-6 w-6"
              style={{ color: colors.primary.dark }}
            />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Items Information
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Add items to be pledged
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              append({
                code: "",
                name: "",
                category: "",
                carat: "",
                weight: "",
                estimatedValue: "",
              })
            }
            className="flex items-center gap-2 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors"
            style={{ backgroundColor: colors.primary.dark }}
          >
            <Plus className="h-4 w-4" />
            Add Item
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Item {index + 1}
              </h3>
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="p-1 rounded hover:opacity-80"
                  style={{
                    color: colors.primary.dark,
                    backgroundColor: colors.primary[50],
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Master Item Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Master Item (Optional)
                </label>
                <select
                  onChange={(e) =>
                    handleMasterItemSelect(index, e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  style={{ focusRingColor: colors.primary.light }}
                  disabled={masterItemsLoading}
                >
                  <option value="">
                    {masterItemsLoading
                      ? "Loading items..."
                      : masterItemsError
                      ? "Error loading items"
                      : "Choose from saved items..."}
                  </option>
                  {!masterItemsLoading &&
                    !masterItemsError &&
                    masterItems.map((item: any) => (
                      <option key={item._id} value={item._id}>
                        {item.name} - {item.code}
                      </option>
                    ))}
                </select>
                {masterItemsError && (
                  <p className="text-sm mt-1 text-red-500">
                    Failed to load master items. You can still enter item
                    details manually.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Item Code *
                </label>
                <input
                  type="text"
                  {...register(`items.${index}.code`, {
                    required: "Item code is required",
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  style={{
                    ...(errors.items?.[index]?.code && {
                      borderColor: colors.primary.dark,
                    }),
                  }}
                  placeholder="Enter item code"
                />
                {errors.items?.[index]?.code && (
                  <p
                    className="text-sm mt-1"
                    style={{ color: colors.primary.dark }}
                  >
                    {errors.items[index]?.code?.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Item Name *
                </label>
                <input
                  type="text"
                  {...register(`items.${index}.name`, {
                    required: "Item name is required",
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  style={{
                    ...(errors.items?.[index]?.name && {
                      borderColor: colors.primary.dark,
                    }),
                  }}
                  placeholder="Enter item name"
                />
                {errors.items?.[index]?.name && (
                  <p
                    className="text-sm mt-1"
                    style={{ color: colors.primary.dark }}
                  >
                    {errors.items[index]?.name?.message}
                  </p>
                )}
              </div>

              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category *
                </label>
                <select
                  {...register(`items.${index}.category`, {
                    required: "Category is required",
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  style={{
                    ...(errors.items?.[index]?.category && {
                      borderColor: colors.primary.dark,
                    }),
                  }}
                >
                  <option value="">Select category...</option>
                  {selectedMasterItems[index] &&
                  selectedMasterItems[index].categories ? (
                    selectedMasterItems[index].categories.map(
                      (category: string) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      )
                    )
                  ) : (
                    <>
                      <option value="Ring">Ring</option>
                      <option value="Necklace">Necklace</option>
                      <option value="Bracelet">Bracelet</option>
                      <option value="Earrings">Earrings</option>
                      <option value="Chain">Chain</option>
                      <option value="Bangle">Bangle</option>
                      <option value="Pendant">Pendant</option>
                      <option value="Other">Other</option>
                    </>
                  )}
                </select>
                {errors.items?.[index]?.category && (
                  <p
                    className="text-sm mt-1"
                    style={{ color: colors.primary.dark }}
                  >
                    {errors.items[index]?.category?.message}
                  </p>
                )}
              </div>

              {/* Carat Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Carat *
                </label>
                <select
                  {...register(`items.${index}.carat`, {
                    required: "Carat is required",
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  style={{
                    ...(errors.items?.[index]?.carat && {
                      borderColor: colors.primary.dark,
                    }),
                  }}
                >
                  <option value="">Select carat...</option>
                  {selectedMasterItems[index] &&
                  selectedMasterItems[index].carats ? (
                    selectedMasterItems[index].carats.map((carat: string) => (
                      <option key={carat} value={carat}>
                        {carat}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="18K">18K</option>
                      <option value="22K">22K</option>
                      <option value="24K">24K</option>
                      <option value="14K">14K</option>
                      <option value="10K">10K</option>
                    </>
                  )}
                </select>
                {errors.items?.[index]?.carat && (
                  <p
                    className="text-sm mt-1"
                    style={{ color: colors.primary.dark }}
                  >
                    {errors.items[index]?.carat?.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Weight (grams) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register(`items.${index}.weight`, {
                    required: "Weight is required",
                    valueAsNumber: true,
                    min: {
                      value: 0.01,
                      message: "Weight must be greater than 0",
                    },
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  style={{
                    ...(errors.items?.[index]?.weight && {
                      borderColor: colors.primary.dark,
                    }),
                  }}
                  placeholder="0.00"
                />
                {errors.items?.[index]?.weight && (
                  <p
                    className="text-sm mt-1"
                    style={{ color: colors.primary.dark }}
                  >
                    {errors.items[index]?.weight?.message}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Estimated Value (₹) *
              </label>
              <input
                type="number"
                step="1"
                {...register(`items.${index}.estimatedValue`, {
                  required: "Estimated value is required",
                  valueAsNumber: true,
                  min: { value: 1, message: "Value must be greater than 0" },
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:border-transparent dark:bg-gray-800 dark:text-white"
                style={{
                  ...(errors.items?.[index]?.estimatedValue && {
                    borderColor: colors.primary.dark,
                  }),
                }}
                placeholder="Enter estimated value"
              />
              {errors.items?.[index]?.estimatedValue && (
                <p
                  className="text-sm mt-1"
                  style={{ color: colors.primary.dark }}
                >
                  {errors.items[index]?.estimatedValue?.message}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div
          className="p-2 rounded-lg"
          style={{ backgroundColor: colors.primary[100] }}
        >
          <CreditCard
            className="h-6 w-6"
            style={{ color: colors.primary.dark }}
          />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Loan & Payment Details
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Set loan terms and payment information
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Loan Amount (₹) *
          </label>
          <input
            type="number"
            step="1"
            {...register("loan.amount", {
              required: "Loan amount is required",
              valueAsNumber: true,
              min: { value: 1, message: "Amount must be greater than 0" },
            })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:border-transparent dark:bg-gray-800 dark:text-white"
            style={{
              ...(errors.loan?.amount && { borderColor: colors.primary.dark }),
            }}
            placeholder={
              totalEstimatedValue > 0
                ? `₹${totalEstimatedValue.toLocaleString()} (Total Estimated Value)`
                : "Enter loan amount"
            }
          />
          {errors.loan?.amount && (
            <p className="text-sm mt-1" style={{ color: colors.primary.dark }}>
              {errors.loan.amount.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Interest Rate (%) *
          </label>
          <input
            type="number"
            step="0.1"
            {...register("loan.interestPercent", {
              required: "Interest rate is required",
              valueAsNumber: true,
              min: {
                value: 0.1,
                message: "Interest rate must be greater than 0",
              },
            })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:border-transparent dark:bg-gray-800 dark:text-white"
            style={{
              ...(errors.loan?.interestPercent && {
                borderColor: colors.primary.dark,
              }),
            }}
            placeholder="2.5"
          />
          {errors.loan?.interestPercent && (
            <p className="text-sm mt-1" style={{ color: colors.primary.dark }}>
              {errors.loan.interestPercent.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Loan Validity (Months) *
          </label>
          <select
            {...register("loan.validity", {
              required: "Validity is required",
            })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:border-transparent dark:bg-gray-800 dark:text-white"
            style={{
              ...(errors.loan?.validity && {
                borderColor: colors.primary.dark,
              }),
            }}
          >
            <option value="">Select validity...</option>
            <option value="3">3 Months</option>
            <option value="6">6 Months</option>
            <option value="12">12 Months</option>
            <option value="18">18 Months</option>
            <option value="24">24 Months</option>
          </select>
          {errors.loan?.validity && (
            <p className="text-sm mt-1" style={{ color: colors.primary.dark }}>
              {errors.loan.validity.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Interest Type *
          </label>
          <select
            {...register("loan.interestType", {
              required: "Interest type is required",
            })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:border-transparent dark:bg-gray-800 dark:text-white"
            style={{
              ...(errors.loan?.interestType && {
                borderColor: colors.primary.dark,
              }),
            }}
          >
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
          {errors.loan?.interestType && (
            <p className="text-sm mt-1" style={{ color: colors.primary.dark }}>
              {errors.loan.interestType.message}
            </p>
          )}
        </div>
      </div>

      {/* Payment Section */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Payment Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Cash Payment (₹)
            </label>
            <input
              type="number"
              step="1"
              {...register("payment.cash", {
                valueAsNumber: true,
                min: { value: 0, message: "Cash payment cannot be negative" },
              })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:border-transparent dark:bg-gray-800 dark:text-white"
              style={{
                ...(errors.payment?.cash && {
                  borderColor: colors.primary.dark,
                }),
              }}
              placeholder="Enter cash amount"
            />
            {errors.payment?.cash && (
              <p
                className="text-sm mt-1"
                style={{ color: colors.primary.dark }}
              >
                {errors.payment.cash.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Online Payment (₹)
            </label>
            <input
              type="number"
              step="1"
              {...register("payment.online", {
                valueAsNumber: true,
                min: { value: 0, message: "Online payment cannot be negative" },
              })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:border-transparent dark:bg-gray-800 dark:text-white"
              style={{
                ...(errors.payment?.online && {
                  borderColor: colors.primary.dark,
                }),
              }}
              placeholder="Enter online amount"
            />
            {errors.payment?.online && (
              <p
                className="text-sm mt-1"
                style={{ color: colors.primary.dark }}
              >
                {errors.payment.online.message}
              </p>
            )}
          </div>
        </div>

        {/* Payment Summary */}
        <div
          className="mt-4 p-4 rounded-lg"
          style={{ backgroundColor: colors.primary[50] }}
        >
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Total Payment:
              </span>
              <span
                className="text-sm font-bold"
                style={{ color: colors.primary.dark }}
              >
                ₹{totalPayment.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Loan Amount:
              </span>
              <span
                className="text-sm font-bold"
                style={{ color: colors.primary.dark }}
              >
                ₹{Number(watchedLoanAmount || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Balance:
              </span>
              <span
                className="text-sm font-bold"
                style={{
                  color:
                    paymentBalance === 0
                      ? colors.status.success
                      : colors.primary.dark,
                }}
              >
                ₹{paymentBalance.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const steps = [
    { number: 1, title: "Customer Info", icon: User },
    { number: 2, title: "Items", icon: Package },
    { number: 3, title: "Loan & Payment", icon: CreditCard },
  ];

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-6">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Create New Billing
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          Fill in the details to create a new loan and billing record
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-6 sm:mb-8 overflow-x-auto">
        <div className="flex items-center min-w-max px-2 sm:px-4">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = currentStep === step.number;
            const isCompleted = currentStep > step.number;

            return (
              <div key={step.number} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 transition-colors ${
                    isActive || isCompleted
                      ? "border-transparent text-white"
                      : "border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400"
                  }`}
                  style={{
                    backgroundColor:
                      isActive || isCompleted
                        ? colors.primary.dark
                        : "transparent",
                  }}
                >
                  <StepIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="ml-2 sm:ml-3 mr-4 sm:mr-8">
                  <p
                    className={`text-xs sm:text-sm font-medium ${
                      isActive || isCompleted
                        ? "dark:text-white"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                    style={{
                      color:
                        isActive || isCompleted
                          ? colors.primary.dark
                          : undefined,
                    }}
                  >
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 ${
                      isCompleted ? "" : "bg-gray-300 dark:bg-gray-600"
                    }`}
                    style={{
                      backgroundColor: isCompleted
                        ? colors.primary.dark
                        : undefined,
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 sm:space-y-8"
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0">
          <button
            type="button"
            onClick={handlePrevStep}
            disabled={currentStep === 1}
            className="px-4 sm:px-6 py-2 text-sm sm:text-base text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed order-2 sm:order-1"
          >
            Previous
          </button>

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="px-4 sm:px-6 py-2 text-sm sm:text-base text-white rounded-lg hover:opacity-90 transition-colors order-1 sm:order-2"
              style={{ backgroundColor: colors.primary.dark }}
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 text-sm sm:text-base text-white rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
              style={{ backgroundColor: colors.primary.dark }}
            >
              <Save className="h-4 w-4" />
              {mutation.isPending ? "Creating..." : "Create Billing"}
            </button>
          )}
        </div>
      </form>

      {/* Success Modal */}
      {showSuccessModal && createdLoanData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              {/* Success Message with Close Button */}
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 relative">
                {/* Close Button */}
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    setCreatedLoanData(null);
                  }}
                  className="absolute top-3 right-3 p-1 hover:bg-green-100 dark:hover:bg-green-800 rounded-full transition-colors"
                  title="Close"
                >
                  <X className="h-5 w-5 text-green-600 dark:text-green-400" />
                </button>

                <div className="flex items-center gap-3 pr-8">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                  <div>
                    <h3 className="font-semibold text-green-800 dark:text-green-200">
                      Billing Created Successfully!
                    </h3>
                    <p className="text-sm text-green-600 dark:text-green-300">
                      Loan {createdLoanData.loanId} for{" "}
                      {createdLoanData.customerName} has been created. Download
                      your invoice below.
                    </p>
                  </div>
                </div>
              </div>

              {/* Invoice View Buttons */}
              <div className="mt-4 flex justify-center">
                <InvoiceViewButtons
                  loanObjectId={createdLoanData.loanObjectId}
                  loanId={createdLoanData.loanId}
                  customerName={createdLoanData.customerName}
                  billingAvailable={true}
                  repaymentAvailable={false}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
