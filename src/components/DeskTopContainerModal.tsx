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
    id: number;
    title: string;
    onClose: (id: number) => void;
    onFocus: (id: number) => void; // Key for Z-index update in parent
    children: React.ReactNode;
    initialState?: Partial<WindowState>;
    zIndex: number; // Controlled by the parent component
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
    zIndex
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

        const initialW = Math.min(defaultWidth, screenWidth * 0.8);
        const initialH = Math.min(defaultHeight, screenHeight * 0.8);
        const initialX = (screenWidth - initialW) / 2;
        const initialY = (screenHeight - initialH) / 2;

        let loadedState: Partial<WindowState> = {};

        try {
            const savedState = localStorage.getItem(storageKey);
            if (savedState) {
                loadedState = JSON.parse(savedState);
            }
        } catch (error) {
            console.error("Failed to load state from local storage:", error);
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

        if (finalState.isMaximized) {
            finalState.x = 0;
            finalState.y = 0;
            finalState.width = screenWidth;
            finalState.height = screenHeight;
        }

        return finalState;
    }, [initialState, storageKey]);

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
                console.error("Failed to save state to local storage:", error);
            }
        }
    }, [state, storageKey]);

    // --- Handlers ---

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
                    height: screenHeight
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

        let newX = state.x;
        let newY = state.y;
        let newWidth = state.width;
        let newHeight = state.height;

        let offsetX = e.clientX - state.x;
        let offsetY = e.clientY - state.y;

        if (state.isMaximized) {
            newWidth = state.lastWidth;
            newHeight = state.lastHeight;

            const ratio = e.clientX / state.width;

            newX = e.clientX - newWidth * ratio;
            newY = 0;

            setState(prev => ({
                ...prev,
                isMaximized: false,
                width: newWidth,
                height: newHeight,
                x: newX,
                y: newY,
                lastX: newX,
                lastY: newY,
                lastWidth: newWidth,
                lastHeight: newHeight,
            }));

            offsetX = e.clientX - newX;
            offsetY = e.clientY - newY;
        }

        dragRef.current = { isDragging: true, offsetX, offsetY };
        e.preventDefault();

        if (windowRef.current) {
            windowRef.current.style.transition = 'none';
        }
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
        dragRef.current = { isDragging: false, offsetX: 0, offsetY: 0 };
        setState(prev => ({ ...prev, lastX: prev.x, lastY: prev.y }));

        if (windowRef.current) {
            windowRef.current.style.transition = '';
        }
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

        let { x, y, width, height } = state;
        const { direction, startX, startY, startW, startH } = resizeState;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        if (direction.includes("top")) { height = Math.max(MIN_HEIGHT, startH - dy); y = startY + startH - height; }
        if (direction.includes("bottom")) { height = Math.max(MIN_HEIGHT, startH + dy); }
        if (direction.includes("left")) { width = Math.max(MIN_WIDTH, startW - dx); x = startX + startW - width; }
        if (direction.includes("right")) { width = Math.max(MIN_WIDTH, startW + dx); }

        setState(prev => ({ ...prev, x, y, width, height }));
    }, [resizeState, state]);

    const handleResizeEnd = useCallback(() => {
        setResizeState({ isResizing: false, direction: null, startX: 0, startY: 0, startW: 0, startH: 0 });
        setState(prev => ({ ...prev, lastWidth: prev.width, lastHeight: prev.height, lastX: prev.x, lastY: prev.y }));
    }, []);

    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => { handleDrag(e); handleResize(e); };
        const onMouseUp = () => { handleDragEnd(); handleResizeEnd(); };
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
        return () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        };
    }, [handleDrag, handleDragEnd, handleResize, handleResizeEnd]);

    if (state.isMinimized) return null;

    const borderRadius = state.isMaximized ? 0 : 8;

    return (
        <div
            ref={windowRef}
            onMouseDown={handleFocus}
            className="fixed bg-white shadow-2xl flex flex-col border border-gray-300 transition-all"
            style={{
                left: state.x,
                top: state.y,
                width: state.width,
                height: state.height,
                zIndex,
                borderRadius,
                cursor: dragRef.current.isDragging ? "grabbing" : "default",
                transition: dragRef.current.isDragging ? 'none' : 'all 0.1s ease-out'
            }}>
            {!state.isMaximized &&
                ["top-left", "top", "top-right", "left", "right", "bottom-left", "bottom", "bottom-right"].map(dir => (
                    <div
                        key={dir}
                        onMouseDown={(e) => handleResizeStart(e, dir)}
                        className="absolute z-20"
                        style={{
                            ...(dir === "top" && { top: -4, left: 8, right: 8, height: 8, cursor: "n-resize" }),
                            ...(dir === "bottom" && { bottom: -4, left: 8, right: 8, height: 8, cursor: "s-resize" }),
                            ...(dir === "left" && { left: -4, top: 8, bottom: 8, width: 8, cursor: "w-resize" }),
                            ...(dir === "right" && { right: -4, top: 8, bottom: 8, width: 8, cursor: "e-resize" }),
                            ...(dir === "top-left" && { top: -6, left: -6, width: 12, height: 12, cursor: "nwse-resize" }),
                            ...(dir === "top-right" && { top: -6, right: -6, width: 12, height: 12, cursor: "nesw-resize" }),
                            ...(dir === "bottom-left" && { bottom: -6, left: -6, width: 12, height: 12, cursor: "nesw-resize" }),
                            ...(dir === "bottom-right" && { bottom: -6, right: -6, width: 12, height: 12, cursor: "nwse-resize" })
                        }}
                    />
                ))
            }

            <div
                className="shrink-0 flex items-center h-9 px-3 select-none bg-gray-100 border-b border-gray-300"
                onMouseDown={handleDragStart}
                style={{ cursor: "default", borderTopLeftRadius: borderRadius, borderTopRightRadius: borderRadius }}>
                <div className="flex items-center gap-2">
                    <button onClick={handleClose} className="w-3.5 h-3.5 rounded-full bg-[#ff5f57] border border-[#cc4c48] hover:brightness-110"/>
                    <button onClick={handleMinimize} className="w-3.5 h-3.5 rounded-full bg-[#ffbd2e] border border-[#a07b2b] hover:brightness-110"/>
                    <button onClick={handleMaximize} className="w-3.5 h-3.5 rounded-full bg-[#28c940] border border-[#1f7b2f] hover:brightness-110"/>
                    <span className="ml-2 font-medium text-gray-700">{title}</span>
                </div>
            </div>

            <div className="grow p-4 overflow-auto text-black" onMouseDown={(e) =>{
                    handleFocus();
                    e.stopPropagation()
                }}>
                {children}
            </div>
        </div>
    );
};

export default WindowContainer;
