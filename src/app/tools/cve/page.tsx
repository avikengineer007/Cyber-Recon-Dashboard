"use client";

import React, { useState } from "react";
import Navbar from "@/components/dashboard/Navbar";
import { Search, ShieldAlert, AlertTriangle, AlertCircle, Clipboard, ArrowUpDown } from "lucide-react";

export default function CveTool() {
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState("");
  const [sortBy, setSortBy] = useState("LATEST");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length < 2) {
      setError("Search query must be at least 2 characters long");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setCopied(false);

    try {
      const res = await fetch("/api/cve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          query, 
          severity: severity || undefined, 
          sortBy 
        })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to search CVE record indexes");
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

  const getSeverityBadgeColor = (sev: string) => {
    switch (sev.toUpperCase()) {
      case "CRITICAL":
        return "bg-red-950/40 text-red-400 border border-red-500/35";
      case "HIGH":
        return "bg-orange-950/40 text-orange-400 border border-orange-500/30";
      case "MEDIUM":
        return "bg-yellow-950/40 text-yellow-400 border border-yellow-500/20";
      case "LOW":
        return "bg-blue-950/40 text-blue-400 border border-blue-500/20";
      default:
        return "bg-slate-900 text-slate-400 border border-slate-700";
    }
  };

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 flex flex-col scanline">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Title */}
        <div className="border-b border-cyan-500/10 pb-4">
          <h1 className="text-xl font-mono font-bold tracking-wider text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-cyan-400" />
            <span>CVE VULNERABILITY CATALOG</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">Search the National Vulnerability Database catalog index for patches and CVE CVSS severity scores</p>
        </div>

        {/* Input Form */}
        <div className="cyber-panel p-6 rounded-lg space-y-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              
              {/* Query field */}
              <div className="md:col-span-2 relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. Log4j or CVE-2024"
                  required
                  className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-9 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-[#00E5FF] font-mono transition duration-200"
                />
              </div>

              {/* Severity Dropdown */}
              <div>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/60 rounded px-3 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-[#00E5FF] h-[42px]"
                >
                  <option value="">All Severities</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>

              {/* Sort Dropdown */}
              <div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/60 rounded px-3 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-[#00E5FF] h-[42px]"
                >
                  <option value="LATEST">Sort by Published Date</option>
                  <option value="SEVERITY">Sort by CVSS Score</option>
                </select>
              </div>

            </div>

            <div className="flex items-center justify-between border-t border-slate-800 pt-4">
              <span className="text-[10px] text-slate-500 font-mono">Normalized using CVSS Version 3.1 rating models</span>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-[#00E5FF] hover:from-cyan-600 hover:to-[#00D0EB] text-slate-950 font-mono text-xs font-bold tracking-widest uppercase rounded shadow-[0_0_10px_rgba(0,229,255,0.2)] transition cursor-pointer"
              >
                {loading ? "SEARCHING CATALOG..." : "QUERY CVE"}
              </button>
            </div>
          </form>

          {error && (
            <div className="p-3 bg-red-950/40 border border-red-500/40 rounded flex items-center text-xs text-red-400 font-mono">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Results Block */}
        {result && (
          <div className="space-y-6">
            
            {/* Header results and copy action */}
            <div className="flex items-center justify-between border-b border-cyan-500/10 pb-3">
              <div className="font-mono text-xs text-slate-400">
                Found <strong className="text-cyan-400">{result.count}</strong> vulnerabilities matching criteria
              </div>
              <button 
                onClick={copyToClipboard}
                className="px-2.5 py-1 bg-slate-900 border border-slate-700/60 rounded text-[10px] font-mono text-slate-300 hover:border-cyan-400 flex items-center gap-1 cursor-pointer transition"
              >
                <Clipboard className="w-3.5 h-3.5" />
                <span>{copied ? "COPIED" : "COPY RAW JSON"}</span>
              </button>
            </div>

            {/* List of Vulnerabilities */}
            <div className="grid grid-cols-1 gap-4">
              {result.results?.map((cve: any) => (
                <div key={cve.cveId} className="cyber-panel p-5 rounded-lg space-y-4">
                  
                  {/* CVE Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold text-white tracking-wider">{cve.cveId}</span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${getSeverityBadgeColor(cve.metrics.cvssMetricV31.severity)}`}>
                        {cve.metrics.cvssMetricV31.severity} ({cve.metrics.cvssMetricV31.score})
                      </span>
                    </div>
                    <div className="font-mono text-[10px] text-slate-500">
                      Published: {new Date(cve.published).toLocaleDateString()} | Modified: {new Date(cve.lastModified).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-slate-300 text-xs font-mono leading-relaxed select-all">
                    {cve.descriptions}
                  </p>

                  {/* Vectors and Source */}
                  <div className="flex flex-wrap gap-4 font-mono text-[10px] text-slate-500">
                    <span>Source: <strong className="text-slate-400">{cve.sourceIdentifier}</strong></span>
                    <span>Vector: <strong className="text-slate-400">{cve.metrics.cvssMetricV31.vectorString}</strong></span>
                    <span>Status: <strong className="text-cyan-400">{cve.vulnStatus}</strong></span>
                  </div>

                </div>
              ))}

              {result.count === 0 && (
                <div className="cyber-panel p-8 text-center text-slate-500 font-mono text-xs rounded-lg">
                  No vulnerabilities discovered in current local registry matching query.
                </div>
              )}
            </div>

          </div>
        )}

      </main>
    </div>
  );
}
