import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { ClientToaster } from "@/components/ui/ClientToaster";

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#7d525f",
};

export const metadata: Metadata = {
  title: "Agenda Inteligente — Sistema de Gestão para Clínicas e Consultórios",
  description:
    "Agenda, financeiro, estoque, anamnese digital, marketing e gestão de equipe em uma única plataforma. Teste grátis por 7 dias.",
  keywords: [
    "agenda para clínica",
    "sistema para clínica",
    "gestão de clínica",
    "agendamento online",
    "prontuário eletrônico",
    "anamnese digital",
    "controle financeiro clínica",
    "software para consultório",
  ],
  openGraph: {
    title: "Agenda Inteligente — Gestão Completa para Clínicas",
    description:
      "Transforme sua clínica em uma máquina de agendamentos e faturamento. Teste grátis.",
    type: "website",
    locale: "pt_BR",
    siteName: "Agenda Inteligente",
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/images/logo_icon.png",
    shortcut: "/images/logo_icon.png",
    apple: "/images/logo_icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Agenda Inteligente",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="scroll-smooth" suppressHydrationWarning>
      <body
        className={`${playfairDisplay.variable} ${inter.variable} font-sans antialiased`}
      >
        {children}
        <ClientToaster />
      </body>
    </html>
  );
}
