"use client";

import { useState, useRef } from "react";
import {
    Chrome,
    Settings,
    Search,
    Monitor,
    Clock,
    LayoutGrid,
    MoreVertical,
    PlusCircle,
    Pin,
    CalendarDays,
    BarChart3,
    Trash2,
} from "lucide-react";
import { usePathname } from "next/navigation";

/* ---------- Z-INDICES ---------- */
const Z_INDICES = {
    DOCK: 1000004,
    CONTEXT_MENU: 1000005,
};

/* ---------- TYPES ---------- */
export type AppIcon = {
    name: string;
    iconComponent: React.ElementType;
    onClick: () => void;
    color?: string;
    isActive?: boolean;
};

/* ---------- DEFAULT DATA ---------- */
const defaultApps: AppIcon[] = [
    { name: "Finder", iconComponent: Search, onClick: () => console.log("Finder"), color: "text-purple-600" },
    { name: "Numbers", iconComponent: BarChart3, onClick: () => console.log("Numbers"), color: "text-green-500", isActive: true },
    { name: "Calendar", iconComponent: CalendarDays, onClick: () => console.log("Calendar"), color: "text-red-500", isActive: true },
    { name: "Browser", iconComponent: Chrome, onClick: () => console.log("Browser"), color: "text-yellow-600", isActive: true },
    { name: "Settings", iconComponent: Settings, onClick: () => console.log("Settings"), color: "text-gray-600" }
];

const defaultRunningApps: AppIcon[] = [
    { name: "Monitor", iconComponent: Monitor, onClick: () => console.log("Monitor") },
    { name: "Trash", iconComponent: Trash2, onClick: () => console.log("Trash"), color: "text-gray-700" },
];

/* ---------- MAIN COMPONENT ---------- */
export default function SimpleDock() {
    const [dockApps, setDockApps] = useState<AppIcon[]>(defaultApps);
    const [activePopup, setActivePopup] = useState<string | null>(null);
    const [draggedItem, setDraggedItem] = useState<AppIcon | null>(null);
    const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; appName: string | null } | null>(null);
    
    const pathname = usePathname();
    const hideDock = ["/", "/profiles", "/owner"].includes(pathname);

    if (hideDock) return null;

    // Drag and Drop Handlers
    const onDragStart = (app: AppIcon) => setDraggedItem(app);
    const onDrop = (index: number) => {
        if (!draggedItem) return;
        const newApps = [...dockApps];
        const oldIdx = newApps.findIndex(a => a.name === draggedItem.name);
        newApps.splice(oldIdx, 1);
        newApps.splice(index, 0, draggedItem);
        setDockApps(newApps);
        setDraggedItem(null);
    };

    const handleContextMenu = (e: React.MouseEvent, app: AppIcon) => {
        e.preventDefault();
        setContextMenu({ visible: true, x: e.clientX, y: e.clientY, appName: app.name });
    };

    return (
        <>
            {/* Dock Container */}
            <div
                className="fixed bottom-3 left-1/2 -translate-x-1/2 h-14 bg-white/40 backdrop-blur-3xl border border-white/50 rounded-2xl flex items-center px-2 shadow-2xl"
                style={{ zIndex: Z_INDICES.DOCK }}
            >
                <div className="flex items-center h-full gap-2 p-1">
                    {dockApps.map((app, index) => (
                        <button
                            key={app.name}
                            onClick={app.onClick}
                            onContextMenu={(e) => handleContextMenu(e, app)}
                            draggable
                            onDragStart={() => onDragStart(app)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => onDrop(index)}
                            className={`relative flex items-center justify-center w-10 h-10 transition-transform active:scale-90
                                ${app.isActive ? 'after:content-[""] after:absolute after:-bottom-1 after:w-1 after:h-1 after:bg-blue-600 after:rounded-full' : ''}`}>
                            <app.iconComponent size={28} className={app.color} />
                        </button>
                    ))}

                    <div className="w-px h-8 bg-black/10 mx-1" />

                    {/* Utility Buttons */}
                    {[
                        { id: 'home', icon: LayoutGrid, color: 'text-blue-500' },
                        { id: 'calendar', icon: Clock, color: 'text-gray-700' },
                        { id: 'more', icon: MoreVertical, color: 'text-gray-700' }
                    ].map((btn) => (
                        <button 
                            key={btn.id}
                            onClick={() => setActivePopup(activePopup === btn.id ? null : btn.id)}
                            className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${activePopup === btn.id ? 'bg-black/10' : 'hover:bg-black/5'}`}
                        >
                            <btn.icon size={24} className={btn.color} />
                        </button>
                    ))}
                </div>
            </div>

            {/* Simplified Context Menu */}
            {contextMenu?.visible && (
                <div 
                    className="fixed w-44 bg-white/95 backdrop-blur-md shadow-2xl rounded-xl py-1 text-sm border border-gray-200"
                    style={{ 
                        zIndex: Z_INDICES.CONTEXT_MENU, 
                        top: contextMenu.y, 
                        left: contextMenu.x,
                        transform: 'translate(-50%, -100%)' 
                    }}
                    onClick={() => setContextMenu(null)}
                >
                    <div className="px-3 py-2 font-bold text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">{contextMenu.appName}</div>
                    <button className="flex items-center w-full px-3 py-2 hover:bg-blue-600 hover:text-white transition-colors">
                        <Pin size={14} className="mr-2" /> Pin to Dock
                    </button>
                    <button className="flex items-center w-full px-3 py-2 hover:bg-blue-600  transition-colors text-red-600 hover:text-white">
                        <Trash2 size={14} className="mr-2" /> Quit
                    </button>
                </div>
            )}

            {/* Global Click Handler to close menus */}
            {contextMenu && <div className="fixed inset-0 z-100000" onClick={() => setContextMenu(null)} />}
        </>
    );
}