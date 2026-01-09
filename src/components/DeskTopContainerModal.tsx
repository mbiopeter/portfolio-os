"use client";

import { useState, useRef, useEffect, useCallback, useLayoutEffect } from "react";

const MIN_WIDTH = 300;
const MIN_HEIGHT = 200;
const TASKBAR_HEIGHT = 48;

type WindowState = {
    x: number;
    y: number;
    width: number;
    height: number;
    isMinimized: boolean;
    isMaximized: boolean;
    isActive: boolean;
    lastX: number;
    lastY: number;
    lastWidth: number;
    lastHeight: number;
};

export type WindowContainerProps = {
    id: string | number; // Support string IDs from your OSProvider
    title: string;
    onClose: (id: any) => void;
    onFocus: (id: any) => void;
    children: React.ReactNode;
    initialState?: Partial<WindowState>;
    zIndex: number;
    activeWindowCount?: number; // Pass the length of openWindows from parent
};

type DragState = {
    isDragging: boolean;
    offsetX: number;
    offsetY: number;
};

type ResizeState = {
    isResizing: boolean;
    direction: string | null;
    startX: number;
    startY: number;
    startW: number;
    startH: number;
};

const LOCAL_STORAGE_KEY_PREFIX = "window_state_";

const WindowContainer: React.FC<WindowContainerProps> = ({
    id,
    title,
    onClose,
    onFocus,
    children,
    initialState = {},
    zIndex,
    activeWindowCount = 0
}) => {
    const mounted = useRef(false);
    const dragRef = useRef<DragState>({ isDragging: false, offsetX: 0, offsetY: 0 });
    const windowRef = useRef<HTMLDivElement>(null);
    const storageKey = `${LOCAL_STORAGE_KEY_PREFIX}${id}`;

    const getInitialState = useCallback((): WindowState => {
        const defaultWidth = 800;
        const defaultHeight = 600;

        if (typeof window === "undefined") {
            return {
                x: 0, y: 0, width: defaultWidth, height: defaultHeight,
                isMinimized: false, isMaximized: false, isActive: true,
                lastX: 100, lastY: 100, lastWidth: 600, lastHeight: 400,
            };
        }

        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight - TASKBAR_HEIGHT;

        // --- OFFSET LOGIC ---
        // Apply a 20px stagger based on how many windows are open
        const stagger = (activeWindowCount % 10) * 20;
        
        const initialW = Math.min(defaultWidth, screenWidth * 0.8);
        const initialH = Math.min(defaultHeight, screenHeight * 0.8);
        
        // Centered base position + stagger
        const initialX = ((screenWidth - initialW) / 2) + stagger;
        const initialY = ((screenHeight - initialH) / 4) + stagger;

        let loadedState: Partial<WindowState> = {};

        try {
            const savedState = localStorage.getItem(storageKey);
            if (savedState) {
                loadedState = JSON.parse(savedState);
            }
        } catch (error) {
            console.error("Failed to load state:", error);
        }

        const baseState: WindowState = {
            x: initialX,
            y: initialY,
            width: initialW,
            height: initialH,
            isMinimized: false,
            isMaximized: false,
            isActive: true,
            lastX: initialX,
            lastY: initialY,
            lastWidth: initialW,
            lastHeight: initialH,
        };

        const finalState = {
            ...baseState,
            ...loadedState,
            ...initialState
        };

        // Ensure full height on maximization
        if (finalState.isMaximized) {
            finalState.x = 0;
            finalState.y = 0;
            finalState.width = screenWidth;
            finalState.height = screenHeight;
        }

        return finalState;
    }, [initialState, storageKey, activeWindowCount]);

    const [state, setState] = useState<WindowState>(() => getInitialState());
    const [resizeState, setResizeState] = useState<ResizeState>({
        isResizing: false,
        direction: null,
        startX: 0,
        startY: 0,
        startW: 0,
        startH: 0
    });

    useLayoutEffect(() => {
        if (!mounted.current) {
            onFocus(id);
            mounted.current = true;
        }
    }, [id, onFocus]);

    useEffect(() => {
        if (mounted.current) {
            try {
                const { x, y, width, height, isMaximized, lastX, lastY, lastWidth, lastHeight } = state;
                const stateToSave = JSON.stringify({ x, y, width, height, isMaximized, lastX, lastY, lastWidth, lastHeight });
                localStorage.setItem(storageKey, stateToSave);
            } catch (error) {
                console.error("Failed to save state:", error);
            }
        }
    }, [state, storageKey]);

    const handleFocus = useCallback(() => {
        onFocus(id); 
        setState(prev => ({ ...prev, isActive: true, isMinimized: false }));
    }, [id, onFocus]);

    const handleMinimize = useCallback(() => {
        setState(prev => ({ ...prev, isMinimized: true, isActive: false }));
    }, []);

    const handleMaximize = useCallback((e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setState(prev => {
            const screenWidth = window.innerWidth;
            const screenHeight = window.innerHeight - TASKBAR_HEIGHT;

            if (!prev.isMaximized) {
                return {
                    ...prev,
                    isMaximized: true,
                    lastX: prev.x,
                    lastY: prev.y,
                    lastWidth: prev.width,
                    lastHeight: prev.height,
                    x: 0,
                    y: 0,
                    width: screenWidth,
                    height: screenHeight // Occupies full height minus taskbar
                };
            }

            return {
                ...prev,
                isMaximized: false,
                x: prev.lastX,
                y: prev.lastY,
                width: prev.lastWidth,
                height: prev.lastHeight
            };
        });
    }, []);

    const handleClose = useCallback(() => onClose(id), [id, onClose]);

    const handleDragStart = useCallback((e: React.MouseEvent) => {
        if (e.button !== 0) return;
        handleFocus();

        let currentX = state.x;
        let currentY = state.y;
        let currentW = state.width;
        let currentH = state.height;

        let offsetX = e.clientX - state.x;
        let offsetY = e.clientY - state.y;

        if (state.isMaximized) {
            currentW = state.lastWidth;
            currentH = state.lastHeight;
            const ratio = e.clientX / state.width;
            currentX = e.clientX - currentW * ratio;
            currentY = 0;

            setState(prev => ({
                ...prev,
                isMaximized: false,
                width: currentW,
                height: currentH,
                x: currentX,
                y: currentY,
            }));

            offsetX = e.clientX - currentX;
            offsetY = e.clientY - currentY;
        }

        dragRef.current = { isDragging: true, offsetX, offsetY };
        e.preventDefault();
    }, [state, handleFocus]);

    const handleDrag = useCallback((e: MouseEvent) => {
        if (!dragRef.current.isDragging) return;
        setState(prev => ({
            ...prev,
            x: e.clientX - dragRef.current.offsetX,
            y: e.clientY - dragRef.current.offsetY
        }));
    }, []);

    const handleDragEnd = useCallback(() => {
        dragRef.current.isDragging = false;
        setState(prev => ({ ...prev, lastX: prev.x, lastY: prev.y }));
    }, []);

    const handleResizeStart = useCallback((e: React.MouseEvent, direction: string) => {
        if (e.button !== 0 || state.isMaximized) return;
        handleFocus();
        setResizeState({
            isResizing: true,
            direction,
            startX: e.clientX,
            startY: e.clientY,
            startW: state.width,
            startH: state.height
        });
        e.stopPropagation();
        e.preventDefault();
    }, [handleFocus, state.width, state.height, state.isMaximized]);

    const handleResize = useCallback((e: MouseEvent) => {
        if (!resizeState.isResizing || !resizeState.direction) return;

        const { direction, startX, startY, startW, startH } = resizeState;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        setState(prev => {
            let { x, y, width, height } = prev;
            if (direction.includes("top")) { height = Math.max(MIN_HEIGHT, startH - dy); y = startY + startH - height; }
            if (direction.includes("bottom")) { height = Math.max(MIN_HEIGHT, startH + dy); }
            if (direction.includes("left")) { width = Math.max(MIN_WIDTH, startW - dx); x = startX + startW - width; }
            if (direction.includes("right")) { width = Math.max(MIN_WIDTH, startW + dx); }
            return { ...prev, x, y, width, height };
        });
    }, [resizeState]);

    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => { handleDrag(e); handleResize(e); };
        const onMouseUp = () => { handleDragEnd(); setResizeState(prev => ({ ...prev, isResizing: false })); };
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
        return () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        };
    }, [handleDrag, handleDragEnd, handleResize]);

    if (state.isMinimized) return null;

    return (
        <div
            ref={windowRef}
            onMouseDown={handleFocus}
            className="fixed bg-white shadow-2xl flex flex-col border border-gray-300 overflow-hidden"
            style={{
                left: state.x,
                top: state.y,
                width: state.width,
                height: state.height,
                zIndex,
                borderRadius: state.isMaximized ? 0 : 10,
                cursor: dragRef.current.isDragging ? "grabbing" : "default",
                transition: (dragRef.current.isDragging || resizeState.isResizing) ? 'none' : 'all 0.2s cubic-bezier(0.2, 0, 0, 1)'
            }}>
            
            {/* Resizers */}
            {!state.isMaximized && ["top", "bottom", "left", "right", "top-left", "top-right", "bottom-left", "bottom-right"].map(dir => (
                <div
                    key={dir}
                    onMouseDown={(e) => handleResizeStart(e, dir)}
                    className="absolute z-50"
                    style={{
                        ...(dir === "top" && { top: 0, left: 5, right: 5, height: 5, cursor: "n-resize" }),
                        ...(dir === "bottom" && { bottom: 0, left: 5, right: 5, height: 5, cursor: "s-resize" }),
                        ...(dir === "left" && { left: 0, top: 5, bottom: 5, width: 5, cursor: "w-resize" }),
                        ...(dir === "right" && { right: 0, top: 5, bottom: 5, width: 5, cursor: "e-resize" }),
                        ...(dir === "top-left" && { top: 0, left: 0, width: 10, height: 10, cursor: "nwse-resize" }),
                        ...(dir === "top-right" && { top: 0, right: 0, width: 10, height: 10, cursor: "nesw-resize" }),
                        ...(dir === "bottom-left" && { bottom: 0, left: 0, width: 10, height: 10, cursor: "nesw-resize" }),
                        ...(dir === "bottom-right" && { bottom: 0, right: 0, width: 10, height: 10, cursor: "nwse-resize" })
                    }}
                />
            ))}

            {/* Title Bar */}
            <div
                className="shrink-0 flex items-center h-10 px-4 select-none bg-gray-50/80 backdrop-blur-md border-b border-gray-200"
                onMouseDown={handleDragStart}
                onDoubleClick={handleMaximize}>
                <div className="flex items-center gap-2 mr-4">
                    <button onClick={handleClose} className="w-3 h-3 rounded-full bg-[#ff5f57] hover:bg-[#ff5f57]/80 transition-colors"/>
                    <button onClick={handleMinimize} className="w-3 h-3 rounded-full bg-[#ffbd2e] hover:bg-[#ffbd2e]/80 transition-colors"/>
                    <button onClick={handleMaximize} className="w-3 h-3 rounded-full bg-[#28c940] hover:bg-[#28c940]/80 transition-colors"/>
                </div>
                <span className="text-sm font-semibold text-gray-600 truncate">{title}</span>
            </div>

            {/* Content Area */}
            <div className="grow overflow-auto bg-white relative">
                {children}
            </div>
        </div>
    );
};

export default WindowContainer;