import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import Footer from "@/components/Footer";
import Script from "next/script";
import FCMInitializer from "@/components/FCMInitializer";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: "n.Oficios - Automação Jurídica Inteligente",
  description: "Plataforma cognitiva de automação de ofícios legais com conformidade LGPD total",
};

// Garante que o Script com window.__ENV seja renderizado em tempo de execução,
// lendo process.env do ambiente do Cloud Run (evita valores vazios de build time)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${montserrat.variable} font-sans antialiased flex flex-col min-h-screen bg-background text-foreground`}>
        <Script id="runtime-env" strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `window.__ENV = {
  NEXT_PUBLIC_FIREBASE_API_KEY: ${JSON.stringify(process.env["NEXT_PUBLIC_FIREBASE_API_KEY"] || '')},
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: ${JSON.stringify(process.env["NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"] || '')},
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: ${JSON.stringify(process.env["NEXT_PUBLIC_FIREBASE_PROJECT_ID"] || '')},
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: ${JSON.stringify(process.env["NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"] || '')},
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: ${JSON.stringify(process.env["NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"] || '')},
  NEXT_PUBLIC_FIREBASE_APP_ID: ${JSON.stringify(process.env["NEXT_PUBLIC_FIREBASE_APP_ID"] || '')},
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: ${JSON.stringify(process.env["NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID"] || '')},
  NEXT_PUBLIC_API_BASE_URL: ${JSON.stringify(process.env["NEXT_PUBLIC_API_BASE_URL"] || '')},
  NEXT_PUBLIC_FCM_VAPID_KEY: ${JSON.stringify(process.env["NEXT_PUBLIC_FCM_VAPID_KEY"] || '')},
  NEXT_PUBLIC_FIREBASE_API_KEY_DEV: ${JSON.stringify(process.env["NEXT_PUBLIC_FIREBASE_API_KEY_DEV"] || '')}
};`,
          }}
        />
        <AuthProvider>
          <FCMInitializer />
          <div className="flex-1">
            {children}
          </div>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
