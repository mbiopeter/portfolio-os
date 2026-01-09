"use client";
import { useState, useCallback } from "react";

export type OpenWindow = {
    id: number;
    appId: number;
    appName: string;
    zIndex: number;
};

const BASE_WINDOW_Z_INDEX = 1200;
let nextAppInstanceId = 1;

export function useWindowManager() {
    const [openWindows, setOpenWindows] = useState<OpenWindow[]>([]);
    const [maxZIndex, setMaxZIndex] = useState(BASE_WINDOW_Z_INDEX);

    const handleCloseWindow = useCallback((id: number) => {
        setOpenWindows((prev) => prev.filter((w) => w.id !== id));
    }, []);

    const handleFocusWindow = useCallback((id: number) => {
        const newZIndex = maxZIndex + 1;
        setOpenWindows((prev) =>
            prev.map((w) => (w.id === id ? { ...w, zIndex: newZIndex } : w))
        );
        setMaxZIndex(newZIndex);
    }, [maxZIndex]);

    const handleOpenApp = useCallback((appId: number, name: string) => {
        const newId = nextAppInstanceId++;
        const newZIndex = maxZIndex + 1;

        setOpenWindows((prev) => [
            ...prev,
            { id: newId, appId: appId, appName: name, zIndex: newZIndex },
        ]);
        setMaxZIndex(newZIndex);
    }, [maxZIndex]);

    return {
        openWindows,
        handleOpenApp,
        handleCloseWindow,
        handleFocusWindow,
    };
}