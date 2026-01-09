"use client";
import React, { createContext, useContext, useState, useCallback } from "react";
import { Chrome, Settings, Monitor, CalendarDays, BarChart3, Search, Trash2 } from "lucide-react";

export const ALL_APPS = [
    { id: 1, name: "Browser", Icon: Chrome, color: "text-blue-500" },
    { id: 2, name: "Settings", Icon: Settings, color: "text-gray-600" },
    { id: 3, name: "Monitor", Icon: Monitor, color: "text-red-500" },
    { id: 4, name: "Calendar", Icon: CalendarDays, color: "text-red-400" },
    { id: 5, name: "Numbers", Icon: BarChart3, color: "text-green-500" },
    { id: 6, name: "Finder", Icon: Search, color: "text-purple-600" },
    { id: 7, name: "Trash", Icon: Trash2, color: "text-gray-700" },
];

const OSContext = createContext<any>(null);

export function OSProvider({ children }: { children: React.ReactNode }) {
    const [pinnedIds, setPinnedIds] = useState<number[]>([1, 2, 6]);
    const [openWindows, setOpenWindows] = useState<any[]>([]);
    const [maxZ, setMaxZ] = useState(1200);
    const [spawnCount, setSpawnCount] = useState(0);

    const togglePin = (appId: number) => {
        setPinnedIds(prev => prev.includes(appId) ? prev.filter(id => id !== appId) : [...prev, appId]);
    };

    const openApp = useCallback((appId: number, name: string) => {
        // 1. Calculate the new values first
        const newZ = maxZ + 1;
        const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const offset = (spawnCount % 8) * 30;

        // 2. Update state in a clean, flat manner
        setOpenWindows(current => [
            ...current, 
            { 
                id: uniqueId, 
                appId, 
                name, 
                zIndex: newZ,
                x: 100 + offset, 
                y: 100 + offset 
            }
        ]);

        setMaxZ(newZ);
        setSpawnCount(prev => prev + 1);
    }, [maxZ, spawnCount]); 

    const closeWindow = (id: string) => setOpenWindows(prev => prev.filter(w => w.id !== id));
    
    const focusWindow = (id: string) => {
        setMaxZ(prevMax => {
            const newZ = prevMax + 1;
            setOpenWindows(current => current.map(w => w.id === id ? { ...w, zIndex: newZ } : w));
            return newZ;
        });
    };

    return (
        <OSContext.Provider value={{ pinnedIds, openWindows, togglePin, openApp, closeWindow, focusWindow }}>
            {children}
        </OSContext.Provider>
    );
}

export const useOS = () => useContext(OSContext);