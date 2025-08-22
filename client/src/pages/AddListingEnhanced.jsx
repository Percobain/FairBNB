/**
 * @fileoverview Enhanced Add new listing page with FairBNB contract and Greenfield integration
 * This component maintains ALL existing functionality while adding Greenfield upload capabilities
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { NBCard } from "@/components/NBCard";
import { NBButton } from "@/components/NBButton";
import { web3Service } from "@/lib/services/web3Service";
import { enhancedWeb3Service } from "@/lib/services/enhancedWeb3Service";
import { useGreenfield } from "@/hooks/useGreenfield";
import {
    ChevronLeft,
    ChevronRight,
    Upload,
    X,
    Database,
    Cloud,
} from "lucide-react";

const listingSchema = z.object({
    title: z.string().min(1, "Title is required"),
    propertyType: z.enum(["Apartment", "Studio", "PG", "CoLiving", "House"]),
    address: z.string().min(1, "Address is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    country: z.string().min(1, "Country is required"),
    pincode: z.string().min(1, "Pincode is required"),
    description: z
        .string()
        .min(10, "Description must be at least 10 characters"),
    rentPerMonth: z.number().min(1, "Rent must be greater than 0"),
    securityDeposit: z
        .number()
        .min(1, "Security deposit must be greater than 0"),
    disputeFee: z.number().min(1, "Dispute fee must be greater than 0"),
    availableFrom: z.string().min(1, "Available from date is required"),
    minDurationMonths: z.number().min(1, "Minimum duration is required"),
    maxDurationMonths: z.number().min(1, "Maximum duration is required"),
});

/**
 * Enhanced multi-step form for adding new property listing with blockchain and Greenfield integration
 */
