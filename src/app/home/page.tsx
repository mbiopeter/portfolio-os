"use client";
import { useState, useMemo } from "react";
import Image from "next/image";
import { FolderOpen, PinOff, Pin } from "lucide-react";
import WindowContainer from "@/components/DeskTopContainerModal";
import { ALL_APPS, useOS } from "../context/OSContext";

const CELL_SIZE = 100; 
const ICON_SIZE = 60;
const PADDING = 20;

export default function HomePage() {
    const { openWindows, openApp, closeWindow, focusWindow, togglePin, pinnedIds } = useOS();

    // Initial positioning in a "Table" format (Rows/Columns)
    const [icons, setIcons] = useState(ALL_APPS.map((app, i) => {
        const x = PADDING; 
        const y = i * CELL_SIZE + PADDING;
        return {
            ...app,
            pos: { x, y },
            prev: { x, y },
        };
    }));

    const [draggingId, setDraggingId] = useState<number | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, app: any } | null>(null);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (draggingId === null) return;

        // 4. Stay within screen boundaries
        const newX = Math.max(0, Math.min(e.clientX - dragOffset.x, window.innerWidth - CELL_SIZE));
        const newY = Math.max(0, Math.min(e.clientY - dragOffset.y, window.innerHeight - CELL_SIZE - 60));

        setIcons(prev => prev.map(icon => 
            icon.id === draggingId ? { ...icon, pos: { x: newX, y: newY } } : icon
        ));
    };

    const handleMouseUp = () => {
        if (draggingId === null) return;

        setIcons(prev => {
            const active = prev.find(i => i.id === draggingId);
            if (!active) return prev;

            // 3. Logic to snap to "Table Row/Column"
            const snappedX = Math.round((active.pos.x - PADDING) / CELL_SIZE) * CELL_SIZE + PADDING;
            const snappedY = Math.round((active.pos.y - PADDING) / CELL_SIZE) * CELL_SIZE + PADDING;

            // 1. Check if the cell is already occupied
            const isOccupied = prev.some(icon => 
                icon.id !== draggingId && 
                icon.prev.x === snappedX && 
                icon.prev.y === snappedY
            );

            return prev.map(icon => {
                if (icon.id === draggingId) {
                    // Return to previous spot if occupied, else move to new grid cell
                    const finalPos = isOccupied ? icon.prev : { x: snappedX, y: snappedY };
                    return { ...icon, pos: finalPos, prev: finalPos };
                }
                return icon;
            });
        });

        setDraggingId(null);
    };

    return (
        <div 
            className="w-full h-screen relative overflow-hidden bg-gray-900" 
            onMouseMove={handleMouseMove} 
            onMouseUp={handleMouseUp} 
            onMouseLeave={handleMouseUp}
            onClick={() => setContextMenu(null)}
            onContextMenu={(e) => e.preventDefault()}>
            <Image src="/main_bg.jpg" alt="Background" fill className="object-cover -z-10" priority />

            {icons.map(icon => (
                <div key={icon.id} 
                    onMouseDown={(e) => { 
                        if (e.button !== 0) return;
                        setDraggingId(icon.id); 
                        setDragOffset({ x: e.clientX - icon.pos.x, y: e.clientY - icon.pos.y }); 
                    }}
                    onDoubleClick={() => openApp(icon.id, icon.name)}
                    onContextMenu={(e) => { 
                        e.preventDefault(); 
                        setContextMenu({ x: e.clientX, y: e.clientY, app: icon }); 
                    }}
                    className="absolute flex flex-col items-center justify-center select-none group"
                    style={{ 
                        left: icon.pos.x, 
                        top: icon.pos.y, 
                        width: CELL_SIZE, 
                        height: CELL_SIZE,
                        zIndex: draggingId === icon.id ? 100 : 10,
                        transition: draggingId === icon.id ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}>
                    
                    {/* Visual Container */}
                    <div className={`p-2 flex flex-col items-center rounded-xl transition-colors
                        ${draggingId === icon.id ? '' : 'group-hover:bg-white/10'}`}>
                        
                        {/* 2. Increased Icon Size */}
                        <icon.Icon size={ICON_SIZE} className={`${icon.color} drop-shadow-2xl mb-2`} />
                        
                        <span className="text-xs text-white font-medium drop-shadow-md bg-black/40 px-2 py-0.5 rounded-full">
                            {icon.name}
                        </span>
                    </div>
                </div>
            ))}

            {/* Context Menu */}
            {contextMenu && (
                <div className="fixed w-48 bg-white/95 backdrop-blur-md shadow-2xl rounded-lg py-1 z-[9999] border border-gray-200" 
                    style={{ top: contextMenu.y, left: contextMenu.x }}>
                    <button onClick={() => openApp(contextMenu.app.id, contextMenu.app.name)} className="flex text-gray-800 items-center w-full px-4 py-2 hover:bg-blue-600 hover:text-white transition-colors">
                        <FolderOpen size={16} className="mr-3" /> <span className="text-sm font-semibold">Open App</span>
                    </button>
                    <button onClick={() => togglePin(contextMenu.app.id)} className="flex items-center w-full px-4 py-2 hover:bg-blue-600 hover:text-white transition-colors text-gray-800">
                        {pinnedIds.includes(contextMenu.app.id) ? <><PinOff size={16} className="mr-3" /> <span className="text-sm font-semibold">Unpin</span></> : <><Pin size={16} className="mr-3" /> <span className="text-sm font-semibold">Pin to Dock</span></>}
                    </button>
                </div>
            )}

            {/* Render Open Windows */}
            {openWindows.map((win: any) => (
                <WindowContainer 
                    key={win.id} id={win.id} title={win.name} zIndex={win.zIndex} 
                    onFocus={focusWindow} onClose={closeWindow} activeWindowCount={openWindows.length}
                >
                    <div className="h-full w-full bg-white p-4">
                        <p className="text-gray-500">Welcome to the {win.name} interface.</p>
                    </div>
                </WindowContainer>
            ))}
        </div>
    );
}