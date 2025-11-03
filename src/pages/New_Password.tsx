import React, { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../components/supabase_client";
import '../styles/Login_Signup.css';

export default function Gate() {
  const [password, setPassword] = useState("");
    const [repeatPassword, setRepeatPassword] = useState("");
  
  async function handleResetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    if (password !== repeatPassword) {
      alert("Passwords do not match!");
      return;
    }

    // Reset password logic goes here
    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      alert("Error resetting password: " + (error.message ?? "Unknown error"));
    }
  }

  return (
    <div className="wrapper">
      <h1>Recover Password</h1>
      <h2>Please enter your new password</h2>
      <form onSubmit={handleResetPassword}>
        {/* Password */}
        <div>
          <label htmlFor="password"></label>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            className="bi bi-lock-fill"
            viewBox="0 0 16 16"
          >
            <path d="M2.5 9a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2V9zm8-3V4a3 3 0 0 0-6 0v2h6z" />
          </svg>
          <input
            type="password"
            id="password"
            name="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {/* Repeat Password */}
        <div>
          <label htmlFor="repeat-password"></label>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            className="bi bi-lock-fill"
            viewBox="0 0 16 16"
          >
            <path d="M2.5 9a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2V9zm8-3V4a3 3 0 0 0-6 0v2h6z" />
          </svg>
          <input
            type="password"
            id="repeat-password"
            name="repeat-password"
            placeholder="Repeat Password"
            value={repeatPassword}
            onChange={(e) => setRepeatPassword(e.target.value)}
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
