import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../components/supabase_client";
import '../styles/Home_Page.css';

// Import the separate page components
import ViewSchedule from "./view-schedule";
import Finances from "./finances";
import ImportSchedule from "./import-file";

export default function Dashboard() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activePage, setActivePage] = useState<"import" | "view" | "finances">("import");
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Logout function
  async function handleLogout() {
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) {
      alert("Error logging out: " + error.message);
    } else {
      navigate("/login");
    } 
  }

  // Render the active page
  const renderContent = () => {
    switch (activePage) {
      case "import":
        return <ImportSchedule />;
      case "view":
        return <ViewSchedule />;
      case "finances":
        return <Finances />;
      default:
        return null;
    }
  };

  return (
    <div className="dashboard-container">
      {/* Top Navbar */}
      <div className="navbar">
        <div className="nav-left">
          <h2>Dashboard</h2>
        </div>
        <div className="nav-center">
          <button onClick={() => setActivePage("import")} className={activePage === "import" ? "active" : ""}>
            Import Schedule
          </button>
          <button onClick={() => setActivePage("view")} className={activePage === "view" ? "active" : ""}>
            View Schedule
          </button>
          <button onClick={() => setActivePage("finances")} className={activePage === "finances" ? "active" : ""}>
            Finances
          </button>
        </div>
        <div className="profile-menu" ref={menuRef}>
          <button 
            className="profile-button" 
            onClick={() => setDropdownOpen(prev => !prev)}
          >
            Profile
          </button>
          {dropdownOpen && (
            <div className="dropdown-content">
              <button onClick={handleLogout}>Logout</button>
            </div>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="dashboard-content">
        {renderContent()}
      </div>
    </div>
  );
}
