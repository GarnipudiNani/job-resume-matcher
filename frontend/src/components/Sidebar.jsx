import { useState } from "react";
import "./Sidebar.css";

const MENU_ITEMS = [
  { id: "dashboard", icon: "▦", label: "Dashboard" },
  { id: "resumes", icon: "▤", label: "Resumes" },
  { id: "jobs", icon: "▣", label: "Job Descriptions" },
  { id: "matching", icon: "◉", label: "Resume Matching" },
  { id: "analytics", icon: "▥", label: "Analytics" },
];

function Sidebar({ activePage, setActivePage }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = (page) => {
    setActivePage(page);
    setMobileOpen(false);
  };

  return <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>
    <div className="sidebar-header">
      <div className="sidebar-logo"><h2>ResumeAI</h2><p>Recruitment Platform</p></div>
      <button type="button" className="mobile-menu-toggle" aria-label={mobileOpen ? "Close navigation" : "Open navigation"} aria-expanded={mobileOpen} onClick={() => setMobileOpen((open) => !open)}>{mobileOpen ? "Close" : "Menu"}</button>
    </div>
    <nav className="sidebar-nav" aria-label="Main navigation">
      <p className="nav-heading">MAIN MENU</p>
      {MENU_ITEMS.map((item) => <button type="button" key={item.id} aria-current={activePage === item.id ? "page" : undefined} className={`nav-link ${activePage === item.id ? "active" : ""}`} onClick={() => navigate(item.id)}><span aria-hidden="true">{item.icon}</span>{item.label}</button>)}
    </nav>
    <div className="sidebar-bottom"><button type="button" aria-current={activePage === "settings" ? "page" : undefined} className={`nav-link ${activePage === "settings" ? "active" : ""}`} onClick={() => navigate("settings")}><span aria-hidden="true">⚙</span>Settings</button></div>
  </aside>;
}

export default Sidebar;
