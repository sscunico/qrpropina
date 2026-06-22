"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Database,
  DollarSign,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  QrCode,
  ScrollText,
  Settings,
  User,
  Users,
  Wallet,
  X
} from "lucide-react";
import { GoogleIcon } from "@/components/GoogleIcon";
import { LogoMark } from "@/components/LogoMark";

type Session = {
  userId: string;
  email: string;
  role: "admin" | "creator";
  creatorId?: string | null;
  name?: string;
  picture?: string;
};

type MenuItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  match?: "exact" | "startsWith" | "none";
};

type MenuSection = {
  title?: string;
  items: MenuItem[];
};

type Props = {
  appName: string;
  session: Session | null;
  showMercadoPagoIntegration?: boolean;
  unreadCount?: number;
};

const googleLoginHref = "/api/auth/google/start?next=%2Fadmin";

function initials(value: string) {
  return value
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function ProfileAvatar({ className, label, picture }: { className: string; label: string; picture?: string }) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(picture && !failed);

  return (
    <div aria-label={label} className={className} title={label}>
      {showImage ? (
        <img alt="" decoding="async" referrerPolicy="no-referrer" src={picture} onError={() => setFailed(true)} />
      ) : (
        <span>{initials(label)}</span>
      )}
    </div>
  );
}

function isTipRoute(pathname: string) {
  return pathname.startsWith("/t/") || pathname.startsWith("/q/");
}

