import { useState } from "react";
import { Form, Link, useLocation } from "react-router";

const navigationItems = [
  { label: "Usuarios", to: "/" },
  { label: "Usuarios de Django", to: "/users" },
  {
    label: "Archivos",
    children: [
      { label: "Todos los archivos", to: "/files" },
      { label: "Vídeos", to: "/videos" },
      { label: "Galería", to: "/gallery" },
    ],
  },
];

export function SidebarNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
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
                item.children ? (
                  <div className="sidebar-nav-group" key={item.label}>
                    <button
                      className={`sidebar-nav-group-toggle${item.children.some((child) =>
                        pathname === child.to || pathname.startsWith(`${child.to}/`)
                      ) ? " is-active" : ""}`}
                      type="button"
                      aria-expanded={expandedItem === item.label}
                      aria-controls="sidebar-files-submenu"
                      onClick={() => setExpandedItem((expanded) =>
                        expanded === item.label ? null : item.label
                      )}
                    >
                      {item.label}
                      <span
                        className={`sidebar-nav-chevron${expandedItem === item.label ? " is-expanded" : ""}`}
                        aria-hidden="true"
                      >
                        ⌄
                      </span>
                    </button>
                    <div
                      className="sidebar-submenu"
                      id="sidebar-files-submenu"
                      hidden={expandedItem !== item.label}
                    >
                      {item.children.map((child) => (
                        <Link
                          key={child.to}
                          to={child.to}
                          aria-current={pathname === child.to ? "page" : undefined}
                          onClick={() => setIsOpen(false)}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Link
                    key={item.to}
                    to={item.to}
                    aria-current={pathname === item.to ? "page" : undefined}
                    onClick={() => setIsOpen(false)}
                  >
                    {item.label}
                  </Link>
                )
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