import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import '../styles/Login_Signup.css';

export default function Gate() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); // optional if you want to verify current password
  const navigate = useNavigate();

  async function handleCheckAndReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!email) {
      alert("Please enter your email.");
      return;
    }

    try {
      // Call backend to check if user exists
      const res = await fetch("http://localhost:5000/check-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: "" }) // empty password just to validate email exists
      });

      const data = await res.json();

      if (!data.valid) {
        alert("No account found with that email.");
        return;
      }

      // Navigate to New Password page, passing email as state
      navigate("/New_Password", { state: { email } });

    } catch (err) {
      console.error(err);
      alert("Server error. Please try again later.");
    }
  }

  return (
    <div className="wrapper">
      <h1>Recover Password</h1>
      <h2>Please enter your email address below to reset your password.</h2>
      <form onSubmit={handleCheckAndReset}>
        <div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            className="bi bi-envelope-fill"
            viewBox="0 0 16 16"
          >
            <path d="M.05 3.555A2 2 0 0 1 2 2h12a2 2 0 0 1 1.95 1.555L8 8.414.05 3.555zM0 4.697v7.104l5.803-3.558L0 4.697zm6.761 3.396L16 11.801V4.697l-9.239 6.396zm-.761.577L0 12.601A2 2 0 0 0 2 14h12a2 2 0 0 0 2-1.399l-7.761-4.928z" />
          </svg>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <button type="submit">Reset My Password</button>
      </form>

      <p>
        Don’t have an account? <Link to="/signup">Sign Up</Link>
      </p>
      <p>
        Already have an account? <Link to="/login">Log In</Link>
      </p>
    </div>
  );
}
