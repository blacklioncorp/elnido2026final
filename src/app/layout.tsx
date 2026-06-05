import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "El Nido — Santuario de Fauna Mexicana",
  description: "Santuario de conservación de fauna mexicana en peligro de extinción. Apadrina una especie y sé parte del cambio.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-forest-green-dark text-off-white`}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1A4A3A',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#F7F3E8',
            },
          }}
        />
      </body>
    </html>
  );
}
