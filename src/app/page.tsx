"use client";

import React, { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Terminal, ShieldAlert, Lock, Mail, User, ShieldCheck, Activity, Cpu } from "lucide-react";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [roleCode, setRoleCode] = useState(""); // Enter ADMIN_SECRET_KEY_2026 for admin role
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (isLogin) {
      // Handle Login
      try {
        const res = await signIn("credentials", {
          redirect: false,
          email,
          password,
        });

        if (res?.error) {
          setError("Invalid security credentials or password match error.");
        } else {
          router.push("/dashboard");
        }
      } catch (err: any) {
        setError("Connection timeout or server authentication error.");
      }
    } else {
      // Handle Register
      try {
        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password, roleCode }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to create security account.");
        } else {
          // Auto signin on success
          const loginRes = await signIn("credentials", {
            redirect: false,
            email,
            password,
          });
          if (loginRes?.error) {
            setError("Account created, but failed to establish session. Please log in.");
            setIsLogin(true);
          } else {
            router.push("/dashboard");
          }
        }
      } catch (err: any) {
        setError("Failed to register. Please check system database links.");
      }
    }
    setLoading(false);
  };

  if (status === "loading" || status === "authenticated") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#070A12] scanline">
        <div className="flex flex-col items-center space-y-4">
          <Activity className="w-12 h-12 text-[#00E5FF] animate-spin" />
          <p className="text-cyan-400 font-mono tracking-widest text-sm animate-pulse">
            SYNCHRONIZING TERMINAL SECURITY MODULES...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#070A13] relative overflow-hidden scanline">
      {/* Decorative ambient glow */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-cyan-500/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-blue-500/5 blur-[150px] pointer-events-none" />

      {/* Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between z-10 border-b border-cyan-500/10 backdrop-blur-md bg-slate-950/20">
        <div className="flex items-center space-x-3">
          <Terminal className="w-8 h-8 text-[#00E5FF] filter drop-shadow-[0_0_8px_rgba(0,229,255,0.4)]" />
          <span className="font-mono text-xl font-black tracking-widest bg-gradient-to-r from-cyan-400 to-[#00E5FF] bg-clip-text text-transparent">
            CYBER RECON
          </span>
        </div>
        <div className="flex items-center space-x-2 font-mono text-xs text-cyan-400/70">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping mr-1" />
          SECURE LOGISTICS TERMINAL v2.6.4
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center max-w-7xl w-full mx-auto px-6 py-12 gap-12 z-10">
        {/* Pitch / Features Section */}
        <div className="flex-1 flex flex-col space-y-6 text-left max-w-xl">
          <div className="inline-flex items-center px-3 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/5 text-xs text-[#00E5FF] font-mono tracking-wider">
            <ShieldCheck className="w-4 h-4 mr-2" /> CORE COMMAND PLATFORM
          </div>
          <h1 className="text-4xl lg:text-5xl font-black font-sans leading-tight tracking-tight text-white">
            Security Intelligence & <br />
            <span className="text-[#00E5FF] cyber-glow">Active Reconnaissance</span>
          </h1>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed">
            Consolidate WHOIS directories, map DNS record chains, handshake TLS certificates, query live CVE catalogs, and ingest Nmap XML logs into visually enriched analytics grids.
          </p>

          {/* Micro Grid */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="cyber-panel p-4 rounded-lg">
              <Cpu className="w-6 h-6 text-cyan-400 mb-2" />
              <h3 className="font-mono text-white text-xs font-semibold">Serverless Architecture</h3>
              <p className="text-slate-500 text-[10px] mt-1">Highly scalable edge-ready infrastructure.</p>
            </div>
            <div className="cyber-panel p-4 rounded-lg">
              <Activity className="w-6 h-6 text-cyan-400 mb-2" />
              <h3 className="font-mono text-white text-xs font-semibold">Telemetry Pipelines</h3>
              <p className="text-slate-500 text-[10px] mt-1">Realtime analysis of external attack vectors.</p>
            </div>
          </div>
        </div>

        {/* Login Panel */}
        <div className="w-full max-w-md">
          <div className="glassmorphism p-8 rounded-xl relative border border-cyan-500/20 shadow-2xl">
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-400 rounded-tr" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-400 rounded-bl" />

            <div className="mb-6 text-center">
              <h2 className="font-mono text-xl font-bold tracking-wider text-cyan-400">
                {isLogin ? "OPERATOR INGRESS" : "CREATE SECURE ACCOUNT"}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {isLogin ? "Authentication Required" : "Register to access threat intelligence tools"}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-950/40 border border-red-500/40 rounded flex items-center text-xs text-red-400 font-mono">
                <ShieldAlert className="w-4 h-4 mr-2 flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1.5">Operator Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Agent Smith"
                      required={!isLogin}
                      className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-9 py-2 text-sm text-slate-200 focus:outline-none focus:border-[#00E5FF] transition duration-200"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5">Security Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="operator@recon.local"
                    required
                    className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-9 py-2 text-sm text-slate-200 focus:outline-none focus:border-[#00E5FF] transition duration-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5">Passcode</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-9 py-2 text-sm text-slate-200 focus:outline-none focus:border-[#00E5FF] transition duration-200"
                  />
                </div>
              </div>

              {!isLogin && (
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1.5">Admin Passcode (Optional)</label>
                  <div className="relative">
                    <ShieldAlert className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      value={roleCode}
                      onChange={(e) => setRoleCode(e.target.value)}
                      placeholder="e.g. ADMIN_SECRET_KEY_2026"
                      className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-9 py-2 text-sm text-slate-200 focus:outline-none focus:border-[#00E5FF] transition duration-200"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 mt-2 bg-gradient-to-r from-cyan-500 to-[#00E5FF] hover:from-cyan-600 hover:to-[#00D0EB] text-slate-950 font-mono text-xs font-bold tracking-widest uppercase rounded shadow-[0_0_15px_rgba(0,229,255,0.2)] hover:shadow-[0_0_20px_rgba(0,229,255,0.45)] transition duration-300"
              >
                {loading ? "ESTABLISHING HANDSHAKE..." : isLogin ? "INITIATE PROTOCOL" : "REGISTER OPERATOR"}
              </button>
            </form>

            <div className="mt-5 text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-xs font-mono text-cyan-400 hover:text-cyan-300 transition duration-150"
              >
                {isLogin ? "Provision registration key?" : "Return to credentials login?"}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-cyan-500/5 bg-slate-950/35 py-4 z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between text-slate-500 text-[10px] font-mono gap-2">
          <span>CLASSIFIED RECON INTERFACE — DO NOT DISTRIBUTE</span>
          <span>EST. TIME 2026-07-04 // SECURITY SYSTEM OK</span>
        </div>
      </footer>
    </div>
  );
}
