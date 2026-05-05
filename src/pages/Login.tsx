import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Login() {
  const { login, token, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (token) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Login failed.";
      setError(Array.isArray(msg) ? msg.join(", ") : msg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy px-4">
      <div className="w-full max-w-md bg-card rounded-xl shadow-xl p-8">
        <div className="text-center mb-8 flex flex-col items-center">
          <img src="/voltnode-icon.png" alt="VoltNode" width={64} height={64} className="h-16 w-16 mb-3" />
          <div className="text-2xl font-bold tracking-wide">
            <span className="text-navy">VOLT</span>
            <span className="text-primary">NODE</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">Operator Dashboard</div>
        </div>
        <h2 className="text-2xl font-bold text-navy mb-6">Welcome Back</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1" />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative mt-1">
              <Input id="password" type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required className="pr-10" />
              <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
            {loading ? "Signing in…" : "Log In"}
          </Button>
          {error && <div className="text-sm text-destructive text-center">{error}</div>}
        </form>
        <p className="text-xs text-muted-foreground text-center mt-8">VoltNode · Operator Portal · Powered by HydroGEM Advisory</p>
      </div>
    </div>
  );
}