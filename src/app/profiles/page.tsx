"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation"; 
import Taskbar from "@/components/Taskbar";

const MicaStyle = {
    backdropFilter: 'blur(30px) saturate(150%)',
    WebkitBackdropFilter: 'blur(30px) saturate(150%)',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    border: '1px solid rgba(255, 255, 255, 0.1)', 
};

export default function LoginScreen() {

    const [isOwnerActive, setIsOwnerActive] = useState(true);
    const router = useRouter();
    const GUEST_PATH = "/home";
    const OWNER_PATH = "/owner";


    const handleGuestClick = () => {
        setIsOwnerActive(false);
        alert(`Navigating to Guest Mode at: ${GUEST_PATH}`);
        router.push(GUEST_PATH);
    };
    
    const handleOwnerClick = () => {
        setIsOwnerActive(true);
        router.push(OWNER_PATH);
    };

    const apps = [
        { name: "Explorer", iconSrc: "/explorer_icon.png", onClick: () => alert("Explorer clicked") },
        { name: "Settings", iconSrc: "/settings_icon.png", onClick: () => alert("Settings clicked") },
        { name: "Terminal", iconSrc: "/terminal_icon.png", onClick: () => alert("Terminal clicked") },
    ];
    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden font-sans text-white">
            <Image
                src="/main_bg.jpg" 
                alt="Windows 11 Style Background"
                fill
                style={{ objectFit: "cover" }}
                quality={100}
                priority
                className="z-0"
            />

            <header className="absolute top-0 left-0 right-0 p-4 z-10 flex items-center justify-between">
                <Image
                    src="/main_logo.png" 
                    alt="Peter Developer Logo"
                    width={200}
                    height={100}
                />
            </header>

            <div 
                style={MicaStyle} 
                className="z-10 w-[550px] rounded shadow-2xl p-8 transform transition-all duration-300">
                <div className="w-full flex items-center pb-4 justify-center">
                    <h1 className="text-3xl font-bold">Choose a profile</h1>
                </div>
                <div className="flex justify-around items-start pt-4 pb-2">
                    <div 
                        onClick={handleGuestClick} 
                        className={`flex flex-col items-center w-48 p-4 rounded cursor-pointer transition-all duration-200 ${!isOwnerActive ? 'bg-white/10 ring-2 ring-blue-500' : 'hover:bg-white/5'}`}>
                        <div className="w-24 h-24 rounded-full border-2 border-white/50 flex items-center justify-center mb-3">
                        <svg className="w-12 h-12 text-white/80" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                        </div>
                        <h2 className="text-xl font-semibold">Guest Mode</h2>
                        <p className="text-sm text-white/70">Read-Only Access</p>
                    </div>
                    <div 
                        onClick={handleOwnerClick} 
                        className={`flex flex-col items-center w-48 p-4 rounded cursor-pointer transition-all duration-200 ${isOwnerActive ? 'bg-white/10 ring-2 ring-blue-500' : 'hover:bg-white/5'}`}>
                        <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center mb-3">
                        <Image
                            src="/owner_image.png" 
                            alt="Peter Developer Logo"
                            width={100}
                            height={100}
                        />
                        </div>
                        <h2 className="text-xl font-semibold">Peter Developer</h2>
                        <p className="text-sm text-white/70">Owner Mode</p>
                    </div>
                </div>
            </div>
        </div>
    );
}