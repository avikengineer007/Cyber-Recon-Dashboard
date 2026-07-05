"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/dashboard/Navbar";
import { 
  Globe, 
  Search, 
  Server, 
  Database, 
  FileText, 
  CheckCircle2, 
  Clipboard, 
  AlertCircle, 
  ArrowRight, 
  ShieldCheck, 
  Activity, 
  Mail, 
  ShieldAlert,
  Info
} from "lucide-react";

export default function WhoisTool() {
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  // Animate flow steps during active query loading
  useEffect(() => {
    let interval: any;
    if (loading) {
      setActiveStep(1);
      interval = setInterval(() => {
        setActiveStep((prev) => (prev < 5 ? prev + 1 : 1));
      }, 700);
    } else if (result) {
      setActiveStep(5);
    } else {
      setActiveStep(0);
    }
    return () => clearInterval(interval);
  }, [loading, result]);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    setCopied(false);

    try {
      const res = await fetch("/api/whois", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to query registrar server");
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
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Flow step descriptions
  const steps = [
    { label: "User Query", desc: "Submit domain name search", icon: Search },
    { label: "WHOIS Client", desc: "Construct EPP connection client", icon: Globe },
    { label: "WHOIS Server", desc: "Redirect to target TLD registry", icon: Server },
    { label: "Registrar DB", desc: "Query registry server database", icon: Database },
    { label: "Retrieved details", desc: "Parse raw WHOIS details response", icon: FileText },
    { label: "Display Results", desc: "Structure visual telemetry card", icon: CheckCircle2 }
  ];

  // WHOIS Application cases
  const applications = [
    {
      title: "Verifying Domain Ownership",
      desc: "Confirm registered operator credentials and trace domain histories.",
      icon: ShieldCheck,
      color: "text-green-400 border-green-500/10 bg-green-500/5"
    },
    {
      title: "Investigating Cyber Incidents",
      desc: "Trace threat actors, infrastructure, and malicious domain creation times.",
      icon: ShieldAlert,
      color: "text-red-400 border-red-500/10 bg-red-500/5"
    },
    {
      title: "Phishing Infrastructure Tracking",
      desc: "Identify look-alike domains and locate registrars hosting abuse vectors.",
      icon: Activity,
      color: "text-amber-400 border-amber-500/10 bg-amber-500/5"
    },
    {
      title: "Checking Domain Availability",
      desc: "Verify if expired domains can be claimed or identify acquisition contacts.",
      icon: Search,
      color: "text-cyan-400 border-cyan-500/10 bg-cyan-500/5"
    },
    {
      title: "Contacting Domain Admins",
      desc: "Reach out to technical contacts or abuse divisions regarding vulnerabilities.",
      icon: Mail,
      color: "text-purple-400 border-purple-500/10 bg-purple-500/5"
    },
    {
      title: "Digital Forensics & IR",
      desc: "Ingest server records to draw threat intelligence and incident maps.",
      icon: Info,
      color: "text-blue-400 border-blue-500/10 bg-blue-500/5"
    }
  ];

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 flex flex-col scanline">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Title */}
        <div className="border-b border-cyan-500/10 pb-4">
          <h1 className="text-xl font-mono font-bold tracking-wider text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-cyan-400 filter drop-shadow-[0_0_8px_rgba(0,229,255,0.3)]" />
            <span>WHOIS DIRECTORY CONSULTANT</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">Query live domain registry records and trace structural infrastructure paths</p>
        </div>

        {/* Input Panel */}
        <div className="cyber-panel p-6 rounded-lg space-y-6">
          <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Globe className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="example.com"
                required
                className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-9 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-[#00E5FF] font-mono transition duration-200"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-[#00E5FF] hover:from-cyan-600 hover:to-[#00D0EB] text-slate-950 font-mono text-xs font-bold tracking-widest uppercase rounded shadow-[0_0_10px_rgba(0,229,255,0.2)] transition cursor-pointer"
            >
              {loading ? "ESTABLISHING FLOW..." : "RUN QUERY"}
            </button>
          </form>

          {error && (
            <div className="p-3 bg-red-950/40 border border-red-500/40 rounded flex items-center text-xs text-red-400 font-mono">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Flow Stepper (Visual Flow Diagram) */}
        <div className="cyber-panel p-6 rounded-lg">
          <h3 className="font-mono text-xs font-bold text-slate-300 mb-6 flex items-center gap-2">
            <span>WHOIS LOOKUP RESOLUTION FLOW</span>
            <span className="text-[10px] text-cyan-400 font-normal">Active Stage Telemetry</span>
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 relative">
            {steps.map((step, idx) => {
              const StepIcon = step.icon;
              const isActive = activeStep >= idx;
              const isCurrent = activeStep === idx;
              
              return (
                <div key={idx} className="relative flex flex-col items-center text-center p-3 rounded-lg border transition duration-300 bg-slate-950/20 border-slate-800/40">
                  {/* Status lights */}
                  <span className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
                    isCurrent 
                      ? "bg-cyan-400 animate-ping" 
                      : isActive 
                        ? "bg-cyan-500" 
                        : "bg-slate-800"
                  }`} />
                  
                  <div className={`p-3 rounded-full border mb-3 transition duration-300 ${
                    isActive 
                      ? "text-cyan-400 border-cyan-500/35 bg-cyan-500/5 shadow-[0_0_15px_rgba(0,229,255,0.1)]" 
                      : "text-slate-600 border-slate-800 bg-slate-950/10"
                  }`}>
                    <StepIcon className="w-5 h-5" />
                  </div>
                  
                  <span className={`text-[10px] font-mono font-bold ${isActive ? "text-cyan-400" : "text-slate-500"}`}>
                    {step.label}
                  </span>
                  
                  <span className="text-[9px] font-mono text-slate-500 mt-1 leading-tight max-w-[120px]">
                    {step.desc}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Results Block */}
        {result && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Visual breakdown details */}
            <div className="cyber-panel p-6 rounded-lg lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between border-b border-cyan-500/10 pb-3">
                <span className="font-mono text-xs font-bold text-cyan-400">REGISTRATION DETAILS</span>
                <button 
                  onClick={copyToClipboard}
                  className="px-2.5 py-1 bg-slate-900 border border-slate-700/60 rounded text-[10px] font-mono text-slate-300 hover:border-cyan-400 flex items-center gap-1 cursor-pointer transition"
                >
                  <Clipboard className="w-3 h-3" />
                  <span>{copied ? "COPIED" : "COPY RAW JSON"}</span>
                </button>
              </div>

              {/* Registration Profile */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
                <div className="space-y-4">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Domain Name</span>
                    <span className="text-cyan-400 font-bold text-sm select-all">{result.domain}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Registrar</span>
                    <span className="text-slate-200">{result.registrar || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Creation Date</span>
                    <span className="text-slate-200">{result.registeredAt ? new Date(result.registeredAt).toUTCString() : "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Expiration Date</span>
                    <span className="text-slate-200">{result.expiresAt ? new Date(result.expiresAt).toUTCString() : "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Last Updated Date</span>
                    <span className="text-slate-200">{result.updatedAt ? new Date(result.updatedAt).toUTCString() : "N/A"}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-slate-500 block text-[10px]">DNSSEC Status</span>
                    <span className="text-emerald-400 font-semibold">{result.dnssec || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Registrant / Administrative Contact</span>
                    <span className="text-slate-300 italic">{result.registrant || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Name Servers</span>
                    <div className="space-y-1 mt-1 text-[10px] text-cyan-400 select-all">
                      {result.nameServers?.map((ns: string, idx: number) => (
                        <span key={idx} className="block">{ns}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Registry Status</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {result.status?.map((st: string, idx: number) => (
                        <span key={idx} className="text-[9px] text-yellow-500 bg-yellow-950/20 border border-yellow-500/20 px-2 py-0.5 rounded">
                          {st.split(" ")[0]}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* OSINT Administrative Contacts Panel */}
              <div className="border-t border-slate-800/80 my-6 pt-4" />
              
              <div className="space-y-4">
                <span className="font-mono text-xs font-bold text-cyan-400 block border-b border-cyan-500/10 pb-2 uppercase tracking-wide">
                  OSINT Administrative Contacts
                </span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
                  <div className="space-y-4">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Registrant Organization</span>
                      <span className="text-white font-semibold">{result.registrantOrganization || "Redacted for Privacy"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Registrant Name</span>
                      <span className="text-slate-200">{result.registrantName || "Redacted for Privacy"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Registrant Email</span>
                      <span className="text-slate-300 select-all break-all">{result.registrantEmail || "Redacted for Privacy"}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Registrar Abuse Contact Email</span>
                      <span className="text-amber-400 select-all break-all">{result.abuseEmail || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Registrar Abuse Contact Phone</span>
                      <span className="text-slate-200 select-all">{result.abusePhone || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Registrar Referral Website</span>
                      {result.registrarUrl && result.registrarUrl !== "N/A" ? (
                        <a 
                          href={result.registrarUrl.startsWith("http") ? result.registrarUrl : `https://${result.registrarUrl}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-cyan-400 hover:underline hover:text-cyan-300 transition break-all"
                        >
                          {result.registrarUrl}
                        </a>
                      ) : (
                        <span className="text-slate-500">N/A</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Terminal view */}
            <div className="cyber-panel p-6 rounded-lg flex flex-col justify-between">
              <div>
                <h3 className="font-mono text-xs font-bold text-slate-300 mb-2">RAW REGISTRY FEEDBACK</h3>
                <p className="text-[10px] text-slate-500 font-mono mb-4">Console view raw output</p>
              </div>
              <div className="bg-slate-950/60 p-4 rounded border border-slate-800 font-mono text-[10px] text-green-400 overflow-auto h-[320px] select-all">
                <pre className="whitespace-pre-wrap break-all">{result.rawText || JSON.stringify(result, null, 2)}</pre>
              </div>
            </div>

          </div>
        )}

        {/* Applications of WHOIS Grid */}
        <div className="space-y-4">
          <div className="border-b border-cyan-500/10 pb-2">
            <h3 className="font-mono text-xs font-bold text-white uppercase tracking-wider">APPLICATIONS OF WHOIS</h3>
            <p className="text-[10px] text-slate-500 font-mono">Incident response and infrastructure intelligence mappings</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {applications.map((app, idx) => {
              const AppIcon = app.icon;
              return (
                <div key={idx} className="cyber-panel p-5 rounded-lg flex gap-4 hover:border-cyan-500/30 transition-all duration-300 group">
                  <div className={`p-2.5 rounded border flex-shrink-0 flex items-center justify-center h-min group-hover:scale-105 transition-transform duration-300 ${app.color}`}>
                    <AppIcon className="w-4 h-4" />
                  </div>
                  <div className="space-y-1 font-mono">
                    <h4 className="text-xs font-bold text-white tracking-wide">{app.title}</h4>
                    <p className="text-[10px] text-slate-400 leading-relaxed">{app.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </main>
    </div>
  );
}
