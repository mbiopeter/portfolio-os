"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import { Chrome, Settings, Monitor, Trash2, FolderOpen } from "lucide-react";
import Image from "next/image";
import WindowContainer from "@/components/DeskTopContainerModal";
import { useWindowManager } from "@/hooks/useWindowManager";

const GRID_SIZE = 120;

const Win11FolderIcon = ({ size = 60 }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <path d="M6 12C6 9.79086 7.79086 8 10 8H19L23 12H38C40.2091 12 42 13.7909 42 16V34C42 36.2091 40.2091 38 38 38H10C7.79086 38 6 36.2091 6 34V12Z" fill="#F4C542"/>
        <path d="M6 18H42V32C42 34.2091 40.2091 36 38 36H10C7.79086 36 6 34.2091 6 32V18Z" fill="#E0A800"/>
    </svg>
);

const initialIcons = [
    { id: 1, name: "Browser", IconComponent: Chrome, color: "text-green-600", position: { x: 0, y: 0 }, prevPos: { x: 0, y: 0 } },
    { id: 2, name: "Files", IconComponent: Win11FolderIcon, color: "text-yellow-600", position: { x: 0, y: GRID_SIZE }, prevPos: { x: 0, y: GRID_SIZE } },
    { id: 3, name: "Settings", IconComponent: Settings, color: "text-amber-900", position: { x: 0, y: GRID_SIZE * 2 }, prevPos: { x: 0, y: GRID_SIZE * 2 } },
    { id: 4, name: "Monitor", IconComponent: Monitor, color: "text-red-600", position: { x: 0, y: GRID_SIZE * 3 }, prevPos: { x: 0, y: GRID_SIZE * 3 } },
];

export default function HomePage() {
    const { openWindows, handleOpenApp, handleCloseWindow, handleFocusWindow } = useWindowManager();

    const [icons, setIcons] = useState(initialIcons);
    const [draggingId, setDraggingId] = useState<number | null>(null);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; iconId: number | null; iconName: string | null }>({
        visible: false, x: 0, y: 0, iconId: null, iconName: null
    });

    const desktopRef = useRef<HTMLDivElement>(null);

    /* ---------- COLLISION & GRID LOGIC ---------- */
    
    const snapToGrid = useCallback((x: number, y: number) => {
        return { x: Math.round(x / GRID_SIZE) * GRID_SIZE, y: Math.round(y / GRID_SIZE) * GRID_SIZE };
    }, []);

    const isPositionOccupied = (targetX: number, targetY: number, currentId: number) => {
        return icons.some(icon => icon.id !== currentId && icon.position.x === targetX && icon.position.y === targetY);
    };

    const handleDragStart = (id: number, e: React.MouseEvent) => {
        if (e.button === 2) return;
        const icon = icons.find(i => i.id === id);
        if (icon) {
            setDraggingId(id);
            // Store the current position as the 'previous valid' position before dragging starts
            setIcons(prev => prev.map(i => i.id === id ? { ...i, prevPos: i.position } : i));
            setOffset({ x: e.clientX - icon.position.x, y: e.clientY - icon.position.y });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (draggingId === null) return;
        setIcons(prev => prev.map(icon => 
            icon.id === draggingId ? { ...icon, position: { x: e.clientX - offset.x, y: e.clientY - offset.y } } : icon
        ));
    };

    const handleMouseUp = () => {
        if (draggingId === null) return;

        setIcons(prev => {
            return prev.map(icon => {
                if (icon.id !== draggingId) return icon;

                const snapped = snapToGrid(icon.position.x, icon.position.y);
                
                // CHECK COLLISION: If occupied, snap back to prevPos
                if (isPositionOccupied(snapped.x, snapped.y, icon.id)) {
                    return { ...icon, position: icon.prevPos };
                }

                // Otherwise, save new valid position
                return { ...icon, position: snapped, prevPos: snapped };
            });
        });
        setDraggingId(null);
    };

    return (
        <div 
            ref={desktopRef}
            className="w-full h-screen relative overflow-hidden bg-gray-900"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onContextMenu={(e) => e.preventDefault()}
            onClick={() => setContextMenu(prev => ({ ...prev, visible: false }))}
        >
            <Image src="/main_bg.jpg" alt="Background" fill className="object-cover z-0" priority />

            {icons.map((icon) => (
                <div
                    key={icon.id}
                    onMouseDown={(e) => handleDragStart(icon.id, e)}
                    onDoubleClick={() => handleOpenApp(icon.id, icon.name)}
                    onContextMenu={(e) => {
                        e.preventDefault();
                        setContextMenu({ visible: true, x: e.clientX, y: e.clientY, iconId: icon.id, iconName: icon.name });
                    }}
                    className="absolute flex flex-col items-center justify-center cursor-pointer group select-none transition-shadow"
                    style={{ 
                        left: icon.position.x, 
                        top: icon.position.y, 
                        width: GRID_SIZE, 
                        height: GRID_SIZE, 
                        zIndex: draggingId === icon.id ? 50 : 10,
                        // Visual feedback when dragging
                        filter: draggingId === icon.id ? 'drop-shadow(0 10px 15px rgba(0,0,0,0.3))' : 'none'
                    }}
                >
                    <div className="p-2 rounded-md group-hover:bg-white/20 transition-colors">
                        <icon.IconComponent size={64} className={icon.color} />
                    </div>
                    <span className="text-xs text-white bg-black/40 px-1 mt-1 rounded">{icon.name}</span>
                </div>
            ))}

            {/* Context Menu Component */}
            {contextMenu.visible && (
                <div 
                    className="fixed w-48 bg-white/90 backdrop-blur-md shadow-xl border border-gray-200 py-1 z-[2000] text-sm"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                >
                    <button onClick={() => handleOpenApp(contextMenu.iconId!, contextMenu.iconName!)} className="flex items-center w-full px-4 py-2 hover:bg-blue-500/10">
                        <FolderOpen size={16} className="mr-2 text-blue-600" /> Open
                    </button>
                    <button onClick={() => setIcons(prev => prev.filter(i => i.id !== contextMenu.iconId))} className="flex items-center w-full px-4 py-2 text-red-600 hover:bg-red-500/10">
                        <Trash2 size={16} className="mr-2" /> Remove
                    </button>
                </div>
            )}

            {/* Reusable Window Instances */}
            {openWindows.map((window) => (
                <WindowContainer
                    key={window.id}
                    id={window.id}
                    title={window.appName}
                    zIndex={window.zIndex}
                    onFocus={handleFocusWindow}
                    onClose={handleCloseWindow}
                    initialState={{ x: 100 + (window.id * 30) % 300, y: 100 + (window.id * 30) % 200 }}
                >
                    <div className="p-6 text-black">
                        <h2 className="text-xl font-bold">Welcome to {window.appName}</h2>
                        <p className="mt-2 opacity-70">Instance ID: {window.id}</p>
                    </div>
                </WindowContainer>
            ))}
        </div>
    );
}