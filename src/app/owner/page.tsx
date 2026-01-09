"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation"; 

const MicaStyle: React.CSSProperties = {
    backdropFilter: "blur(30px) saturate(150%)",
    WebkitBackdropFilter: "blur(30px) saturate(150%)", 
    backgroundColor: "rgba(255, 255, 255, 0.15)", 
    border: "1px solid rgba(255, 255, 255, 0.1)",
};

export default function OwnerLoginScreen() {
    const [username, setUsername] = useState("peter.admin");
    const [password, setPassword] = useState("");
    const router = useRouter(); 

    const handleSignIn = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (username === "peter.admin" && password === "demo") { 
            alert("Sign In Successful! Navigating to Dashboard.");
            router.push("/dashboard"); 
        } else {
            alert("Invalid credentials.");
        }
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden font-sans text-white">
            <Image
                src="/main_bg.jpg" 
                alt="Windows 11 Style Background"
                fill
                style={{ objectFit: "cover" }}
                quality={100}
                priority
                className="z-0"/>
            <header className="absolute top-0 left-0 right-0 p-4 z-10 flex items-center justify-between">
                <Image
                    src="/main_logo.png" 
                    alt="Peter Developer Logo"
                    width={200}
                    height={100}/>
            </header>

            {/* Login Card */}
            <div 
                style={MicaStyle} 
                className="z-10 w-[420px] rounded shadow-2xl p-8 transform transition-all duration-300 flex flex-col items-center">            
                <h2 className="text-2xl font-semibold mb-6">Peter Developer</h2>
                <div className="w-28 h-28 rounded-full bg-white flex items-center justify-center mb-6 border-2 border-white/70">
                    <Image
                        src="/owner_image.png" 
                        alt="Peter Developer Logo"
                        width={200}
                        height={200}/>
                </div>

                <form onSubmit={handleSignIn} className="w-full flex flex-col gap-4">
                    
                    <label className="text-sm font-medium text-white/90">Username</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Username"
                        required
                        className="w-full px-4 py-2 bg-white/10 rounded text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400 focus:outline-none transition-colors"/>

                    <label className="text-sm font-medium text-white/90">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        required
                        className="w-full px-4 py-2 bg-white/10 rounded text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400 focus:outline-none transition-colors"/>

                    <div className="flex flex-row gap-4 justify-between items-center mt-2">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="text-sm text-white/70 hover:text-white transition-colors">
                            Go Back
                        </button>

                        <button
                            type="submit"
                            className="px-6 py-2 bg-blue-600 rounded font-medium hover:bg-blue-700 transition-colors shadow-md">
                            Sign In
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
