"use client";
import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Chrome, Settings, Search, Monitor, Home, Trash2, FolderOpen } from "lucide-react";
import Image from "next/image";
import WindowContainer from "@/components/DeskTopContainerModal";

/* ---------- CONSTANTS AND TYPES ---------- */

const GRID_SIZE = 120; 
const TASKBAR_HEIGHT = 48;
const CONTEXT_MENU_Z_INDEX = 1100;
const BASE_WINDOW_Z_INDEX = 1200; 

// Instance counter for unique window IDs
let nextAppInstanceId = 1; 



const Win11FolderIcon = ({ size = 60 }: { size?: number }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <path
            d="M6 12C6 9.79086 7.79086 8 10 8H19L23 12H38C40.2091 12 42 13.7909 42 16V34C42 36.2091 40.2091 38 38 38H10C7.79086 38 6 36.2091 6 34V12Z"
            fill="#F4C542"/>
        <path
            d="M6 18H42V32C42 34.2091 40.2091 36 38 36H10C7.79086 36 6 34.2091 6 32V18Z"
            fill="#E0A800"/>
    </svg>
);

type IconPosition = { x: number; y: number; };

type AppIconState = {
    id: number;
    name: string;
    IconComponent: React.ElementType;
    color: string;
    position: IconPosition;
    previousPosition: IconPosition; 
};

type ContextMenuState = {
    visible: boolean;
    x: number;
    y: number;
    iconId: number | null;
    iconName: string | null;
}

// Window state definition
type OpenWindow = {
    id: number; // Unique instance ID
    appId: number; // ID of the application type
    appName: string;
    zIndex: number; // Current Z-Index
};

const initialIcons: AppIconState[] = [
    { id: 1, name: "Browser", IconComponent: Chrome, color: "text-green-600", position: { x: 0, y: 0 }, previousPosition: { x: 0, y: 0 }, },
    { id: 2, name: "Files", IconComponent: Win11FolderIcon, color: "text-yellow-600", position: { x: 0, y: GRID_SIZE * 1 }, previousPosition: { x: 0, y: GRID_SIZE * 1 }, },
    { id: 3, name: "Settings", IconComponent: Settings, color: "text-amber-900", position: { x: 0, y: GRID_SIZE * 2 }, previousPosition: { x: 0, y: GRID_SIZE * 2 }, },
    { id: 4, name: "Monitor", IconComponent: Monitor, color: "text-red-600", position: { x: 0, y: GRID_SIZE * 3 }, previousPosition: { x: 0, y: GRID_SIZE * 3 }, },
];

/* -------------------------------------------------------------
    CONTEXT MENU COMPONENT 
-------------------------------------------------------------- */

type ContextMenuProps = {
    menu: ContextMenuState;
    onOpen: (id: number, name: string) => void;
    onRemove: (id: number) => void;
    onClose: () => void;
};

const ContextMenu: React.FC<ContextMenuProps> = ({ menu, onOpen, onRemove, onClose }) => {
    if (!menu.visible || menu.iconId === null) return null;

    return (
        <div
            className="fixed w-48 bg-white/90 backdrop-blur-md shadow-xl py-1 text-sm text-black border border-gray-200"
            style={{ top: menu.y, left: menu.x, zIndex: CONTEXT_MENU_Z_INDEX }}
            onMouseLeave={onClose}
            onMouseEnter={() => {}} >
            <button 
                onClick={() => { onOpen(menu.iconId!, menu.iconName!); onClose(); }} 
                className="flex items-center w-full px-4 py-2 hover:bg-blue-500/10 transition duration-100">
                <FolderOpen size={16} className="mr-2 text-blue-600" /> Open {menu.iconName}
            </button>
            <button 
                onClick={() => { onRemove(menu.iconId!); onClose(); }} 
                className="flex items-center w-full px-4 py-2 text-red-600 hover:bg-red-500/10 transition duration-100">
                <Trash2 size={16} className="mr-2" /> Remove from Home
            </button>
        </div>
    );
};

/* -------------------------------------------------------------
    DRAGGABLE ICON COMPONENT 
-------------------------------------------------------------- */

