"use client";

import React, { useState } from "react";
import Navbar from "@/components/dashboard/Navbar";
import { Upload, FileText, Activity, AlertCircle, Clipboard, Download, ArrowDownToLine, RefreshCw } from "lucide-react";

export default function ReportsTool() {
  const [file, setFile] = useState<File | null>(null);
  const [reportType, setReportType] = useState("NMAP");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError("");
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please attach a valid XML scanner output log file");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setCopied(false);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", reportType);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to process scan xml file");
      }
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to establish ingestion channel");
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

  const downloadCSV = () => {
    if (!result || !result.rawData) return;
    
    // Compile hosts and open ports to CSV
    let csvRows = ["Host Address,Host Status,Port Number,Protocol,State,Service,Product,Version"];
    
    result.rawData.forEach((host: any) => {
      if (host.ports && host.ports.length > 0) {
        host.ports.forEach((p: any) => {
          csvRows.push(`"${host.address}","${host.status}","${p.port}","${p.protocol}","${p.state}","${p.service}","${p.product}","${p.version}"`);
        });
      } else {
        csvRows.push(`"${host.address}","${host.status}","N/A","N/A","N/A","N/A","N/A","N/A"`);
      }
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `recon_report_${result.id || "export"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 flex flex-col scanline">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Title */}
        <div className="border-b border-cyan-500/10 pb-4">
          <h1 className="text-xl font-mono font-bold tracking-wider text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <span>NMAP XML INGEST PORTAL</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">Upload and parse XML reports in-memory to build dynamic network topology tables</p>
        </div>

        {/* Upload Form */}
        <div className="cyber-panel p-6 rounded-lg">
          <form onSubmit={handleUpload} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* File Dropzone */}
              <div className="md:col-span-2">
                <label className="block text-xs font-mono text-slate-400 mb-2">SCANNER OUTPUT LOG (XML)</label>
                <div className="border-2 border-dashed border-slate-700/60 hover:border-cyan-500/40 rounded-lg p-6 bg-slate-950/20 flex flex-col items-center justify-center text-center cursor-pointer relative group transition">
                  <input
                    type="file"
                    accept=".xml"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="w-8 h-8 text-slate-500 group-hover:text-cyan-400 mb-2 transition" />
                  <span className="text-xs font-mono text-slate-300">
                    {file ? file.name : "DRAG & DROP OR CLICK TO CHOOSE SCAN LOG"}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono mt-1">Maximum file size 8MB</span>
                </div>
              </div>

              {/* Scan Format Selector */}
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-2">SCANNER FORMAT</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-[#00E5FF] h-[82px] cursor-pointer"
                >
                  <option value="NMAP">NMAP (Network Mapper XML)</option>
                  <option value="NESSUS">NESSUS (Vulnerability Manager XML)</option>
                  <option value="OPENVAS">OPENVAS (Greenbone Vulnerability XML)</option>
                </select>
              </div>

            </div>

            <div className="flex items-center justify-between border-t border-slate-800 pt-4">
              <span className="text-[10px] text-slate-500 font-mono">Stream parsed securely — No files saved to local server filesystems</span>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-[#00E5FF] hover:from-cyan-600 hover:to-[#00D0EB] text-slate-950 font-mono text-xs font-bold tracking-widest uppercase rounded shadow-[0_0_10px_rgba(0,229,255,0.2)] transition cursor-pointer"
              >
                {loading ? "PARSING LOG FIELDS..." : "INGEST REPORT"}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 p-3 bg-red-950/40 border border-red-500/40 rounded flex items-center text-xs text-red-400 font-mono">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Results Block */}
        {result && (
          <div className="space-y-6">
            
            {/* Header summary and download actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-cyan-500/10 pb-4 gap-4">
              <div>
                <h2 className="font-mono text-sm font-bold text-white uppercase flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span>PARSED METRICS SUMMARY</span>
                </h2>
                <div className="flex gap-4 font-mono text-[10px] text-slate-400 mt-1">
                  <span>File: <strong className="text-slate-200">{result.fileName}</strong></span>
                  <span>Hosts: <strong className="text-cyan-400">{result.summary?.hostsCount || 0}</strong></span>
                  <span>Open Ports: <strong className="text-cyan-400">{result.summary?.portsCount || 0}</strong></span>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={copyToClipboard}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-700/60 rounded text-xs font-mono text-slate-300 hover:border-cyan-400 flex items-center gap-1.5 cursor-pointer transition"
                >
                  <Clipboard className="w-3.5 h-3.5" />
                  <span>{copied ? "COPIED JSON" : "COPY RAW JSON"}</span>
                </button>
                <button 
                  onClick={downloadCSV}
                  className="px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 text-[#00E5FF] rounded text-xs font-mono hover:bg-cyan-500/20 flex items-center gap-1.5 cursor-pointer transition"
                >
                  <ArrowDownToLine className="w-3.5 h-3.5" />
                  <span>DOWNLOAD CSV</span>
                </button>
              </div>
            </div>

            {/* Network Topology Host Details */}
            <div className="cyber-panel rounded-lg overflow-hidden">
              <div className="bg-slate-950/45 px-6 py-3 border-b border-slate-800">
                <span className="font-mono text-xs font-bold text-cyan-400">ACTIVE NETWORK HOSTS & PORT STATES</span>
              </div>
              <div className="p-6 space-y-6">
                {result.rawData?.map((host: any, hIdx: number) => (
                  <div key={hIdx} className="border border-slate-800 rounded overflow-hidden">
                    {/* Host Header */}
                    <div className="bg-slate-900/40 px-4 py-2 flex justify-between items-center border-b border-slate-800">
                      <span className="font-mono text-xs font-bold text-white">{host.address}</span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                        host.status === "up" ? "bg-green-950/40 text-green-400 border border-green-500/20" : "bg-red-950/40 text-red-400 border border-red-500/20"
                      }`}>
                        HOST_{host.status.toUpperCase()}
                      </span>
                    </div>

                    {/* Host Ports Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left font-mono text-xs text-slate-400">
                        <thead>
                          <tr className="bg-slate-950/20 border-b border-slate-800 text-slate-400 text-[10px]">
                            <th className="px-4 py-2">PORT</th>
                            <th className="px-4 py-2">PROTOCOL</th>
                            <th className="px-4 py-2">STATE</th>
                            <th className="px-4 py-2">SERVICE</th>
                            <th className="px-4 py-2">PRODUCT</th>
                            <th className="px-4 py-2">VERSION</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {host.ports?.map((p: any, pIdx: number) => (
                            <tr key={pIdx} className="hover:bg-slate-900/20">
                              <td className="px-4 py-2 text-white font-bold">{p.port}</td>
                              <td className="px-4 py-2">{p.protocol.toUpperCase()}</td>
                              <td className="px-4 py-2">
                                <span className={`px-1 py-0.5 rounded text-[10px] ${
                                  p.state === "open" ? "text-green-400 bg-green-950/20" : "text-yellow-400 bg-yellow-950/20"
                                }`}>
                                  {p.state}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-cyan-400">{p.service}</td>
                              <td className="px-4 py-2 text-slate-300">{p.product || "-"}</td>
                              <td className="px-4 py-2">{p.version || "-"}</td>
                            </tr>
                          ))}
                          {!host.ports?.length && (
                            <tr>
                              <td colSpan={6} className="px-4 py-3 text-center text-slate-600 text-[10px]">
                                No active open ports discovered.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}
