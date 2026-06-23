import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import werewaakLogo from "@/assets/werewaak-logo.png";

export default function SignIn() {
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const state = location.state as { email?: string; signupSuccess?: boolean } | null;
    if (state?.email) {
      setEmail(state.email);
    }
    if (state?.signupSuccess) {
      setSuccess("Your account has been created. Please check your email and verify your address before logging in.");
    }
  }, [location.state]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
    } else if (data.session) {
      window.location.href = "/";
    } else {
      setError("Login failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary">
      <div className="bg-card rounded-lg shadow-2xl p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <img src={werewaakLogo} alt="Wërewaak Capital" className="w-24 h-24 mx-auto mb-3 rounded-full" />
          <h1 className="text-xl font-bold text-primary">Wërewaak Capital</h1>
          <p className="text-muted-foreground text-sm">Juba, South Sudan</p>
        </div>
        <form onSubmit={handleSignIn}>
          {success && <p className="text-success text-sm mb-3 text-center">{success}</p>}
          {error && <p className="text-destructive text-sm mb-3 text-center">{error}</p>}
          <input
            className="w-full border border-input rounded px-3 py-2 mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="w-full border border-input rounded px-3 py-2 mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            className="w-full bg-primary text-primary-foreground rounded py-2 font-semibold hover:opacity-90 transition"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}