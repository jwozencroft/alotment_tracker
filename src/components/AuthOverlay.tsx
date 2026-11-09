import React, { useState } from "react";
import { Sprout, Lock, User, HelpCircle, Key, AlertCircle } from "lucide-react";

interface AuthOverlayProps {
  onLoginSuccess: (token: string, username: string, role?: string) => void;
}

export default function AuthOverlay({ onLoginSuccess }: AuthOverlayProps) {
  const [activeCard, setActiveCard] = useState<"login" | "register" | "forgot">("login");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [regQuestion, setRegQuestion] = useState("");
  const [regAnswer, setRegAnswer] = useState("");
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [displayQuestion, setDisplayQuestion] = useState("");
  const [resetAnswer, setResetAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const clearState = () => {
    setError(null);
    setSuccessMsg(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearState();
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onLoginSuccess(data.token, data.username, data.role || "member");
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearState();
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          securityQuestion: regQuestion,
          securityAnswer: regAnswer,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg("Account successfully created! You can now log in.");
        setActiveCard("login");
        setPassword("");
      } else {
        setError(data.error || "Registration failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
  };

  const fetchSecurityQuestion = async () => {
    clearState();
    if (!username) {
      setError("Please enter your username first.");
      return;
    }
    try {
      const res = await fetch("/api/forgot-password/question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      if (res.ok && data.question) {
        setDisplayQuestion(data.question);
        setResetStep(2);
      } else {
        setError(data.error || "User not found");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearState();
    try {
      const res = await fetch("/api/forgot-password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          answer: resetAnswer,
          newPassword,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg("Password updated successfully! Please log in.");
        setActiveCard("login");
        setResetStep(1);
        setPassword("");
        setResetAnswer("");
        setNewPassword("");
      } else {
        setError(data.error || "Incorrect answer or reset failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-neutral-100 p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="h-12 w-12 bg-emerald-50 rounded-full flex items-center justify-center mb-3">
            <Sprout className="h-6 w-6 text-emerald-600 animate-pulse" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-neutral-800">
            {activeCard === "login" && "Welcome Back"}
            {activeCard === "register" && "Create Account"}
            {activeCard === "forgot" && "Reset Password"}
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Collaborative Allotment Hub
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg flex items-start gap-2 text-sm border border-red-100">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 rounded-lg flex items-start gap-2 text-sm border border-emerald-100">
            <Sprout className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {activeCard === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  placeholder="james"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition shadow-sm"
            >
              Log In
            </button>

            <button
              type="button"
              onClick={() => {
                setUsername("demo");
                setPassword("allotment123");
                clearState();
              }}
              className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5"
            >
              <Sprout className="h-3.5 w-3.5 text-emerald-600" />
              <span>Use Demo Account (demo / allotment123)</span>
            </button>

            <div className="flex flex-col gap-2 items-center text-xs mt-4">
              <button
                type="button"
                onClick={() => {
                  setActiveCard("register");
                  clearState();
                }}
                className="text-emerald-600 hover:underline font-medium"
              >
                Create a collaborative account
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveCard("forgot");
                  clearState();
                }}
                className="text-neutral-500 hover:underline"
              >
                Forgot Password?
              </button>
            </div>
          </form>
        )}

        {activeCard === "register" && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  placeholder="Choose username"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  placeholder="Choose strong password"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">
                Security Question
              </label>
              <div className="relative">
                <HelpCircle className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  required
                  value={regQuestion}
                  onChange={(e) => setRegQuestion(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  placeholder="e.g. My first pet's name"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">
                Answer
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  required
                  value={regAnswer}
                  onChange={(e) => setRegAnswer(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  placeholder="Your answer"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition shadow-sm"
            >
              Create Account
            </button>

            <div className="text-center text-xs mt-4">
              <button
                type="button"
                onClick={() => {
                  setActiveCard("login");
                  clearState();
                }}
                className="text-emerald-600 hover:underline font-medium"
              >
                Back to Login
              </button>
            </div>
          </form>
        )}

        {activeCard === "forgot" && (
          <div className="space-y-4">
            {resetStep === 1 ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">
                    Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      placeholder="Username of account"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={fetchSecurityQuestion}
                  className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-900 text-white rounded-xl text-sm font-semibold transition"
                >
                  Verify Username
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-800 font-medium text-center">
                  <span className="block text-xs text-emerald-600 uppercase tracking-wider font-semibold mb-1">
                    Security Question
                  </span>
                  {displayQuestion}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">
                    Your Answer
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                    <input
                      type="text"
                      required
                      value={resetAnswer}
                      onChange={(e) => setResetAnswer(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      placeholder="Answer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      placeholder="Enter new password"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition shadow-sm"
                >
                  Save New Password
                </button>
              </form>
            )}

            <div className="text-center text-xs mt-4">
              <button
                type="button"
                onClick={() => {
                  setActiveCard("login");
                  setResetStep(1);
                  clearState();
                }}
                className="text-neutral-500 hover:underline font-medium"
              >
                Back to Login
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
