import { NavLink } from "react-router-dom";
import "../styles/Sidebar.css";

function Sidebar() {
  let user = {};

  try {
    user = JSON.parse(localStorage.getItem("user")) || {};
  } catch {
    user = {};
  }

  const role = user?.role || "Admin";

  const menuItems = {
    Admin: [
      { path: "/dashboard", name: "🏠 Dashboard" },
      { path: "/employee", name: "👨‍💼 Employee" },
      { path: "/sales", name: "📈 Sales" },
      { path: "/inventory", name: "📦 Inventory" },
      { path: "/finance", name: "💰 Finance" },
      { path: "/reports", name: "📊 Reports" },
      { path: "/ai", name: "🤖 AI Assistant" },
      { path: "/settings", name: "⚙️ Settings" },
    ],

    "HR Manager": [
      { path: "/dashboard", name: "🏠 Dashboard" },
      { path: "/employee", name: "👨‍💼 Employee" },
      { path: "/reports", name: "📊 Reports" },
      { path: "/ai", name: "🤖 AI Assistant" },
    ],

    "Sales Manager": [
      { path: "/dashboard", name: "🏠 Dashboard" },
      { path: "/sales", name: "📈 Sales" },
      { path: "/reports", name: "📊 Reports" },
      { path: "/ai", name: "🤖 AI Assistant" },
    ],

    "Inventory Manager": [
      { path: "/dashboard", name: "🏠 Dashboard" },
      { path: "/inventory", name: "📦 Inventory" },
      { path: "/purchases", name: "🛒 Purchases" },
      { path: "/reports", name: "📊 Reports" },
      { path: "/ai", name: "🤖 AI Assistant" },
    ],

    "Finance Manager": [
      { path: "/dashboard", name: "🏠 Dashboard" },
      { path: "/finance", name: "💰 Finance" },
      { path: "/reports", name: "📊 Reports" },
      { path: "/ai", name: "🤖 AI Assistant" },
    ],
  };

  const currentMenu = menuItems[role] || menuItems.Admin;

  return (
    <aside className="sidebar">
      <h3 className="sidebar-heading">MAIN MENU</h3>

      <nav className="sidebar-nav">
        {currentMenu.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            {item.name}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;