import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const res = await fetch("http://localhost:3000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });

    let data
    try {
        data = await res.json()
    } catch {
        setError('Something went wrong, please try again')
        return
    }

    if (res.ok) {
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        navigate("/");
    } else {
        setError(data.error || "Invalid email or password");
    }
    }

    return (
    <div>
        <h1>Log In</h1>

        <form onSubmit={handleSubmit}>
        <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
        />

        <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
        />

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button type="submit">Log In</button>
        </form>

        <p>
        Don't have an account? <Link to="/register">Register</Link>
        </p>
    </div>
    );
}   