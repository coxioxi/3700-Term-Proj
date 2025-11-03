import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { supabase } from "../components/supabase_client";
import '../styles/Login_Signup.css'

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  async function handleLogin (e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    console.log("Logging in with:", { email, password });
    // Attempt to sign in with Supabase
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert("Error logging in: " + error.message);
    } else {
      alert("Login successful!");
      navigate("/dashboard");
    }
  };

  return (
    <div className="wrapper">
      <h1>Login</h1>
      <form onSubmit={handleLogin}>
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

        {/* Password field */}
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

        <button type="submit">Login</button>
      </form>

      <p>
        Don’t have an account? <Link to="/signup">Sign Up</Link>
      </p>
      <p>
        Forgot your password? <Link to="/reset_password">Reset Password</Link>
      </p>
    </div>
  );
}
