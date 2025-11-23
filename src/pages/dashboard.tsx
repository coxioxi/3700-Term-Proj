import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import '../styles/Home_Page.css';

// Import the separate page components
import ViewSchedule from "./view-schedule";
import Finances from "./finances";
import type React from "react";

export default function Dashboard() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activePage, setActivePage] = useState< "view" | "finances">("view");
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("No file chosen");

  function handleFileSelect() {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setFileName(file.name);

    const formData = new FormData();
    formData.append("file", file);

    const token = localStorage.getItem("token");  // GET JWT

    if (!token) {
      alert("You must be logged in to upload.");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/upload-xlsx", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`  // SEND JWT TO BACKEND
        },
        body: formData,
      });

      const data = await res.json();
      alert(data.message);
    } catch (err) {
      console.error(err);
      alert("Upload failed!");
    }
  }

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
  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("companyID");

    navigate("/login");
  }

  // Render the active page
  const renderContent = () => {
  switch (activePage) {
    case "view":
      return <ViewSchedule selectedFile={fileName !== "No file chosen" ? fileName : null} />;
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
          <button onClick={handleFileSelect}>
            Import Schedule
          </button>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            accept=".xlsx"
            onChange={handleFileChange}
          />
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
