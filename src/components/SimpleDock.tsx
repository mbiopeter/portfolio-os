"use client";
import { useState } from "react";
import { LayoutGrid, Clock, Trash2, PinOff } from "lucide-react";
import { ALL_APPS, useOS } from "@/app/context/OSContext";
export default function SimpleDock() {
    const { pinnedIds, openWindows, openApp, togglePin } = useOS();
    const [menu, setMenu] = useState<{ x: number, y: number, id: number } | null>(null);

    // Derived state: Get the app objects for everything currently pinned
    const appsToShow = ALL_APPS.filter(app => pinnedIds.includes(app.id));

    return (
        <>
            <div className="fixed bottom-3 left-1/2 -translate-x-1/2 h-14 bg-white/30 backdrop-blur-2xl border border-white/40 rounded-2xl flex items-center px-2 shadow-2xl z-999999">
                <div className="flex items-center gap-2 p-1">
                    {appsToShow.map(app => {
                        const isRunning = openWindows.some((w: any) => w.appId === app.id);
                        
                        return (
                            <button
                                key={app.id}
                                onClick={() => openApp(app.id, app.name)}
                                onContextMenu={(e) => {
                                    e.preventDefault();
                                    setMenu({ x: e.clientX, y: e.clientY, id: app.id });
                                }}
                                className="relative w-10 h-10 flex items-center justify-center transition-all hover:scale-110 active:scale-95 group"
                            >
                                <app.Icon size={28} className={`${app.color} drop-shadow-sm`} />
                                
                                {/* Running Indicator (Blue Dot) */}
                                {isRunning && (
                                    <div className="absolute -bottom-1 w-1 h-1 bg-blue-500 rounded-full shadow-[0_0_5px_rgba(59,130,246,0.5)]" />
                                )}

                                {/* Hover Tooltip */}
                                <div className="absolute -top-10 scale-0 group-hover:scale-100 transition-transform bg-black/80 text-white text-[10px] px-2 py-1 rounded pointer-events-none">
                                    {app.name}
                                </div>
                            </button>
                        );
                    })}

                    {/* Separator and Utilities */}
                    {appsToShow.length > 0 && <div className="w-px h-8 bg-black/10 mx-1" />}
                    
                    <button className="p-2 hover:bg-white/20 rounded-xl transition-colors text-blue-500">
                        <LayoutGrid size={24} />
                    </button>
                    <button className="p-2 hover:bg-white/20 rounded-xl transition-colors text-gray-700">
                        <Clock size={24} />
                    </button>
                </div>
            </div>

            {/* Dock Context Menu */}
            {menu && (
                <div 
                    className="fixed w-44 bg-white/95 backdrop-blur-md shadow-2xl rounded-xl py-1 text-sm border border-gray-200 z-1000000 animate-in fade-in zoom-in-95 duration-100" 
                    style={{ 
                        top: menu.y, 
                        left: menu.x, 
                        transform: 'translate(-50%, -110%)' 
                    }}
                >
                    <button 
                        onClick={() => { togglePin(menu.id); setMenu(null); }} 
                        className="flex items-center w-full px-3 py-2 text-red-600 hover:bg-red-50 transition-colors"
                    >
                        <PinOff size={14} className="mr-2" /> Unpin from Dock
                    </button>
                </div>
            )}

            {/* Overlay to close menu on outside click */}
            {menu && (
                <div 
                    className="fixed inset-0 z-999998" 
                    onClick={() => setMenu(null)} 
                    onContextMenu={(e) => { e.preventDefault(); setMenu(null); }}
                />
            )}
        </>
    );
}