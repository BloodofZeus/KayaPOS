import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Store, Loader2, AlertCircle, CheckCircle2, XCircle, ChevronDown, ChevronUp, Database } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [dbPanelOpen, setDbPanelOpen] = useState(false);
  const [dbUrl, setDbUrl] = useState("");
  const [dbTestStatus, setDbTestStatus] = useState<"idle" | "testing" | "ok" | "error">("idle");
  const [dbTestError, setDbTestError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestDb = async () => {
    setDbTestStatus("testing");
    setDbTestError("");
    try {
      const res = await fetch("/api/setup/test-db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: dbUrl }),
      });
      const data = await res.json();
      if (data.ok) {
        setDbTestStatus("ok");
      } else {
        setDbTestStatus("error");
        setDbTestError(data.error || "Connection failed.");
      }
    } catch {
      setDbTestStatus("error");
      setDbTestError("Could not reach the server. Make sure the app is running.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="size-16 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground mb-4 shadow-lg">
            <Store className="size-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Kaya POS</h1>
          <p className="text-muted-foreground mt-1">Sign in to your account</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">Welcome back</CardTitle>
            <CardDescription>Enter your credentials to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  <AlertCircle className="size-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  autoComplete="username"
                  autoFocus
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="mt-4 border-t pt-4">
              <button
                type="button"
                onClick={() => {
                  setDbPanelOpen((v) => !v);
                  setDbTestStatus("idle");
                  setDbTestError("");
                }}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
              >
                <Database className="size-3.5" />
                Check database connection
                {dbPanelOpen ? (
                  <ChevronUp className="size-3.5 ml-auto" />
                ) : (
                  <ChevronDown className="size-3.5 ml-auto" />
                )}
              </button>

              {dbPanelOpen && (
                <div className="mt-3 space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Paste your <code className="bg-muted px-1 rounded">DATABASE_URL</code> below to
                    verify the connection before logging in.
                  </p>
                  <Input
                    value={dbUrl}
                    onChange={(e) => {
                      setDbUrl(e.target.value);
                      setDbTestStatus("idle");
                    }}
                    placeholder="postgresql://user:pass@host:5432/dbname"
                    className="text-xs font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={dbTestStatus === "testing" || dbUrl.trim() === ""}
                    onClick={handleTestDb}
                  >
                    {dbTestStatus === "testing" ? (
                      <>
                        <Loader2 className="size-3.5 mr-2 animate-spin" />
                        Testing…
                      </>
                    ) : (
                      "Test Connection"
                    )}
                  </Button>

                  {dbTestStatus === "ok" && (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 text-xs">
                      <CheckCircle2 className="size-4 shrink-0" />
                      Connected successfully! Your database URL is working.
                    </div>
                  )}

                  {dbTestStatus === "error" && (
                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-destructive/10 text-destructive text-xs">
                      <XCircle className="size-4 shrink-0 mt-0.5" />
                      <span>{dbTestError}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Contact your administrator if you need an account.
        </p>
      </div>
    </div>
  );
}
