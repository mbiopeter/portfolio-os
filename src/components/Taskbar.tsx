"use client";

import { useState, useEffect, useMemo, useRef, useCallback, forwardRef } from "react";
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
export const Z_INDICES = {
    DOCK: 1000004,
    CONTEXT_MENU: 1000005,
    HOME: 1000000,
    SEARCH: 1000002,
    POPUP: 1000001,
    PREVIEW: 1000003, 
};

/* ---------- TYPES ---------- */
export type AppIcon = {
    name: string;
    iconComponent: React.ElementType;
    onClick: () => void;
    color?: string;
    isActive?: boolean;
    category?: string;
};

export type AppPreviewData = {
    appName: string;
    previews: {
        id: number;
        title: string;
        content: React.ReactNode;
        icon: React.ElementType;
    }[];
};

type ContextMenuState = {
    visible: boolean;
    x: number;
    y: number;
    appName: string | null;
    isDocked: boolean;
};

export type DockProps = {
    apps?: AppIcon[];
    runningApps?: AppIcon[];
};

export type HoveredAppState = {
    appName: string;
    x: number; 
    y: number;
    height: number;
} | null;

/* ---------- DUMMY PREVIEW DATA & CONTENT (Updated) ---------- */
const DummyCalendarPreview = () => (
    <div className="p-1.5 bg-white rounded-lg w-full h-full flex flex-col">
        <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <div className="w-2 h-2 rounded-full bg-green-500" />
            </div>
            <span className="text-xs font-semibold text-gray-800">Calendar</span>
        </div>
        <div className="bg-red-100 p-1 rounded-sm flex-grow">
            <p className="text-[10px] text-red-600 font-bold mb-1">September 2025</p>
            <table className="text-[8px] w-full">
                <thead>
                    <tr className="text-gray-500">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <th key={d} className="w-3 py-[1px]">{d}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {[
                        [28, 29, 30, 1, 2, 3, 4],
                        [5, 6, 7, 8, 9, 10, 11],
                        [12, 13, 14, 15, 16, 17, 18],
                        [19, 20, 21, 22, 23, 24, 25]
                    ].map((week, i) => (
                        <tr key={i}>
                            {week.map(d => <td key={d} className={`text-center py-[1px] ${d < 28 && i === 0 ? 'text-gray-400' : ''} ${d === 15 ? 'bg-blue-500 text-white rounded-full' : ''}`}>{d > 25 && i !== 0 ? d - 25 : d}</td>)}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

const DummyNumbersPreview = () => (
    <div className="p-1.5 bg-white rounded-lg w-full h-full flex flex-col">
        <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <div className="w-2 h-2 rounded-full bg-green-500" />
            </div>
            <span className="text-xs font-semibold text-gray-800">Numbers</span>
        </div>
        <div className="flex-grow flex flex-col">
            <p className="text-[8px] font-medium text-gray-700 mb-1">plan</p>
            {/* Simple Bar Chart placeholder (Closer to image) */}
            <div className="flex justify-around items-end h-16 w-full p-1 bg-white rounded shadow-inner border border-gray-200">
                {/* Bars - Green/Blue pattern */}
                <div className="w-2 bg-green-500 h-5/6 rounded-t"></div>
                <div className="w-2 bg-blue-500 h-1/2 rounded-t"></div>
                <div className="w-2 bg-green-500 h-full rounded-t"></div>
                <div className="w-2 bg-blue-500 h-1/4 rounded-t"></div>
                <div className="w-2 bg-green-500 h-2/3 rounded-t"></div>
                <div className="w-2 bg-blue-500 h-5/6 rounded-t"></div>
            </div>
        </div>
    </div>
);

const dummyPreviewData: AppPreviewData[] = [
    {
        appName: "Numbers",
        previews: [
            {
                id: 1,
                title: "plan",
                content: <DummyNumbersPreview />,
                icon: BarChart3,
            },
            {
                id: 2,
                title: "Budget",
                content: <DummyNumbersPreview />,
                icon: BarChart3,
            }
        ],
    },
    {
        appName: "Calendar",
        previews: [
            {
                id: 3,
                title: "Calendar",
                content: <DummyCalendarPreview />,
                icon: CalendarDays,
            }
        ],
    },
    {
        appName: "Browser",
        previews: [
            {
                id: 4,
                title: "Dashboard",
                content: (
                    <div className="p-2 bg-white rounded-lg shadow-lg w-full h-full flex flex-col items-center justify-center">
                        <Chrome size={24} className="text-yellow-600" />
                        <p className="text-xs text-center mt-1">Open Tabs: 5</p>
                    </div>
                ),
                icon: Chrome,
            }
        ],
    }
];


const defaultApps: AppIcon[] = [
    {
        name: "Finder",
        iconComponent: Search,
        onClick: () => console.log("Finder clicked"),
        color: "text-purple-600",
        category: "System",
    },
    {
        name: "Numbers",
        iconComponent: BarChart3,
        onClick: () => console.log("Numbers clicked"),
        color: "text-green-500",
        isActive: true, 
        category: "Productivity",
    },
    {
        name: "Calendar",
        iconComponent: CalendarDays,
        onClick: () => console.log("Calendar clicked"),
        color: "text-red-500",
        isActive: true, 
        category: "Productivity",
    },
    {
        name: "Browser",
        iconComponent: Chrome,
        onClick: () => console.log("Browser clicked"),
        color: "text-yellow-600",
        isActive: true,
        category: "Internet",
    },
    {
        name: "Settings",
        iconComponent: Settings,
        onClick: () => console.log("Settings clicked"),
        color: "text-gray-600",
        category: "System",
    }
];

const defaultRunningApps: AppIcon[] = [
    {
        name: "Monitor",
        iconComponent: Monitor,
        onClick: () => console.log("Monitor clicked"),
        category: "System",
    },
    {
        name: "Trash", 
        iconComponent: Trash2,
        onClick: () => console.log("Trash clicked"),
        color: "text-gray-700",
        category: "Utilities",
    },
];

const allApps = [...defaultApps, ...defaultRunningApps]
    .filter((app, index, self) => index === self.findIndex((a) => a.name === app.name))
    .sort((a, b) => a.name.localeCompare(b.name));

/* ---------- APP PREVIEW COMPONENT (Updated and ForwardRef) ---------- */
export const AppPreview = forwardRef<HTMLDivElement, { 
    hoveredApp: HoveredAppState; 
    previews: AppPreviewData[];
    onMouseEnter: () => void;
    onMouseLeave: () => void;
}>(({ hoveredApp, previews, onMouseEnter, onMouseLeave }, ref) => {
    if (!hoveredApp) return null;
    const previewData = previews.find(p => p.appName === hoveredApp.appName);
    if (!previewData || previewData.previews.length === 0) return null;

    const PREVIEW_WIDTH = 130; 
    const PREVIEW_GAP = 16; 
    const ARROW_SIZE = 10;

    const totalPreviewWidth = (previewData.previews.length * PREVIEW_WIDTH);
    const totalGapWidth = ((previewData.previews.length - 1) * PREVIEW_GAP);
    const PADDING = 20; 
    const bubbleWidth = totalPreviewWidth + totalGapWidth + PADDING * 2;
    const leftPosition = hoveredApp.x - (bubbleWidth / 2);

    const DOCK_PREVIEW_GAP = 16;
    const bubbleHeight = 160;
    const topPosition = hoveredApp.y - bubbleHeight - DOCK_PREVIEW_GAP;


    return (
        <div
            ref={ref}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            style={{
                zIndex: Z_INDICES.PREVIEW,
                left: leftPosition,
                top: topPosition,
            }}
            className="fixed flex flex-col items-center transition-opacity duration-150 ease-out">
            <div
                className="relative bg-white/80 backdrop-blur-md p-2 rounded-xl shadow-2xl transition-all duration-300 ease-out flex gap-2"
                style={{ width: bubbleWidth, height: bubbleHeight }}>
                {previewData.previews.map(preview => (
                    <div
                        key={preview.id}
                        className="flex flex-col items-center bg-white/20 rounded-lg w-32 h-full p-1 transition-transform duration-200 ease-in-out hover:scale-[1.03] cursor-pointer"
                        onClick={() => console.log(`Opened preview: ${preview.title}`)}>
                        <p className="text-xs text-black/90 font-medium mb-1 truncate w-full text-center">{preview.title}</p>

                        <div className="w-[calc(100%-8px)] h-[calc(100%-10px)] bg-gray-100 rounded-md overflow-hidden shadow-inner flex items-center justify-center">
                            {preview.content}
                        </div>
                        
                    </div>
                ))}
            </div>

            {/* Triangle/Arrow */}
            <div
                className="relative"
                style={{
                    width: ARROW_SIZE * 2,
                    height: ARROW_SIZE, 
                    marginTop: -ARROW_SIZE + 2,
                }}>
                <div
                    style={{
                        position: 'absolute',
                        bottom: -8,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 0,
                        height: 0,
                        borderLeft: `${ARROW_SIZE}px solid transparent`,
                        borderRight: `${ARROW_SIZE}px solid transparent`,
                        borderTop: `${ARROW_SIZE}px solid rgba(255, 255, 255, 0.8)`, 
                        filter: 'drop-shadow(0px 5px 5px rgba(0, 0, 0, 0.5))',
                    }}
                />
            </div>
        </div>
    );
});
AppPreview.displayName = 'AppPreview'; // For React DevTools

/* ---------- MAIN COMPONENT (Dock) ---------- */
type DockCoreProps = DockProps & {
    dockRef: React.RefObject<HTMLDivElement>;
    isRunningApp: (appName: string) => boolean;
    handleMouseEnter: (e: React.MouseEvent<HTMLButtonElement>, app: AppIcon) => void;
    handleMouseLeave: () => void;
    allApps: AppIcon[];
    dummyPreviewData: AppPreviewData[];
}

const DockCore: React.FC<DockCoreProps> = ({ 
    apps = defaultApps, 
    runningApps = defaultRunningApps,
    dockRef,
    isRunningApp,
    handleMouseEnter,
    handleMouseLeave,
    allApps,
    dummyPreviewData,
}) => {
    const modalRef = useRef<HTMLDivElement | null>(null);

    const [activePopup, setActivePopup] = useState<"calendar" | "runningApps" | "search" | "home" | null>(null);
    const [dockApps, setDockApps] = useState<AppIcon[]>(apps);
    const [draggedItem, setDraggedItem] = useState<AppIcon | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    
    const [contextMenu, setContextMenu] = useState<ContextMenuState>({
        visible: false,
        x: 0,
        y: 0,
        appName: null,
        isDocked: false,
    });

    const pathname = usePathname();
    const hideDockCompletely = pathname === "/" || pathname === "/profiles" || pathname === "/owner";


    const handleDragStart = (e: React.DragEvent<HTMLButtonElement>, app: AppIcon, index: number) => {
        setDraggedItem(app);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent<HTMLButtonElement>, index: number) => {
        e.preventDefault();
        setDragOverIndex(index);
    };

    const handleDrop = (e: React.DragEvent<HTMLButtonElement>, index: number) => {
        e.preventDefault();
        if (draggedItem) {
            const draggedIndex = dockApps.findIndex(app => app.name === draggedItem.name);
            if (draggedIndex !== -1 && draggedIndex !== index) {
                const newApps = [...dockApps];
                newApps.splice(draggedIndex, 1);
                newApps.splice(index, 0, draggedItem);
                setDockApps(newApps);
            }
        }
        setDragOverIndex(null);
    };

    const handleDragEnd = () => {
        setDraggedItem(null);
        setDragOverIndex(null);
    };

    const handleContextMenu = (e: React.MouseEvent<HTMLButtonElement>, app: AppIcon) => {
        e.preventDefault();
        const isDocked = dockApps.some(a => a.name === app.name);
        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            appName: app.name,
            isDocked,
        });
    };

    const togglePopup = (popup: "calendar" | "runningApps" | "search" | "home") => {
        setActivePopup(activePopup === popup ? null : popup);
    };

    if (hideDockCompletely) return null;

    /* ---------- CONTEXT MENU ---------- */
    const ContextMenu = () => {
        if (!contextMenu.visible || !contextMenu.appName) return null;
        const isDocked = contextMenu.isDocked;
        const appName = contextMenu.appName;
        
        const findAppByName = (name: string): AppIcon | undefined => {
            return allApps.find(app => app.name === name);
        };

        const handleContextMenuAction = (action: string) => {
            const appName = contextMenu.appName;
            if (!appName) return;

            setContextMenu({ visible: false, x: 0, y: 0, appName: null, isDocked: false });

            switch (action) {
                case 'open':
                    const app = findAppByName(appName);
                    if (app) app.onClick();
                    break;
                case 'pin':
                    if (contextMenu.isDocked) {
                        setDockApps(dockApps.filter(app => app.name !== appName));
                    } else {
                        const appToAdd = allApps.find(app => app.name === appName);
                        if (appToAdd) setDockApps([...dockApps, appToAdd]);
                    }
                    break;
                case 'home':
                    console.log(`Added ${appName} to Home`);
                    break;
            }
        };


        return (
            <div
                ref={modalRef}
                style={{
                    zIndex: Z_INDICES.CONTEXT_MENU,
                    top: contextMenu.y,
                    left: contextMenu.x,
                    transform: 'translate(-50%, -100%)',
                }}
                className="fixed w-48 bg-white/95 backdrop-blur-md shadow-2xl rounded-lg py-1 text-sm text-black border border-gray-200">
                <div className="px-3 py-1 font-bold border-b border-gray-200">{appName}</div>
                <button onClick={() => handleContextMenuAction('open')} className="flex items-center w-full px-3 py-1.5 hover:bg-blue-500 hover:text-white transition-colors">
                    <LayoutGrid size={16} className="mr-2" /> Open
                </button>
                <button onClick={() => handleContextMenuAction('pin')} className="flex items-center w-full px-3 py-1.5 hover:bg-blue-500 hover:text-white transition-colors">
                    <Pin size={16} className="mr-2" /> {isDocked ? "Remove from Dock" : "Pin to Dock"}
                </button>
                <button onClick={() => handleContextMenuAction('home')} className="flex items-center w-full px-3 py-1.5 hover:bg-blue-500 hover:text-white transition-colors">
                    <PlusCircle size={16} className="mr-2" /> Add to Home
                </button>
            </div>
        );
    };

    /* ---------- RENDER ---------- */
    return (
        <>
            {/* Dock */}
            <div
                ref={dockRef}
                className="fixed bottom-3 left-1/2 transform -translate-x-1/2 h-14 bg-white/40 backdrop-blur-3xl border border-white/50 rounded-2xl flex items-center px-2 text-black shadow-2xl transition-all duration-300 ease-out"
                style={{ zIndex: Z_INDICES.DOCK }}>
                <div className="flex justify-center items-center h-full gap-2 p-1">
                    {dockApps.map((app, index) => (
                        <button
                            key={app.name}
                            onClick={app.onClick}
                            onContextMenu={(e) => handleContextMenu(e, app)}
                            onMouseEnter={(e) => handleMouseEnter(e, app)} 
                            onMouseLeave={handleMouseLeave} 
                            draggable
                            onDragStart={(e) => handleDragStart(e, app, index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDrop={(e) => handleDrop(e, index)}
                            onDragEnd={handleDragEnd}
                            title={app.name}
                            className={`relative flex flex-col items-center justify-center w-10 h-10 transition-transform duration-150 ease-out 
                            ${draggedItem?.name === app.name ? "opacity-50" : ""} 
                            ${isRunningApp(app.name) ? 
                                `relative after:content-[""] after:absolute after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-blue-700 after:rounded-full` 
                                : ""}`
                            }>
                            <app.iconComponent size={28} className={app.color} />
                            {draggedItem && dragOverIndex === index && draggedItem.name !== app.name && (
                                <div className="absolute top-0 bottom-0 left-0 right-0 border-2 border-blue-500 rounded-lg pointer-events-none" />
                            )}
                        </button>
                    ))}

                    <div className="w-px h-10 bg-black/20 mx-1" />

                    <button onClick={() => togglePopup("home")} className={`flex items-center justify-center w-10 h-10 hover:bg-black/10 rounded-full ${activePopup === 'home' ? 'bg-black/10' : ''}`}>
                        <LayoutGrid size={24} className="text-blue-500" />
                    </button>

                    <button onClick={() => togglePopup("calendar")} className={`flex items-center justify-center w-10 h-10 hover:bg-black/10 rounded-full ${activePopup === 'calendar' ? 'bg-black/10' : ''}`}>
                        <Clock size={24} />
                    </button>

                    <button onClick={() => togglePopup("runningApps")} className={`flex items-center justify-center w-10 h-10 hover:bg-black/10 rounded-full ${activePopup === 'runningApps' ? 'bg-black/10' : ''}`}>
                        <MoreVertical size={24} />
                    </button>
                </div>
            </div>

            {/* Context Menu */}
            <ContextMenu />
        </>
    );
}

/* ---------- HOVER MANAGER COMPONENT (Wraps everything and is the default export) ---------- */

// This component acts as the new default export and handles the core hover logic.
export default function HoverManagerComponent({ apps = defaultApps, runningApps = defaultRunningApps }: DockProps) {
    const [hoveredApp, setHoveredApp] = useState<HoveredAppState>(null);
    const dockRef = useRef<HTMLDivElement>(null!);
    const previewRef = useRef<HTMLDivElement | null>(null);
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const isRunningApp = useCallback((appName: string): boolean => {
        const isDockedAndActive = apps.some(app => app.name === appName && app.isActive === true);
        const isRunning = runningApps.some(app => app.name === appName);
        const hasPreview = dummyPreviewData.some(p => p.appName === appName);
        return (isRunning || isDockedAndActive) && hasPreview;
    }, [runningApps, apps]);


    const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLButtonElement>, app: AppIcon) => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }

        if (isRunningApp(app.name)) {
            const rect = e.currentTarget.getBoundingClientRect();
            setHoveredApp({
                appName: app.name,
                x: rect.left + rect.width / 2, 
                y: rect.top, 
                height: rect.height,
            });
        }
    }, [isRunningApp]);

    const handleMouseLeave = useCallback(() => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
        }
        hoverTimeoutRef.current = setTimeout(() => {
            setHoveredApp(null);
        }, 300); // 300ms delay
    }, []);

    const handlePreviewMouseEnter = useCallback(() => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }
    }, []);

    const handlePreviewMouseLeave = useCallback(() => {
        setHoveredApp(null);
    }, []);

    return (
        <>
            {/* App Preview Pop-up - Added onMouseEnter/onMouseLeave for persistence */}
            <AppPreview
                hoveredApp={hoveredApp}
                previews={dummyPreviewData}
                ref={previewRef}
                onMouseEnter={handlePreviewMouseEnter}
                onMouseLeave={handlePreviewMouseLeave}
            />

            {/* Dock Core */}
            <DockCore
                apps={apps}
                runningApps={runningApps}
                dockRef={dockRef}
                isRunningApp={isRunningApp}
                handleMouseEnter={handleMouseEnter}
                handleMouseLeave={handleMouseLeave}
                allApps={allApps}
                dummyPreviewData={dummyPreviewData}
            />
        </>
    );
}