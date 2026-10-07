import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import helmet from "../assets/helmet.png";
import "../styles/auth.css";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    let data;
    try {
      data = await res.json();
    } catch {
      setError("Something went wrong, please try again");
      return;
    }

    if (res.ok) {
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      navigate("/");
    } else {
      setError(data.error || "Registration failed");
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-wrapper">
        <div className="auth-logo">
          <img className="auth-logo-img" src={helmet} alt="helmet" />
          <span className="auth-logo-text">Route<span>Explorer</span></span>
        </div>

        <div className="auth-card">
          <div className="auth-card-header">
            <h1>Create account</h1>
            <p>Start exploring and tracking your routes</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Choose a password"
                required
              />
            </div>

            {error && <p className="auth-error">{error}</p>}

            <button className="auth-submit" type="submit">Create Account</button>
          </form>

          <div className="auth-footer">
            Already have an account? <Link to="/login">Log In</Link>
          </div>
        </div>
      </div>
    </div>
  );
}