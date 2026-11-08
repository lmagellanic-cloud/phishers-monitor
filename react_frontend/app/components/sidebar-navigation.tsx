import { useState } from "react";
import { Form, Link, useLocation } from "react-router";

const navigationItems = [
  { label: "Usuarios", to: "/" },
  { label: "Archivos", to: "/files" },
  { label: "Vídeos", to: "/videos" },
  { label: "Galería", to: "/gallery" },
];

export function SidebarNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const { pathname } = useLocation();

  return (
    <>
      <button
        className="sidebar-toggle"
        type="button"
        aria-label={isOpen ? "Cerrar navegación" : "Abrir navegación"}
        aria-controls="app-sidebar"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className="sidebar-toggle-icon" aria-hidden="true">
          <span /><span /><span />
        </span>
      </button>
      {isOpen && (
        <>
          <button
            className="sidebar-backdrop"
            type="button"
            aria-label="Cerrar navegación"
            onClick={() => setIsOpen(false)}
          />
          <aside className="sidebar-drawer" id="app-sidebar" aria-label="Navegación principal">
            <div className="sidebar-heading">
              <span className="sidebar-brand-mark" aria-hidden="true">PM</span>
              <span className="sidebar-brand-name">
                Phishers Monitor
                <small>Almacenamiento multimedia</small>
              </span>
              <button
                className="sidebar-close"
                type="button"
                aria-label="Cerrar navegación"
                onClick={() => setIsOpen(false)}
              >
                ×
              </button>
            </div>
            <nav className="sidebar-links">
              {navigationItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={pathname === item.to ? "page" : undefined}
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="sidebar-footer">
              <Form action="/logout" method="post">
                <button className="sidebar-logout" type="submit">Cerrar sesión</button>
              </Form>
            </div>
          </aside>
        </>
      )}
    </>
  );
}