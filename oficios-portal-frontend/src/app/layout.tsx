import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuthSupabase";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "n.Oficios | ness.",
  description: "Plataforma de automação jurídica com conformidade LGPD total",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}