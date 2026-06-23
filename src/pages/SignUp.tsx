import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import werewaakLogo from "@/assets/werewaak-logo.png";

export default function SignUp() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setError(error.message);
      return;
    }

    navigate("/signin", {
      state: {
        email,
        signupSuccess: true,
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary">
      <div className="bg-card rounded-lg shadow-2xl p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <img src={werewaakLogo} alt="Wërewaak Capital" className="w-24 h-24 mx-auto mb-3 rounded-full" />
          <h1 className="text-xl font-bold text-primary">Wërewaak Capital</h1>
          <p className="text-muted-foreground text-sm">Juba, South Sudan</p>
        </div>
        <form onSubmit={handleSignUp}>
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
            Sign Up
          </button>
        </form>
      </div>
    </div>
  );
}