type DraggableIconProps = AppIconState & {
    onDragStart: (id: number, e: React.MouseEvent) => void;
    onOpen: (id: number, name: string) => void;
    onContextMenu: (id: number, name: string, e: React.MouseEvent) => void;
    isDragging: boolean;
};

const DraggableIcon: React.FC<DraggableIconProps> = ({ 
    id, name, IconComponent, color, position, onDragStart, onOpen, onContextMenu, isDragging,
}) => {
    return (
        <div
            className={`absolute flex flex-col items-center w-32 h-32 text-center cursor-pointer select-none group transition-shadow ${isDragging ? 'shadow-lg' : ''}`}
            style={{ 
                left: `${position.x}px`, 
                top: `${position.y}px`, 
                zIndex: isDragging ? 50 : 10, 
                width: GRID_SIZE,
                height: GRID_SIZE,
                padding: (GRID_SIZE - 64) / 2 - 8,
            }}
            onMouseDown={(e) => onDragStart(id, e)}
            onDoubleClick={() => onOpen(id, name)}
            onContextMenu={(e) => onContextMenu(id, name, e)}
        >
            <div className={`w-24 h-24 flex items-center justify-center p-2 rounded-md transition duration-100 group-hover:bg-white/20`}>
                <IconComponent size={64} className={color} /> 
            </div>
            <span className="text-xs text-white mt-1 bg-black/50 px-1 rounded-sm">{name}</span>
        </div>
    );
};

/* -------------------------------------------------------------
    MAIN HOME PAGE COMPONENT (Window Manager Logic)
-------------------------------------------------------------- */

