import { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Signup() {
  const { register, token, loading } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (token) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    try {
      await register(name.trim(), email.trim(), password);
      navigate("/dashboard");
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Sign up failed.";
      setError(Array.isArray(msg) ? msg.join(", ") : msg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy px-4 py-10">
      <div className="w-full max-w-md bg-card rounded-xl shadow-xl p-8">
        <div className="text-center mb-8 flex flex-col items-center">
          <img src="/voltnode-icon.png" alt="VoltNode" width={64} height={64} className="h-16 w-16 mb-3" />
          <div className="text-2xl font-bold tracking-wide">
            <span className="text-navy">VOLT</span>
            <span className="text-primary">NODE</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">Operator Dashboard</div>
        </div>
        <h2 className="text-2xl font-bold text-navy mb-1">Create Operator Account</h2>
        <p className="text-sm text-muted-foreground mb-6">Register to manage your charging stations.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={255} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative mt-1">
              <Input id="password" type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="pr-10" />
              <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">At least 8 characters.</p>
          </div>
          <Button type="submit" disabled={loading} className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
            {loading ? "Creating account…" : "Create Account"}
          </Button>
          {error && <div className="text-sm text-destructive text-center">{error}</div>}
        </form>
        <p className="text-sm text-center mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-semibold hover:underline">Log in</Link>
        </p>
        <p className="text-xs text-muted-foreground text-center mt-6">VoltNode · Operator Portal · Powered by HydroGEM Advisory</p>
      </div>
    </div>
  );
}