import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { supabase } from "../components/supabase_client";
import '../styles/Login_Signup.css';

export default function Gate() {
  const [email, setEmail] = useState("");
  
  async function handleResetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    // Reset password logic goes here
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/New_Password`,
    });

    alert("If an account with that email exists, you'll receive a password reset link.");
  }

  return (
    <div className="wrapper">
      <h1>Recover Password</h1>
      <h2>Please enter your email address below and we will send you a confirmation email.</h2>
      <form onSubmit={handleResetPassword}>
        {/* Email field */}
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
