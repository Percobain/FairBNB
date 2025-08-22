import { useState, useCallback } from "react";
import { enhancedGreenfieldService } from "../lib/services/enhancedGreenfieldService.js";

export const useGreenfield = () => {
    const [state, setState] = useState({
        loading: false,
        error: null,
        progress: null,
        uploadProgress: null,
    });

    const resetState = useCallback(() => {
        setState({
            loading: false,
            error: null,
            progress: null,
            uploadProgress: null,
        });
    }, []);

    const uploadFile = useCallback(
        async (address, provider, file, objectName) => {
            if (!address || !provider) {
                setState((prev) => ({
                    ...prev,
                    error: "Wallet not connected",
                }));
                return { success: false, error: "Wallet not connected" };
            }

            resetState();
            setState((prev) => ({ ...prev, loading: true }));

            try {
                const result =
                    await enhancedGreenfieldService.uploadToGreenfield(
                        address,
                        provider,
                        file,
                        objectName,
                        (progress) =>
                            setState((prev) => ({
                                ...prev,
                                uploadProgress: progress,
                            }))
                    );

                setState((prev) => ({
                    ...prev,
                    loading: false,
                    error: result.error || null,
                    uploadProgress: null,
                }));

                return result;
            } catch (error) {
                const errorMessage =
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred";
                setState((prev) => ({
                    ...prev,
                    loading: false,
                    error: errorMessage,
                    uploadProgress: null,
                }));
                return { success: false, error: errorMessage };
            }
        },
        [resetState]
    );

    const downloadFile = useCallback(
        async (address, provider, objectName) => {
            if (!address || !provider) {
                setState((prev) => ({
                    ...prev,
                    error: "Wallet not connected",
                }));
                return { success: false, error: "Wallet not connected" };
            }

            resetState();
            setState((prev) => ({ ...prev, loading: true }));

            try {
                const result =
                    await enhancedGreenfieldService.downloadFromGreenfield(
                        address,
                        provider,
                        objectName
                    );

                setState((prev) => ({
                    ...prev,
                    loading: false,
                    error: result.error || null,
                }));

                return result;
            } catch (error) {
                const errorMessage =
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred";
                setState((prev) => ({
                    ...prev,
                    loading: false,
                    error: errorMessage,
                }));
                return { success: false, error: errorMessage };
            }
        },
        [resetState]
    );

    const listObjects = useCallback(
        async (address) => {
            if (!address) {
                setState((prev) => ({
                    ...prev,
                    error: "Wallet not connected",
                }));
                return { success: false, error: "Wallet not connected" };
            }

            resetState();
            setState((prev) => ({ ...prev, loading: true }));

            try {
                const result = await enhancedGreenfieldService.listObjects(
                    address
                );

                setState((prev) => ({
                    ...prev,
                    loading: false,
                    error: result.error || null,
                }));

                return result;
            } catch (error) {
                const errorMessage =
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred";
                setState((prev) => ({
                    ...prev,
                    loading: false,
                    error: errorMessage,
                }));
                return { success: false, error: errorMessage };
            }
        },
        [resetState]
    );

    return {
        // State
        ...state,

        // Actions
        uploadFile,
        downloadFile,
        listObjects,
        resetState,

        // Utilities
        isConnected: true, // We'll check this in the component
    };
};