export function AppNavigation({ appName, session, showMercadoPagoIntegration = true, unreadCount = 0 }: Props) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  if (isTipRoute(pathname)) {
    return null;
  }

  const [currentSection, setCurrentSection] = useState("qrs");
  const showDot = unreadCount > 0 && pathname !== "/admin/notificaciones";
  const profileLabel = session?.name || session?.email || "Invitado";

  useEffect(() => {
    document.body.classList.toggle("drawer-open", isOpen);
    return () => document.body.classList.remove("drawer-open");
  }, [isOpen]);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    function syncSection() {
      setCurrentSection(new URLSearchParams(window.location.search).get("section") || "qrs");
    }

    syncSection();
    window.addEventListener("popstate", syncSection);
    return () => window.removeEventListener("popstate", syncSection);
  }, [pathname]);

  useEffect(() => {
    if (!session) {
      setIsOpen(false);
    }
  }, [session]);

  useEffect(() => {
    function closeWithEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", closeWithEscape);
    return () => window.removeEventListener("keydown", closeWithEscape);
  }, []);

  const sections = useMemo<MenuSection[]>(() => {
    if (!session) {
      return [];
    }

    if (session.role === "creator") {
      const creatorHref = session.creatorId ? `/admin/creadores/${session.creatorId}` : "/admin";

      return [
        {
          items: [
            { href: "/", label: "Inicio", icon: <Home size={18} />, match: "exact" },
            { href: `${creatorHref}?section=qrs`, label: "Mi QR", icon: <QrCode size={18} />, match: "startsWith" },
            { href: `${creatorHref}?section=perfil`, label: "Mi perfil", icon: <User size={18} />, match: "startsWith" }
          ]
        },
        ...(showMercadoPagoIntegration
          ? [
              {
                title: "Monetización",
                items: [
                  { href: `${creatorHref}?section=propinas`, label: "Propinas", icon: <DollarSign size={18} />, match: "startsWith" as const },
                  { href: `${creatorHref}?section=mercadopago`, label: "Mercado Pago", icon: <Wallet size={18} />, match: "startsWith" as const },
                  { href: "/admin/notificaciones", label: "Notificaciones", icon: <Bell size={18} />, match: "startsWith" as const }
                ]
              }
            ]
          : [])
      ];
    }

    return [
      {
        items: [
          { href: "/", label: "Inicio", icon: <Home size={18} />, match: "exact" },
          { href: "/admin", label: "Panel de control", icon: <LayoutDashboard size={18} />, match: "exact" },
          { href: "/admin/creadores", label: "Creadores", icon: <Users size={18} />, match: "startsWith" }
        ]
      },
      ...(showMercadoPagoIntegration
        ? [
            {
              title: "Monetización",
              items: [
                { href: "/admin", label: "Propinas", icon: <DollarSign size={18} />, match: "none" as const }
              ]
            }
          ]
        : []),
      {
        title: "Herramientas",
        items: [
          { href: "/admin/datos", label: "Datos", icon: <Database size={18} />, match: "startsWith" },
          { href: "/admin/logs", label: "Logs", icon: <ScrollText size={18} />, match: "startsWith" },
          { href: "/admin/notificaciones", label: "Notificaciones", icon: <Bell size={18} />, match: "startsWith" }
        ]
      },
      {
        title: "Configuración",
        items: [{ href: "/admin/ajustes", label: "Ajustes", icon: <Settings size={18} />, match: "startsWith" }]
      }
    ];
  }, [session, showMercadoPagoIntegration]);

  function isActive(item: MenuItem) {
    if (item.match === "none") return false;
    if (item.match === "exact") return pathname === item.href;

    const [pathWithQuery] = item.href.split("#");
    const [path, query = ""] = pathWithQuery.split("?");
    const expectedSection = new URLSearchParams(query).get("section");

    if (expectedSection) {
      return pathname === path && currentSection === expectedSection;
    }

    return path !== "/" && pathname.startsWith(path);
  }

  function getSectionFromHref(href: string) {
    const [pathWithQuery] = href.split("#");
    const [, query = ""] = pathWithQuery.split("?");
    return new URLSearchParams(query).get("section");
  }

  return (
    <>
      <header className="topbar">
        <Link className="brand" href="/">
          <span className="brand-mark"><LogoMark className="brand-logo" /></span>
          <span>{appName}</span>
        </Link>

        <nav className="topnav" aria-label="Navegación principal">
          <Link className={pathname === "/" ? "topnav-link active" : "topnav-link"} href="/">Inicio</Link>
          {session ? (
            <Link
              className={pathname.startsWith("/admin") ? "topnav-link active" : "topnav-link"}
              href={session.role === "creator" && session.creatorId ? `/admin/creadores/${session.creatorId}` : "/admin"}
            >
              Admin
            </Link>
          ) : null}
        </nav>

        <div className="topbar-actions">
          {session ? (
            <>
              <Link className="icon-button ghost bell-btn" href="/admin/notificaciones" title="Notificaciones">
                <span className="bell-wrapper">
                  <Bell size={19} />
                  {showDot ? <span className="bell-dot" /> : null}
                </span>
              </Link>
              <ProfileAvatar className="top-profile" label={profileLabel} picture={session.picture} />
            </>
          ) : (
            <>
              <Link className={pathname === "/login" ? "topbar-login active" : "topbar-login"} href={googleLoginHref}>
                <GoogleIcon size={18} />
                Iniciar sesión
              </Link>
              <Link className="topbar-join" href={googleLoginHref}>Unirse ahora</Link>
            </>
          )}
          {session ? (
            <button
              aria-expanded={isOpen}
              aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
              className="icon-button burger-button"
              onClick={() => setIsOpen((value) => !value)}
              type="button"
            >
              <Menu size={22} />
            </button>
          ) : null}
        </div>
      </header>

      {session ? <div className={isOpen ? "drawer-backdrop show" : "drawer-backdrop"} onClick={() => setIsOpen(false)} /> : null}
      {session ? (
        <aside aria-label="Menu lateral" aria-modal={isOpen} className={isOpen ? "side-drawer show" : "side-drawer"} role="dialog">
          <div className="drawer-head drawer-head-plain">
            <button className="icon-button ghost" onClick={() => setIsOpen(false)} title="Cerrar menú" type="button"><X size={22} /></button>
          </div>

          <div className="drawer-profile">
            <ProfileAvatar className="drawer-profile-avatar" label={profileLabel} picture={session.picture} />
            <div className="drawer-profile-meta">
              <strong>{profileLabel}</strong>
              <span>{session.email}</span>
            </div>
          </div>

          <nav className="drawer-nav" aria-label="Menu de qrpropina">
            {sections.map((section, sectionIndex) => (
              <div className="drawer-section" key={section.title || sectionIndex}>
                {section.title ? <p className="drawer-section-title">{section.title}</p> : null}
                {section.items.map((item) => (
                  <Link
                    className={isActive(item) ? "drawer-link active" : "drawer-link"}
                    href={item.href}
                    key={`${section.title || "main"}-${item.label}`}
                    onClick={() => {
                      const nextSection = getSectionFromHref(item.href);
                      if (nextSection) setCurrentSection(nextSection);
                      setIsOpen(false);
                    }}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            ))}

            <form action="/api/auth/logout" className="drawer-logout" method="post">
              <button className="drawer-link" type="submit"><LogOut size={18} /><span>Salir</span></button>
            </form>
          </nav>
        </aside>
      ) : null}
    </>
  );
}