export default function HomePage() {
    const [icons, setIcons] = useState<AppIconState[]>(initialIcons);
    const [draggingId, setDraggingId] = useState<number | null>(null);
    const [offset, setOffset] = useState<IconPosition>({ x: 0, y: 0 });
    const [contextMenu, setContextMenu] = useState<ContextMenuState>({ visible: false, x: 0, y: 0, iconId: null, iconName: null });

    // State to hold all open window instances
    const [openWindows, setOpenWindows] = useState<OpenWindow[]>([]);
    // Tracks the highest Z-index currently assigned to keep new windows on top
    const [maxZIndex, setMaxZIndex] = useState(BASE_WINDOW_Z_INDEX);

    const desktopRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setContextMenu(prev => ({ ...prev, visible: false }));
    }, [draggingId]);

    const snapToGrid = useCallback((x: number, y: number): IconPosition => {
        if (!desktopRef.current) return { x: 0, y: 0 };
        const desktopWidth = desktopRef.current.offsetWidth;
        const desktopHeight = desktopRef.current.offsetHeight;
        const col = Math.round(x / GRID_SIZE);
        const row = Math.round(y / GRID_SIZE);
        let snappedX = col * GRID_SIZE;
        let snappedY = row * GRID_SIZE;
        const maxX = desktopWidth - GRID_SIZE;
        snappedX = Math.max(0, Math.min(snappedX, maxX));
        const maxY = desktopHeight - TASKBAR_HEIGHT - GRID_SIZE;
        snappedY = Math.max(0, Math.min(snappedY, maxY));
        return { x: snappedX, y: snappedY };
    }, []);

    const isPositionOccupied = useCallback((targetX: number, targetY: number, currentId: number) => {
        return icons.some(icon => 
            icon.id !== currentId && 
            icon.position.x === targetX && 
            icon.position.y === targetY
        );
    }, [icons]);

    const handleDragStart = (id: number, e: React.MouseEvent) => {
        e.preventDefault();
        if (e.button === 2) return;

        setDraggingId(id);
        const draggedIcon = icons.find(i => i.id === id);
        
        if (draggedIcon) {
            setIcons(prevIcons => 
                prevIcons.map(icon =>
                    icon.id === id
                        ? { ...icon, previousPosition: icon.position }
                        : icon
                )
            );
            
            setOffset({
                x: e.clientX - draggedIcon.position.x,
                y: e.clientY - draggedIcon.position.y,
            });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (draggingId !== null) {
            e.preventDefault();
            const newX = e.clientX - offset.x;
            const newY = e.clientY - offset.y;

            setIcons(prevIcons => 
                prevIcons.map(icon =>
                    icon.id === draggingId
                        ? { ...icon, position: { x: newX, y: newY } }
                        : icon
                )
            );
        }
    };

    const handleMouseUp = () => {
        if (draggingId === null) return;

        setIcons(prevIcons => {
            return prevIcons.map(icon => {
                if (icon.id !== draggingId) return icon;
                const snapped = snapToGrid(icon.position.x, icon.position.y);
                if (isPositionOccupied(snapped.x, snapped.y, icon.id)) {
                    return { ...icon, position: icon.previousPosition };
                }
                return { ...icon, position: snapped, previousPosition: snapped };
            });
        });
        setDraggingId(null);
    };

    /* -------------------------- WINDOW MANAGER HANDLERS -------------------------- */

    const handleCloseWindow = useCallback((id: number) => {
        setOpenWindows(prev => prev.filter(w => w.id !== id));
    }, []);

    const handleFocusWindow = useCallback((id: number) => {
        const newZIndex = maxZIndex + 1;
        setOpenWindows(prev => prev.map(w => (w.id === id ? { ...w, zIndex: newZIndex } : w)));
        setMaxZIndex(newZIndex);
    }, [maxZIndex]);

    const handleOpenApp = useCallback((appId: number, name: string) => {
        setContextMenu(prev => ({ ...prev, visible: false }));

        const newId = nextAppInstanceId++;
        const newZIndex = maxZIndex + 1;
        
        setOpenWindows(prev => [
            ...prev, 
            { id: newId, appId: appId, appName: name, zIndex: newZIndex }
        ]);
        setMaxZIndex(newZIndex);
    }, [maxZIndex]);

    /* ---------- CONTEXT MENU HANDLERS ---------- */
    
    const handleContextMenu = (id: number, name: string, e: React.MouseEvent) => {
        e.preventDefault();
        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            iconId: id,
            iconName: name,
        });
    };

    const handleRemoveIcon = (id: number) => {
        setIcons(prevIcons => prevIcons.filter(icon => icon.id !== id));
        setContextMenu(prev => ({ ...prev, visible: false }));
    };

    return (
        <div
            ref={desktopRef}
            className="w-full h-screen bg-gray-800 relative overflow-hidden" 
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onContextMenu={(e) => e.preventDefault()}
            onClick={() => setContextMenu(prev => ({ ...prev, visible: false }))}>
            <Image
                src="/main_bg.jpg" 
                alt="Windows 11 Style Background"
                fill
                style={{ objectFit: "cover" }}
                quality={100}
                priority
                className="z-0"
            />

            {icons.map(icon => (
                <DraggableIcon
                    key={icon.id}
                    {...icon}
                    isDragging={icon.id === draggingId}
                    onDragStart={handleDragStart}
                    onOpen={handleOpenApp}
                    onContextMenu={handleContextMenu}
                />
            ))}

            <ContextMenu 
                menu={contextMenu} 
                onOpen={handleOpenApp} 
                onRemove={handleRemoveIcon} 
                onClose={() => setContextMenu(prev => ({ ...prev, visible: false }))}
            />

            {openWindows.map(window => (
                <WindowContainer
                    key={window.id}
                    id={window.id}
                    title={window.appName}
                    zIndex={window.zIndex} 
                    onFocus={handleFocusWindow} 
                    onClose={handleCloseWindow}
                    initialState={{ 
                        x: 50 + (window.id * 20) % 200,
                        y: 50 + (window.id * 20) % 150,
                    }}
                >
                    <div className="p-4 text-black/80">
                        <h3 className="text-xl font-bold mb-2">Application: {window.appName} (Instance: {window.id})</h3>
                        <p className="text-lg">This modal instantly comes to the front when clicked!</p>
                        <p className="mt-3 text-sm text-gray-600">(Current Z-Index: {window.zIndex}).</p>
                    </div>
                </WindowContainer>
            ))}
        </div>
    );
}
