"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/dashboard/Navbar";
import { Search, ShieldAlert, CheckCircle, Lock, AlertCircle, Clipboard, Key, Server, Cpu, ShieldCheck, RefreshCw } from "lucide-react";

export default function SslTool() {
  const [host, setHost] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(0);

  // Stepper cycle when loading
  useEffect(() => {
    if (!loading) return;
    setActiveStep(1);
    
    const interval = setInterval(() => {
      setActiveStep(prev => (prev < 6 ? prev + 1 : 6));
    }, 450);

    return () => clearInterval(interval);
  }, [loading]);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    setCopied(false);

    try {
      const res = await fetch("/api/ssl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ host })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to establish SSL handshake connection");
      }
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Network error or host handshake refusal.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result.certRawDump, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isExpired = result ? new Date(result.validTo).getTime() < Date.now() : false;
  const isTrusted = result ? result.authorized : false;

  // Handshake visual steps
  const steps = [
    { name: "Client Hello", desc: "Negotiation start", icon: Cpu },
    { name: "Server Hello", desc: "Select cipher/protocol", icon: Server },
    { name: "SSL Certificate", desc: "Retrieve cert chain", icon: Clipboard },
    { name: "Verify Cert", desc: "Validity & trust check", icon: ShieldCheck },
    { name: "Exchange Key", desc: "ECDHE key agreement", icon: Key },
    { name: "Secure Comm", desc: "Symmetric session active", icon: CheckCircle }
  ];

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 flex flex-col scanline">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Title */}
        <div className="border-b border-cyan-500/10 pb-4">
          <h1 className="text-xl font-mono font-bold tracking-wider text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-cyan-400" />
            <span>SSL TLS HANDSHAKE VERIFIER</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">Connect directly via TLS socket ports and verify peer security certificate chains</p>
        </div>

        {/* Input Panel */}
        <div className="cyber-panel p-6 rounded-lg">
          <form onSubmit={handleCheck} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="domain.com"
                required
                className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-9 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-[#00E5FF] font-mono transition duration-200"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-[#00E5FF] hover:from-cyan-600 hover:to-[#00D0EB] text-slate-950 font-mono text-xs font-bold tracking-widest uppercase rounded shadow-[0_0_10px_rgba(0,229,255,0.2)] transition cursor-pointer flex items-center gap-2 justify-center"
            >
              {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{loading ? "HANDSHAKING..." : "CHECK HANDSHAKE"}</span>
            </button>
          </form>

          {error && (
            <div className="mt-4 p-3 bg-red-950/40 border border-red-500/40 rounded flex items-center text-xs text-red-400 font-mono animate-pulse">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Visual Stepper resolution flow */}
        {(loading || result) && (
          <div className="cyber-panel p-6 rounded-lg space-y-4">
            <h3 className="font-mono text-xs font-bold text-slate-300 uppercase tracking-widest">
              SSL/TLS Handshake Progression
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 pt-2">
              {steps.map((step, idx) => {
                const stepNum = idx + 1;
                let active = false;
                let completed = false;
                let failedState = false;

                if (loading) {
                  completed = activeStep > stepNum;
                  active = activeStep === stepNum;
                } else if (result) {
                  if (!isTrusted && stepNum === 4) {
                    // Muted warning state or highlight
                    failedState = true;
                    completed = true;
                  } else {
                    completed = true;
                  }
                }

                const StepIcon = step.icon;

                return (
                  <div key={idx} className="relative bg-slate-950/40 border border-slate-800 p-4 rounded-lg flex flex-col items-center text-center space-y-2">
                    <div className="absolute top-2 right-2 flex h-2 w-2">
                      {active && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                      )}
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${
                        failedState ? "bg-amber-500" : completed ? "bg-emerald-400" : active ? "bg-cyan-400" : "bg-slate-800"
                      }`}></span>
                    </div>

                    <div className={`p-2 rounded-full border ${
                      failedState
                        ? "bg-amber-950/20 border-amber-500/30 text-amber-400"
                        : completed 
                        ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-400" 
                        : active 
                        ? "bg-cyan-950/20 border-cyan-500/30 text-cyan-400" 
                        : "bg-slate-950 border-slate-800 text-slate-500"
                    }`}>
                      <StepIcon className="w-4 h-4" />
                    </div>

                    <span className={`font-mono text-[11px] font-bold block ${
                      completed ? "text-slate-100" : "text-slate-300"
                    }`}>
                      {step.name}
                    </span>
                    
                    <span className="font-mono text-[9px] text-slate-500 block leading-tight">
                      {failedState ? "CA Untrusted Warn" : step.desc}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Results Block */}
        {result && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Visual breakdown details */}
            <div className="cyber-panel p-6 rounded-lg lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between border-b border-cyan-500/10 pb-3">
                <span className="font-mono text-xs font-bold text-cyan-400">CERTIFICATE PROFILE</span>
                <button 
                  onClick={copyToClipboard}
                  className="px-2.5 py-1 bg-slate-900 border border-slate-700/60 rounded text-[10px] font-mono text-slate-300 hover:border-cyan-400 flex items-center gap-1 cursor-pointer transition"
                >
                  <Clipboard className="w-3.5 h-3.5" />
                  <span>{copied ? "COPIED" : "COPY RAW JSON"}</span>
                </button>
              </div>

              {/* Status Alert Banner */}
              <div className={`p-4 rounded border flex items-start gap-3 font-mono text-xs ${
                isExpired 
                  ? "bg-red-950/30 border-red-500/20 text-red-400" 
                  : !isTrusted
                  ? "bg-amber-950/30 border-amber-500/20 text-amber-400"
                  : "bg-green-950/30 border-green-500/20 text-green-400"
              }`}>
                {isExpired ? (
                  <>
                    <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
                    <div>
                      <h4 className="font-bold text-red-500">EXPIRED SECURITY CERTIFICATE</h4>
                      <p className="text-[10px] text-red-400/80 mt-1">This certificate has reached its expiration threshold. Peer handshakes should not be trusted.</p>
                    </div>
                  </>
                ) : !isTrusted ? (
                  <>
                    <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-500" />
                    <div>
                      <h4 className="font-bold text-amber-500">UNTRUSTED AUTHORITY CHAIN</h4>
                      <p className="text-[10px] text-amber-400/80 mt-1">Handshake succeeded but CA root certificate cannot be verified (e.g. self-signed or internal CA).</p>
                    </div>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-green-500" />
                    <div>
                      <h4 className="font-bold text-green-500">VERIFIED SSL/TLS CERTIFICATE TRUST</h4>
                      <p className="text-[10px] text-green-400/80 mt-1">TLS connection completed successfully. Cert chain verified and current.</p>
                    </div>
                  </>
                )}
              </div>

              {/* Certificate fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs text-slate-300">
                <div className="space-y-4">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Common Name / Subject</span>
                    <span className="text-white font-semibold break-all">{result.subject}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Certificate Authority Issuer</span>
                    <span className="text-slate-200 break-all">{result.issuer}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Signature Algorithm</span>
                    <span className="text-slate-200">{result.sigAlg}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Key Exchange & Session Strength</span>
                    <span className="text-slate-200 flex items-center gap-1.5 mt-0.5">
                      <Key className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{result.keySize} Bits Keys</span>
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Protocol Negotiated</span>
                    <span className="text-[#00E5FF] font-bold">{result.protocol || "TLSv1.3"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Symmetric Cipher Suite</span>
                    <span className="text-white font-semibold break-all">{result.cipherSuite || "TLS_AES_256_GCM_SHA384"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Not Valid Before</span>
                    <span className="text-slate-200">{new Date(result.validFrom).toUTCString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Not Valid After</span>
                    <span className="text-slate-200">{new Date(result.validTo).toUTCString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Terminal view */}
            <div className="cyber-panel p-6 rounded-lg flex flex-col justify-between">
              <div>
                <h3 className="font-mono text-xs font-bold text-slate-300 mb-2">RAW HANDSHAKE TRACE</h3>
                <p className="text-[10px] text-slate-500 font-mono mb-4">TLS session diagnostic buffer logs</p>
              </div>
              <div className="bg-slate-950/60 p-4 rounded border border-slate-800 font-mono text-[10px] text-green-400 overflow-auto h-[350px] select-all whitespace-pre-wrap break-all leading-normal">
                <pre>{result.trace ? result.trace.join("\n") + "\n\n=== CERTIFICATE DETAILS ===\n\n" + JSON.stringify(result.certRawDump, null, 2) : JSON.stringify(result, null, 2)}</pre>
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}
export const runtime = "nodejs";
