import React from "react";
import { useNavigate } from "react-router-dom";
import '../Login_Signup.css';

export default function Gate() {
  const navigate = useNavigate();

  return (
    <div className="wrapper">
      <h1>Welcome, Join Today!</h1>

      <button onClick={() => navigate("/signup")}>
        Create an Account
      </button>

      <h2>Already have an account?</h2>

      <button onClick={() => navigate("/login")}>
        Log In
      </button>
    </div>
  );
}