export function AddListingEnhanced() {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [selectedImage, setSelectedImage] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Greenfield integration states
    const [enableGreenfield, setEnableGreenfield] = useState(true); // Default enabled
    const [greenfieldProgress, setGreenfieldProgress] = useState({
        image: 0,
        metadata: 0,
    });
    const greenfield = useGreenfield();

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(listingSchema),
        defaultValues: {
            propertyType: "Apartment",
            country: "IN",
            minDurationMonths: 3,
            maxDurationMonths: 12,
            disputeFee: 1000,
        },
    });

    const steps = [
        { title: "Basics", description: "Property details and location" },
        { title: "Pricing", description: "Rent and deposit information" },
        { title: "Media", description: "Property image and storage options" },
        { title: "Availability", description: "Duration and availability" },
        { title: "Review", description: "Review and create listing" },
    ];

    const rentPerMonth = watch("rentPerMonth");

    // Auto-calculate security deposit (2x rent)
    const handleRentChange = (value) => {
        setValue("rentPerMonth", Number(value));
        setValue("securityDeposit", Number(value) * 2);
    };

    // Enhanced onSubmit that maintains existing functionality while adding Greenfield
    const onSubmit = async (data) => {
        if (!selectedImage) {
            toast.error("Please select a property image");
            return;
        }

        setIsSubmitting(true);
        setUploadProgress(0);
        setGreenfieldProgress({ image: 0, metadata: 0 });

        try {
            // Check if Web3 is connected (EXISTING FUNCTIONALITY PRESERVED)
            if (!web3Service.isWeb3Connected()) {
                const initResult = await web3Service.initialize();
                if (!initResult.success) {
                    throw new Error(initResult.error);
                }
            }

            setUploadProgress(10);

            // Create metadata object (EXISTING FUNCTIONALITY PRESERVED)
            const metadata = {
                name: data.title,
                description: data.description,
                propertyType: data.propertyType,
                address: data.address,
                city: data.city,
                state: data.state,
                country: data.country,
                pincode: data.pincode,
                rentPerMonth: data.rentPerMonth,
                securityDeposit: data.securityDeposit,
                disputeFee: data.disputeFee,
                availableFrom: data.availableFrom,
                minDurationMonths: data.minDurationMonths,
                maxDurationMonths: data.maxDurationMonths,
                createdAt: new Date().toISOString(),
            };

            setUploadProgress(20);

            let mintResult;

            // Choose between enhanced (with Greenfield) or original minting
            if (enableGreenfield) {
                // Try to get account and provider for Greenfield
                try {
                    const accounts =
                        (await window.ethereum?.request({
                            method: "eth_accounts",
                        })) || [];
                    const provider = window.ethereum;

                    if (accounts.length > 0 && provider) {
                        // Use enhanced service with Greenfield
                        mintResult =
                            await enhancedWeb3Service.mintPropertyWithGreenfield(
                                metadata,
                                selectedImage,
                                {
                                    address: accounts[0],
                                    provider: provider,
                                    onImageProgress: (progress) => {
                                        setGreenfieldProgress((prev) => ({
                                            ...prev,
                                            image: progress.percent,
                                        }));
                                    },
                                    onMetadataProgress: (progress) => {
                                        setGreenfieldProgress((prev) => ({
                                            ...prev,
                                            metadata: progress.percent,
                                        }));
                                    },
                                }
                            );
                    } else {
                        throw new Error(
                            "Wallet not properly connected for Greenfield"
                        );
                    }
                } catch (greenfieldError) {
                    console.warn(
                        "Greenfield upload failed, falling back to IPFS only:",
                        greenfieldError
                    );
                    // Fallback to original minting (PRESERVES EXISTING FUNCTIONALITY)
                    mintResult = await web3Service.mintProperty(
                        metadata,
                        selectedImage
                    );
                }
            } else {
                // Use original service (EXISTING FUNCTIONALITY PRESERVED)
                mintResult = await web3Service.mintProperty(
                    metadata,
                    selectedImage
                );
            }

            if (!mintResult.success) {
                throw new Error(mintResult.error);
            }

            setUploadProgress(80);

            // List the property for rent (EXISTING FUNCTIONALITY PRESERVED)
            const listResult = await web3Service.listProperty(
                mintResult.tokenId,
                data.rentPerMonth,
                data.securityDeposit,
                data.disputeFee
            );

            if (!listResult.success) {
                throw new Error(listResult.error);
            }

            setUploadProgress(100);

            // Enhanced success message
            const successMessage =
                enableGreenfield && mintResult.greenfield?.enabled
                    ? `Property NFT minted with ID: ${mintResult.tokenId}. Also uploaded to Greenfield!`
                    : `Property NFT minted with ID: ${mintResult.tokenId}`;

            toast.success("Listing created successfully!", {
                description: successMessage,
            });

            navigate("/landlord");
        } catch (error) {
            console.error("Failed to create listing:", error);
            toast.error("Failed to create listing", {
                description: error.message,
            });
        } finally {
            setIsSubmitting(false);
            setUploadProgress(0);
            setGreenfieldProgress({ image: 0, metadata: 0 });
        }
    };

    const nextStep = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleImageSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            // Validate file type (EXISTING FUNCTIONALITY PRESERVED)
            if (!file.type.startsWith("image/")) {
                toast.error("Please select a valid image file");
                return;
            }

            // Validate file size (max 10MB) (EXISTING FUNCTIONALITY PRESERVED)
            if (file.size > 10 * 1024 * 1024) {
                toast.error("Image size should be less than 10MB");
                return;
            }

            setSelectedImage(file);
            toast.success("Image selected successfully");
        }
    };

    const removeSelectedImage = () => {
        setSelectedImage(null);
        // Reset the file input (EXISTING FUNCTIONALITY PRESERVED)
        const fileInput = document.getElementById("image-upload");
        if (fileInput) {
            fileInput.value = "";
        }
    };

    return (
        <div className="min-h-screen bg-nb-bg py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header (EXISTING UI PRESERVED) */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate("/landlord")}
                        className="flex items-center text-nb-ink/70 hover:text-nb-ink mb-4"
                    >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Back to Dashboard
                    </button>
                    <h1 className="font-display font-bold text-3xl text-nb-ink mb-2">
                        Add New Listing
                    </h1>
                    <p className="font-body text-nb-ink/70">
                        Create a new property listing on the blockchain with
                        optional Greenfield storage
                    </p>
                </div>

                {/* Progress Steps (EXISTING UI PRESERVED) */}
                <NBCard className="mb-8">
                    <div className="flex items-center justify-between">
                        {steps.map((step, index) => (
                            <div key={index} className="flex items-center">
                                <div
                                    className={`w-8 h-8 rounded-full border-2 border-nb-ink flex items-center justify-center ${
                                        index <= currentStep
                                            ? "bg-nb-accent"
                                            : "bg-nb-bg"
                                    }`}
                                >
                                    <span className="text-sm font-bold text-nb-ink">
                                        {index + 1}
                                    </span>
                                </div>
                                <div className="ml-3 hidden sm:block">
                                    <div className="font-medium text-nb-ink">
                                        {step.title}
                                    </div>
                                    <div className="text-xs text-nb-ink/70">
                                        {step.description}
                                    </div>
                                </div>
                                {index < steps.length - 1 && (
                                    <div className="w-8 h-0.5 bg-nb-ink/20 mx-4 hidden sm:block"></div>
                                )}
                            </div>
                        ))}
                    </div>
                </NBCard>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)}>
                    <NBCard className="mb-8">
                        {/* Step 0: Property Basics (EXISTING STEP PRESERVED) */}
                        {currentStep === 0 && (
                            <div className="space-y-6">
                                <h2 className="font-display font-bold text-xl text-nb-ink mb-4">
                                    Property Basics
                                </h2>

                                <div>
                                    <label className="block text-sm font-medium text-nb-ink mb-2">
                                        Property Title *
                                    </label>
                                    <input
                                        {...register("title")}
                                        className="w-full px-3 py-2 border-2 border-nb-ink rounded-nb bg-nb-bg text-nb-ink focus:outline-none focus:ring-4 focus:ring-nb-accent"
                                        placeholder="e.g., Cozy Studio near Metro Station"
                                    />
                                    {errors.title && (
                                        <p className="text-nb-error text-sm mt-1">
                                            {errors.title.message}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-nb-ink mb-2">
                                        Property Type *
                                    </label>
                                    <select
                                        {...register("propertyType")}
                                        className="w-full px-3 py-2 border-2 border-nb-ink rounded-nb bg-nb-bg text-nb-ink focus:outline-none focus:ring-4 focus:ring-nb-accent"
                                    >
                                        <option value="Apartment">
                                            Apartment
                                        </option>
                                        <option value="Studio">Studio</option>
                                        <option value="PG">PG</option>
                                        <option value="CoLiving">
                                            Co-Living
                                        </option>
                                        <option value="House">House</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-nb-ink mb-2">
                                            Address *
                                        </label>
                                        <input
                                            {...register("address")}
                                            className="w-full px-3 py-2 border-2 border-nb-ink rounded-nb bg-nb-bg text-nb-ink focus:outline-none focus:ring-4 focus:ring-nb-accent"
                                            placeholder="Street address"
                                        />
                                        {errors.address && (
                                            <p className="text-nb-error text-sm mt-1">
                                                {errors.address.message}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-nb-ink mb-2">
                                            City *
                                        </label>
                                        <input
                                            {...register("city")}
                                            className="w-full px-3 py-2 border-2 border-nb-ink rounded-nb bg-nb-bg text-nb-ink focus:outline-none focus:ring-4 focus:ring-nb-accent"
                                            placeholder="City name"
                                        />
                                        {errors.city && (
                                            <p className="text-nb-error text-sm mt-1">
                                                {errors.city.message}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-nb-ink mb-2">
                                            State *
                                        </label>
                                        <input
                                            {...register("state")}
                                            className="w-full px-3 py-2 border-2 border-nb-ink rounded-nb bg-nb-bg text-nb-ink focus:outline-none focus:ring-4 focus:ring-nb-accent"
                                            placeholder="State"
                                        />
                                        {errors.state && (
                                            <p className="text-nb-error text-sm mt-1">
                                                {errors.state.message}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-nb-ink mb-2">
                                            Country *
                                        </label>
                                        <select
                                            {...register("country")}
                                            className="w-full px-3 py-2 border-2 border-nb-ink rounded-nb bg-nb-bg text-nb-ink focus:outline-none focus:ring-4 focus:ring-nb-accent"
                                        >
                                            <option value="IN">India</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-nb-ink mb-2">
                                            Pincode *
                                        </label>
                                        <input
                                            {...register("pincode")}
                                            className="w-full px-3 py-2 border-2 border-nb-ink rounded-nb bg-nb-bg text-nb-ink focus:outline-none focus:ring-4 focus:ring-nb-accent"
                                            placeholder="400001"
                                        />
                                        {errors.pincode && (
                                            <p className="text-nb-error text-sm mt-1">
                                                {errors.pincode.message}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-nb-ink mb-2">
                                        Description *
                                    </label>
                                    <textarea
                                        {...register("description")}
                                        rows={4}
                                        className="w-full px-3 py-2 border-2 border-nb-ink rounded-nb bg-nb-bg text-nb-ink focus:outline-none focus:ring-4 focus:ring-nb-accent"
                                        placeholder="Describe your property, its features, and what makes it special..."
                                    />
                                    {errors.description && (
                                        <p className="text-nb-error text-sm mt-1">
                                            {errors.description.message}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Step 1: Pricing (EXISTING STEP PRESERVED) */}
                        {currentStep === 1 && (
                            <div className="space-y-6">
                                <h2 className="font-display font-bold text-xl text-nb-ink mb-4">
                                    Pricing Information
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-nb-ink mb-2">
                                            Monthly Rent (₹) *
                                        </label>
                                        <input
                                            type="number"
                                            {...register("rentPerMonth", {
                                                valueAsNumber: true,
                                            })}
                                            onChange={(e) =>
                                                handleRentChange(e.target.value)
                                            }
                                            className="w-full px-3 py-2 border-2 border-nb-ink rounded-nb bg-nb-bg text-nb-ink focus:outline-none focus:ring-4 focus:ring-nb-accent"
                                            placeholder="25000"
                                        />
                                        {errors.rentPerMonth && (
                                            <p className="text-nb-error text-sm mt-1">
                                                {errors.rentPerMonth.message}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-nb-ink mb-2">
                                            Security Deposit (₹) *
                                        </label>
                                        <input
                                            type="number"
                                            {...register("securityDeposit", {
                                                valueAsNumber: true,
                                            })}
                                            className="w-full px-3 py-2 border-2 border-nb-ink rounded-nb bg-nb-bg text-nb-ink focus:outline-none focus:ring-4 focus:ring-nb-accent"
                                            placeholder="50000"
                                        />
                                        <p className="text-xs text-nb-ink/60 mt-1">
                                            Auto-calculated as 2x monthly rent
                                        </p>
                                        {errors.securityDeposit && (
                                            <p className="text-nb-error text-sm mt-1">
                                                {errors.securityDeposit.message}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-nb-ink mb-2">
                                        Dispute Fee (₹) *
                                    </label>
                                    <input
                                        type="number"
                                        {...register("disputeFee", {
                                            valueAsNumber: true,
                                        })}
                                        className="w-full px-3 py-2 border-2 border-nb-ink rounded-nb bg-nb-bg text-nb-ink focus:outline-none focus:ring-4 focus:ring-nb-accent"
                                        placeholder="1000"
                                    />
                                    <p className="text-xs text-nb-ink/60 mt-1">
                                        Fee for dispute resolution (recommended:
                                        ₹1000)
                                    </p>
                                    {errors.disputeFee && (
                                        <p className="text-nb-error text-sm mt-1">
                                            {errors.disputeFee.message}
                                        </p>
                                    )}
                                </div>

                                <div className="bg-nb-accent/20 border-2 border-nb-accent rounded-nb p-4">
                                    <h3 className="font-medium text-nb-ink mb-2">
                                        Blockchain Information
                                    </h3>
                                    <p className="text-sm text-nb-ink/70">
                                        Your property will be minted as an NFT
                                        on BSC Testnet. All payments will be
                                        handled in BNB through smart contract
                                        escrow.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Media & Storage (ENHANCED STEP) */}
                        {currentStep === 2 && (
                            <div className="space-y-6">
                                <h2 className="font-display font-bold text-xl text-nb-ink mb-4">
                                    Property Image & Storage
                                </h2>

                                {/* Storage Options - NEW ADDITION */}
                                <div className="bg-nb-accent/10 border-2 border-nb-accent/30 rounded-nb p-4">
                                    <h3 className="font-medium text-nb-ink mb-3">
                                        Storage Options
                                    </h3>
                                    <div className="space-y-3">
                                        <label className="flex items-center space-x-3">
                                            <input
                                                type="checkbox"
                                                checked={enableGreenfield}
                                                onChange={(e) =>
                                                    setEnableGreenfield(
                                                        e.target.checked
                                                    )
                                                }
                                                className="w-4 h-4 text-nb-accent border-2 border-nb-ink rounded focus:ring-2 focus:ring-nb-accent"
                                            />
                                            <div className="flex items-center space-x-2">
                                                <Cloud className="w-4 h-4 text-nb-ink" />
                                                <span className="text-sm font-medium text-nb-ink">
                                                    Enable BNB Greenfield
                                                    Storage
                                                </span>
                                            </div>
                                        </label>
                                        <p className="text-xs text-nb-ink/70 ml-7">
                                            Store your images on BNB Greenfield
                                            in addition to IPFS for enhanced
                                            decentralization and redundancy.
                                        </p>

                                        <div className="flex items-center space-x-2 ml-7">
                                            <Database className="w-4 h-4 text-nb-ink/60" />
                                            <span className="text-xs text-nb-ink/60">
                                                IPFS storage is always enabled
                                                (default FairBNB functionality)
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Image Upload Section (EXISTING UI PRESERVED) */}
                                {!selectedImage ? (
                                    <div className="border-2 border-dashed border-nb-ink rounded-nb p-8 text-center">
                                        <Upload className="w-12 h-12 text-nb-ink/40 mx-auto mb-4" />
                                        <h3 className="font-medium text-nb-ink mb-2">
                                            Upload Property Image
                                        </h3>
                                        <p className="text-sm text-nb-ink/70 mb-4">
                                            Select a high-quality image of your
                                            property
                                            {enableGreenfield
                                                ? " (will be stored on IPFS and Greenfield)"
                                                : " (will be stored on IPFS)"}
                                        </p>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageSelect}
                                            className="hidden"
                                            id="image-upload"
                                        />
                                        <label
                                            htmlFor="image-upload"
                                            className="cursor-pointer"
                                        >
                                            <div className="inline-flex items-center px-4 py-2 bg-nb-accent text-nb-ink font-medium rounded-nb border-2 border-nb-ink hover:bg-nb-accent/80 transition-colors">
                                                <Upload className="w-4 h-4 mr-2" />
                                                Select Image
                                            </div>
                                        </label>
                                        <p className="text-xs text-nb-ink/60 mt-2">
                                            Supported formats: JPG, PNG, GIF
                                            (Max 10MB)
                                        </p>
                                    </div>
                                ) : (
                                    <div>
                                        <h3 className="font-medium text-nb-ink mb-4">
                                            Selected Image
                                        </h3>
                                        <div className="relative">
                                            <img
                                                src={URL.createObjectURL(
                                                    selectedImage
                                                )}
                                                alt="Property preview"
                                                className="w-full h-64 object-cover rounded border-2 border-nb-ink"
                                            />
                                            <div className="absolute top-2 left-2 bg-nb-accent text-nb-ink text-xs px-2 py-1 rounded border border-nb-ink">
                                                {selectedImage.name}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={removeSelectedImage}
                                                className="absolute top-2 right-2 bg-nb-error text-nb-ink p-1 rounded-full hover:bg-nb-error/80 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="mt-2 text-sm text-nb-ink/70">
                                            File size:{" "}
                                            {(
                                                selectedImage.size /
                                                1024 /
                                                1024
                                            ).toFixed(2)}{" "}
                                            MB
                                        </div>
                                        <div className="mt-2 text-xs text-nb-ink/60">
                                            {enableGreenfield
                                                ? "✓ Will be stored on both IPFS and BNB Greenfield"
                                                : "✓ Will be stored on IPFS"}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 3: Availability (EXISTING STEP PRESERVED) */}
                        {currentStep === 3 && (
                            <div className="space-y-6">
                                <h2 className="font-display font-bold text-xl text-nb-ink mb-4">
                                    Availability & Duration
                                </h2>

                                <div>
                                    <label className="block text-sm font-medium text-nb-ink mb-2">
                                        Available From *
                                    </label>
                                    <input
                                        type="date"
                                        {...register("availableFrom")}
                                        className="w-full px-3 py-2 border-2 border-nb-ink rounded-nb bg-nb-bg text-nb-ink focus:outline-none focus:ring-4 focus:ring-nb-accent"
                                    />
                                    {errors.availableFrom && (
                                        <p className="text-nb-error text-sm mt-1">
                                            {errors.availableFrom.message}
                                        </p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-nb-ink mb-2">
                                            Minimum Duration (months) *
                                        </label>
                                        <input
                                            type="number"
                                            {...register("minDurationMonths", {
                                                valueAsNumber: true,
                                            })}
                                            className="w-full px-3 py-2 border-2 border-nb-ink rounded-nb bg-nb-bg text-nb-ink focus:outline-none focus:ring-4 focus:ring-nb-accent"
                                            placeholder="3"
                                            min="1"
                                        />
                                        {errors.minDurationMonths && (
                                            <p className="text-nb-error text-sm mt-1">
                                                {
                                                    errors.minDurationMonths
                                                        .message
                                                }
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-nb-ink mb-2">
                                            Maximum Duration (months) *
                                        </label>
                                        <input
                                            type="number"
                                            {...register("maxDurationMonths", {
                                                valueAsNumber: true,
                                            })}
                                            className="w-full px-3 py-2 border-2 border-nb-ink rounded-nb bg-nb-bg text-nb-ink focus:outline-none focus:ring-4 focus:ring-nb-accent"
                                            placeholder="12"
                                            min="1"
                                        />
                                        {errors.maxDurationMonths && (
                                            <p className="text-nb-error text-sm mt-1">
                                                {
                                                    errors.maxDurationMonths
                                                        .message
                                                }
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Review (ENHANCED STEP) */}
                        {currentStep === 4 && (
                            <div className="space-y-6">
                                <h2 className="font-display font-bold text-xl text-nb-ink mb-4">
                                    Review & Create Listing
                                </h2>

                                <div className="bg-nb-warn/20 border-2 border-nb-warn rounded-nb p-4">
                                    <h3 className="font-medium text-nb-ink mb-2">
                                        Ready to mint NFT?
                                    </h3>
                                    <p className="text-sm text-nb-ink/70">
                                        Your property will be minted as an NFT
                                        on the blockchain and listed for rent.
                                        {enableGreenfield &&
                                            " Images will be stored on both IPFS and Greenfield."}{" "}
                                        This action cannot be undone.
                                    </p>
                                </div>

                                {/* Review Summary (EXISTING CONTENT PRESERVED) */}
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="font-medium text-nb-ink">
                                            Property Details
                                        </h3>
                                        <p className="text-sm text-nb-ink/70">
                                            {watch("title")} •{" "}
                                            {watch("propertyType")} •{" "}
                                            {watch("city")}
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="font-medium text-nb-ink">
                                            Pricing
                                        </h3>
                                        <p className="text-sm text-nb-ink/70">
                                            ₹
                                            {watch(
                                                "rentPerMonth"
                                            )?.toLocaleString()}
                                            /month • ₹
                                            {watch(
                                                "securityDeposit"
                                            )?.toLocaleString()}{" "}
                                            deposit
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="font-medium text-nb-ink">
                                            Duration
                                        </h3>
                                        <p className="text-sm text-nb-ink/70">
                                            {watch("minDurationMonths")}-
                                            {watch("maxDurationMonths")} months
                                        </p>
                                    </div>

                                    {selectedImage && (
                                        <div>
                                            <h3 className="font-medium text-nb-ink">
                                                Image & Storage
                                            </h3>
                                            <p className="text-sm text-nb-ink/70">
                                                {selectedImage.name} (
                                                {(
                                                    selectedImage.size /
                                                    1024 /
                                                    1024
                                                ).toFixed(2)}{" "}
                                                MB)
                                            </p>
                                            <div className="flex items-center space-x-4 mt-1">
                                                <span className="flex items-center space-x-1 text-xs text-green-600">
                                                    <Database className="w-3 h-3" />
                                                    <span>IPFS</span>
                                                </span>
                                                {enableGreenfield && (
                                                    <span className="flex items-center space-x-1 text-xs text-blue-600">
                                                        <Cloud className="w-3 h-3" />
                                                        <span>Greenfield</span>
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Enhanced Upload Progress */}
                                {isSubmitting && (
                                    <div className="space-y-4">
                                        {/* Main Progress */}
                                        <div className="bg-nb-accent/20 border-2 border-nb-accent rounded-nb p-4">
                                            <h3 className="font-medium text-nb-ink mb-2">
                                                Creating Listing...
                                            </h3>
                                            <div className="w-full bg-nb-bg rounded-full h-2 border border-nb-ink">
                                                <div
                                                    className="bg-nb-accent h-2 rounded-full transition-all duration-300"
                                                    style={{
                                                        width: `${uploadProgress}%`,
                                                    }}
                                                ></div>
                                            </div>
                                            <p className="text-sm text-nb-ink/70 mt-2">
                                                {uploadProgress < 20 &&
                                                    "Initializing..."}
                                                {uploadProgress >= 20 &&
                                                    uploadProgress < 80 &&
                                                    "Uploading files and minting NFT..."}
                                                {uploadProgress >= 80 &&
                                                    uploadProgress < 100 &&
                                                    "Listing property..."}
                                                {uploadProgress === 100 &&
                                                    "Complete!"}
                                            </p>
                                        </div>

                                        {/* Greenfield Progress */}
                                        {enableGreenfield &&
                                            (greenfieldProgress.image > 0 ||
                                                greenfieldProgress.metadata >
                                                    0) && (
                                                <div className="bg-blue-50 border-2 border-blue-200 rounded-nb p-4">
                                                    <h3 className="font-medium text-blue-800 mb-2 flex items-center">
                                                        <Cloud className="w-4 h-4 mr-2" />
                                                        Greenfield Upload
                                                        Progress
                                                    </h3>
                                                    <div className="space-y-2">
                                                        <div>
                                                            <div className="flex justify-between text-xs text-blue-700">
                                                                <span>
                                                                    Image
                                                                </span>
                                                                <span>
                                                                    {
                                                                        greenfieldProgress.image
                                                                    }
                                                                    %
                                                                </span>
                                                            </div>
                                                            <div className="w-full bg-blue-100 rounded-full h-1">
                                                                <div
                                                                    className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                                                                    style={{
                                                                        width: `${greenfieldProgress.image}%`,
                                                                    }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="flex justify-between text-xs text-blue-700">
                                                                <span>
                                                                    Metadata
                                                                </span>
                                                                <span>
                                                                    {
                                                                        greenfieldProgress.metadata
                                                                    }
                                                                    %
                                                                </span>
                                                            </div>
                                                            <div className="w-full bg-blue-100 rounded-full h-1">
                                                                <div
                                                                    className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                                                                    style={{
                                                                        width: `${greenfieldProgress.metadata}%`,
                                                                    }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                    </div>
                                )}
                            </div>
                        )}
                    </NBCard>

                    {/* Navigation (EXISTING UI PRESERVED) */}
                    <div className="flex justify-between">
                        <NBButton
                            type="button"
                            variant="ghost"
                            onClick={prevStep}
                            disabled={currentStep === 0}
                            icon={<ChevronLeft className="w-4 h-4" />}
                        >
                            Previous
                        </NBButton>

                        {currentStep < steps.length - 1 ? (
                            <NBButton
                                type="button"
                                onClick={nextStep}
                                icon={<ChevronRight className="w-4 h-4" />}
                            >
                                Next
                            </NBButton>
                        ) : (
                            <NBButton
                                type="submit"
                                disabled={isSubmitting || !selectedImage}
                                data-testid="create-listing"
                            >
                                {isSubmitting
                                    ? "Creating..."
                                    : "Create Listing"}
                            </NBButton>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
