
import SimpleDock from "@/components/SimpleDock";
import { OSProvider } from "./context/OSContext";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body > 
        <OSProvider>
          {children} 
          <SimpleDock />
        </OSProvider>
      </body>
    </html>
  );
}