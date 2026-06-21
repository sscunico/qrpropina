import type { Metadata } from "next";
import { Nunito_Sans } from "next/font/google";
import { AppNavigation } from "@/components/AppNavigation";
import { LegalFooter } from "@/components/LegalFooter";
import { RouteChangeSpinner } from "@/components/RouteChangeSpinner";
import { getAdminSession } from "@/lib/auth";
import { countUnreadNotificationsForCreator, getAppSettings } from "@/lib/db";
import { appName } from "@/lib/env";
import "./globals.css";

const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-app",
  weight: ["400", "500", "600", "700", "800", "900"]
});

export const metadata: Metadata = {
  title: appName(),
  description: "qrpropina: propinas por QR con Mercado Pago"
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getAdminSession();
  const unreadCount =
    session?.role === "creator" && session.creatorId
      ? await countUnreadNotificationsForCreator(session.creatorId)
      : 0;
  const settings = await getAppSettings();

  return (
    <html lang="es-AR" className={nunitoSans.variable}>
      <body>
        <div className="app-shell">
          <RouteChangeSpinner />
          <AppNavigation
            appName={appName()}
            showMercadoPagoIntegration={settings.showMercadoPagoIntegration}
            unreadCount={unreadCount}
            session={
              session
                ? {
                    userId: session.userId,
                    email: session.email,
                    role: session.role,
                    creatorId: session.creatorId,
                    name: session.name,
                    picture: session.picture
                  }
                : null
            }
          />
          {children}
          <LegalFooter />
        </div>
      </body>
    </html>
  );
}
