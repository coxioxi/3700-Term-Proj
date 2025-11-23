import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Import your pages
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import Dashboard from "../pages/dashboard";
import ViewSchedule from "../pages/view-schedule";
import Finances from "../pages/finances";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/view-schedule" element={<ViewSchedule />} />
        <Route path="/finances" element={<Finances />} />
      </Routes>
    </Router>
  );
}
