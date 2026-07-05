"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/dashboard/Navbar";
import { Search, Network, Clipboard, AlertCircle, RefreshCw, Database, Server, Cpu, CheckCircle } from "lucide-react";

export default function DnsTool() {
  const [domain, setDomain] = useState("");
  const [types, setTypes] = useState<string[]>(['A', 'AAAA', 'MX', 'TXT', 'NS', 'SOA', 'CNAME']);
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
      setActiveStep(prev => (prev < 5 ? prev + 1 : 5));
    }, 450);

    return () => clearInterval(interval);
  }, [loading]);

  const toggleType = (t: string) => {
    if (types.includes(t)) {
      setTypes(types.filter(item => item !== t));
    } else {
      setTypes([...types, t]);
    }
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (types.length === 0) {
      setError("Please select at least one DNS record type to query");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setCopied(false);

    try {
      const res = await fetch("/api/dns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, types })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to resolve DNS zones");
      }
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result.records, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectAllTypes = () => {
    setTypes(['A', 'AAAA', 'MX', 'TXT', 'NS', 'SOA', 'CNAME', 'PTR', 'SRV']);
  };

  const clearAllTypes = () => {
    setTypes([]);
  };

  const recordOptions = ['A', 'AAAA', 'MX', 'TXT', 'NS', 'SOA', 'CNAME', 'PTR', 'SRV'];

  // visual steps mapping
  const steps = [
    { name: "Client Query", desc: "Initiate lookup", icon: Search },
    { name: "Cache Check", desc: "Local TTL verify", icon: Database },
    { name: "Root DNS", desc: "TLD referral", icon: Cpu },
    { name: "TLD DNS", desc: "Auth NS pointer", icon: Server },
    { name: "Authoritative", desc: "Fetch zone records", icon: CheckCircle }
  ];

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 flex flex-col scanline">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Title */}
        <div className="border-b border-cyan-500/10 pb-4">
          <h1 className="text-xl font-mono font-bold tracking-wider text-white flex items-center gap-2">
            <Network className="w-5 h-5 text-cyan-400" />
            <span>DNS RECORD RESOLVER</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">Resolve actual DNS zone records using Node.js backend lookup engines</p>
        </div>

        {/* Input & Record Selectors */}
        <div className="cyber-panel p-6 rounded-lg space-y-6">
          <form onSubmit={handleResolve} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Network className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="e.g. google.com or 8.8.8.8 (for PTR)"
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
              <span>{loading ? "RESOLVING..." : "RESOLVE"}</span>
            </button>
          </form>

          {/* Record Selector Toggles */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-slate-400">TARGET RECORD TYPE FILTER</span>
              <div className="flex gap-3">
                <button type="button" onClick={selectAllTypes} className="text-cyan-400 hover:underline hover:text-cyan-300 transition">Select All</button>
                <span className="text-slate-700">|</span>
                <button type="button" onClick={clearAllTypes} className="text-slate-500 hover:text-slate-300 hover:underline transition">Clear</button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {recordOptions.map((opt) => {
                const selected = types.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleType(opt)}
                    className={`px-3 py-1.5 text-xs font-mono rounded border transition cursor-pointer ${
                      selected 
                        ? "bg-cyan-500/10 text-[#00E5FF] border-cyan-400 shadow-[0_0_4px_rgba(0,229,255,0.15)]"
                        : "bg-slate-950/40 text-slate-500 border-slate-700/60 hover:text-slate-300"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-950/40 border border-red-500/40 rounded flex items-center text-xs text-red-400 font-mono animate-pulse">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Visual Stepper Resolution Flow */}
        {(loading || result) && (
          <div className="cyber-panel p-6 rounded-lg space-y-4">
            <h3 className="font-mono text-xs font-bold text-slate-300 uppercase tracking-widest">
              DNS Lookup Resolution Flow
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-2">
              {steps.map((step, idx) => {
                const stepNum = idx + 1;
                const isCached = result && result.cacheHitCount > 0 && result.cacheMissCount === 0;
                
                let active = false;
                let completed = false;
                let bypassed = false;

                if (loading) {
                  completed = activeStep > stepNum;
                  active = activeStep === stepNum;
                } else if (result) {
                  if (isCached && stepNum > 2) {
                    bypassed = true;
                  } else {
                    completed = true;
                  }
                }

                const StepIcon = step.icon;

                return (
                  <div key={idx} className="relative bg-slate-950/40 border border-slate-800 p-4 rounded-lg flex flex-col items-center text-center space-y-2">
                    {/* Status Dot */}
                    <div className="absolute top-2 right-2 flex h-2 w-2">
                      {active && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                      )}
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${
                        completed ? "bg-emerald-400" : bypassed ? "bg-slate-700" : active ? "bg-cyan-400" : "bg-slate-800"
                      }`}></span>
                    </div>

                    <div className={`p-2 rounded-full border ${
                      completed 
                        ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-400" 
                        : bypassed 
                        ? "bg-slate-900 border-slate-800 text-slate-600" 
                        : active 
                        ? "bg-cyan-950/20 border-cyan-500/30 text-cyan-400" 
                        : "bg-slate-950 border-slate-800 text-slate-500"
                    }`}>
                      <StepIcon className="w-4 h-4" />
                    </div>

                    <span className={`font-mono text-[11px] font-bold block ${
                      completed ? "text-slate-100" : bypassed ? "text-slate-500" : "text-slate-300"
                    }`}>
                      {step.name}
                    </span>
                    
                    <span className="font-mono text-[9px] text-slate-500 block leading-tight">
                      {bypassed ? "Bypassed (Cached)" : step.desc}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Results Output */}
        {result && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Visual record tables */}
            <div className="cyber-panel p-6 rounded-lg lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between border-b border-cyan-500/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-cyan-400">RESOLVED DNS RECORDS</span>
                  {result.cacheHitCount > 0 && (
                    <span className="px-2 py-0.5 bg-cyan-950/40 border border-cyan-400/20 text-[#00E5FF] text-[9px] font-mono rounded tracking-widest uppercase font-bold">
                      Cached Results
                    </span>
                  )}
                </div>
                <button 
                  onClick={copyToClipboard}
                  className="px-2.5 py-1 bg-slate-900 border border-slate-700/60 rounded text-[10px] font-mono text-slate-300 hover:border-cyan-400 flex items-center gap-1 cursor-pointer transition"
                >
                  <Clipboard className="w-3.5 h-3.5" />
                  <span>{copied ? "COPIED" : "COPY RAW JSON"}</span>
                </button>
              </div>

              <div className="space-y-4">
                {result.records?.map((record: any, index: number) => (
                  <div key={index} className="border border-slate-800/80 rounded overflow-hidden">
                    <div className="bg-slate-950/45 px-4 py-2 border-b border-slate-800/80 flex justify-between items-center">
                      <span className="font-mono text-xs font-bold text-[#00E5FF]">{record.type} Record</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded ${
                          record.source === "CACHE" ? "bg-cyan-950/30 text-cyan-400 border border-cyan-500/20" : "bg-emerald-950/30 text-emerald-400 border border-emerald-500/20"
                        }`}>
                          {record.source}
                        </span>
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded ${
                          record.status === "SUCCESS" ? "bg-green-950/40 text-green-400 border border-green-500/20" : "bg-red-950/40 text-red-400 border border-red-500/20"
                        }`}>
                          {record.status}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 font-mono text-xs text-slate-300 space-y-3">
                      {record.status === "SUCCESS" ? (
                        Array.isArray(record.data) ? (
                          record.data.length > 0 ? (
                            <ul className="space-y-1">
                              {record.data.map((d: any, idx: number) => (
                                <li key={idx} className="break-all select-all hover:text-white transition">
                                  {typeof d === 'string' ? d : JSON.stringify(d)}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-slate-600">No records returned.</span>
                          )
                        ) : (
                          <span className="break-all select-all">{JSON.stringify(record.data)}</span>
                        )
                      ) : (
                        <span className="text-red-400/80">Code: {record.error || "UNKNOWN_ERROR"}</span>
                      )}
                      
                      <div className="pt-2 border-t border-slate-800/40 flex justify-between items-center text-[9px] text-slate-500">
                        <span>RECORD TTL: {record.ttl} seconds</span>
                        {record.source === "CACHE" && <span>EXPIRES DYNAMICALLY</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Terminal Console View */}
            <div className="cyber-panel p-6 rounded-lg flex flex-col justify-between">
              <div>
                <h3 className="font-mono text-xs font-bold text-slate-300 mb-2">RAW NSLOOKUP TRACE</h3>
                <p className="text-[10px] text-slate-500 font-mono mb-4">Hierarchical recursion trace logs</p>
              </div>
              <div className="bg-slate-950/60 p-4 rounded border border-slate-800 font-mono text-[10px] text-green-400 overflow-auto h-[450px] select-all whitespace-pre-wrap break-all leading-normal">
                <pre>{result.trace ? result.trace.join("\n") + "\n\n=== RAW JSON OUTPUT ===\n\n" + JSON.stringify(result.records, null, 2) : JSON.stringify(result, null, 2)}</pre>
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}
export const runtime = "nodejs";
