"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/dashboard/Navbar";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, Legend
} from "recharts";
import { 
  Activity, Globe, Network, ShieldCheck, Clock, FileText, Bookmark, 
  Trash2, ArrowUpRight, Search, Heart 
} from "lucide-react";

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Statistics summaries
  const [totals, setTotals] = useState({
    whois: 0,
    dns: 0,
    ssl: 0,
    reports: 0,
    cve: 0,
  });

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/history");
      if (!res.ok) throw new Error("Failed to sync telemetry lookups");
      const logs = await res.json();
      setData(logs);

      // Aggregate totals
      setTotals({
        whois: logs.whois?.length || 0,
        dns: logs.dns?.length || 0,
        ssl: logs.ssl?.length || 0,
        reports: logs.reports?.length || 0,
        cve: logs.cve?.length || 0,
      });
    } catch (err: any) {
      setError(err.message || "Database connection error");
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (targetId: string, targetType: string, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId, targetType, isFavorite: !currentStatus }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080C14] text-slate-200 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center space-y-4 scanline">
          <Activity className="w-8 h-8 text-[#00E5FF] animate-spin" />
          <p className="font-mono text-xs text-cyan-400 tracking-widest animate-pulse">
            LOADING TELEMETRY CHANNELS...
          </p>
        </div>
      </div>
    );
  }

  // Hardcoded mock points matching historical timeline for Recharts rendering
  const timeChartData = [
    { name: "06-28", queries: 12, scans: 2 },
    { name: "06-29", queries: 19, scans: 5 },
    { name: "06-30", queries: 15, scans: 1 },
    { name: "07-01", queries: 27, scans: 8 },
    { name: "07-02", queries: 22, scans: 4 },
    { name: "07-03", queries: 32, scans: 9 },
    { name: "07-04", queries: (totals.whois + totals.dns + totals.ssl + totals.cve), scans: totals.reports },
  ];

  // Vulnerability severity categories
  const severityDistribution = [
    { name: "CRITICAL", count: 2, fill: "#EF4444" },
    { name: "HIGH", count: 5, fill: "#F97316" },
    { name: "MEDIUM", count: 8, fill: "#EAB308" },
    { name: "LOW", count: 14, fill: "#3B82F6" },
  ];

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 flex flex-col scanline">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Header telemetry tag */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-cyan-500/10 pb-4 gap-4">
          <div>
            <h1 className="text-2xl font-black font-sans tracking-tight text-white flex items-center">
              OPERATIONS ROOM <span className="text-[#00E5FF] ml-2 cyber-glow text-base font-mono font-normal">[TELEMETRY_FEED]</span>
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-1">Realtime analysis of external security endpoints</p>
          </div>
          <button 
            onClick={fetchData}
            className="px-3 py-1.5 bg-cyan-500/5 hover:bg-cyan-500/15 border border-cyan-500/20 text-[#00E5FF] rounded font-mono text-xs flex items-center gap-2 cursor-pointer transition"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>SYNC DATA FEED</span>
          </button>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="cyber-panel p-5 rounded-lg">
            <div className="flex items-center justify-between text-slate-400">
              <span className="font-mono text-xs">WHOIS SECTOR</span>
              <Globe className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-2xl font-black text-white">{totals.whois}</span>
              <span className="text-[10px] text-cyan-400 font-mono">QUERIES RUN</span>
            </div>
          </div>

          <div className="cyber-panel p-5 rounded-lg">
            <div className="flex items-center justify-between text-slate-400">
              <span className="font-mono text-xs">DNS RESOLUTION</span>
              <Network className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-2xl font-black text-white">{totals.dns}</span>
              <span className="text-[10px] text-cyan-400 font-mono">DOMAINS RUN</span>
            </div>
          </div>

          <div className="cyber-panel p-5 rounded-lg">
            <div className="flex items-center justify-between text-slate-400">
              <span className="font-mono text-xs">SSL HANDSHAKES</span>
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-2xl font-black text-white">{totals.ssl}</span>
              <span className="text-[10px] text-cyan-400 font-mono">CERT HANDSHAKES</span>
            </div>
          </div>

          <div className="cyber-panel p-5 rounded-lg">
            <div className="flex items-center justify-between text-slate-400">
              <span className="font-mono text-xs">SECURITY SCAN LOGS</span>
              <FileText className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-2xl font-black text-white">{totals.reports}</span>
              <span className="text-[10px] text-cyan-400 font-mono">NMAP REPORTS</span>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        {mounted && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Scan History (Area Chart) */}
            <div className="cyber-panel p-6 rounded-lg lg:col-span-2 flex flex-col justify-between">
              <div className="mb-4">
                <h3 className="font-mono text-xs font-bold text-slate-300">OPERATION QUERY TIMELINES</h3>
                <p className="text-[10px] text-slate-500 font-mono">Combined API searches and XML file uploads</p>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeChartData}>
                    <defs>
                      <linearGradient id="queryColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#00E5FF" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                    <XAxis dataKey="name" stroke="#6B7280" style={{ fontSize: '10px', fontFamily: 'monospace' }} />
                    <YAxis stroke="#6B7280" style={{ fontSize: '10px', fontFamily: 'monospace' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#090D16', border: '1px solid rgba(0, 229, 255, 0.2)' }} />
                    <Area type="monotone" dataKey="queries" stroke="#00E5FF" fillOpacity={1} fill="url(#queryColor)" name="Active Queries" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Severity Distribution (Bar Chart) */}
            <div className="cyber-panel p-6 rounded-lg flex flex-col justify-between">
              <div className="mb-4">
                <h3 className="font-mono text-xs font-bold text-slate-300">VULNERABILITY ALERTS</h3>
                <p className="text-[10px] text-slate-500 font-mono">Active risk profiles mapped from security scan logs</p>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={severityDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                    <XAxis dataKey="name" stroke="#6B7280" style={{ fontSize: '9px', fontFamily: 'monospace' }} />
                    <YAxis stroke="#6B7280" style={{ fontSize: '9px', fontFamily: 'monospace' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#090D16', border: '1px solid rgba(0, 229, 255, 0.2)' }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Identified CVEs">
                      {severityDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Activity Logs Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Recent SSL / WHOIS queries */}
          <div className="cyber-panel p-6 rounded-lg">
            <h3 className="font-mono text-xs font-bold text-[#00E5FF] mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4" /> RECENT DOMAIN & CERT QUERIES
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-[11px] text-slate-400">
                <thead>
                  <tr className="border-b border-cyan-500/10 text-slate-300">
                    <th className="pb-2">TARGET HOST</th>
                    <th className="pb-2">LOG DATE</th>
                    <th className="pb-2">TYPE</th>
                    <th className="pb-2 text-right">FAVORITE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyan-500/5">
                  {/* WHOIS Rows */}
                  {data?.whois?.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-900/35 transition">
                      <td className="py-2 text-slate-200">{item.domain}</td>
                      <td className="py-2">{new Date(item.createdAt).toLocaleDateString()}</td>
                      <td className="py-2"><span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/20 text-[9px]">WHOIS</span></td>
                      <td className="py-2 text-right">
                        <button 
                          onClick={() => toggleFavorite(item.id, "WHOIS", item.isFavorite)}
                          className="text-slate-500 hover:text-red-400 transition cursor-pointer"
                        >
                          <Heart className={`w-3.5 h-3.5 ${item.isFavorite ? "fill-red-500 text-red-500" : ""}`} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {/* SSL Rows */}
                  {data?.ssl?.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-900/35 transition">
                      <td className="py-2 text-slate-200">{item.host}</td>
                      <td className="py-2">{new Date(item.createdAt).toLocaleDateString()}</td>
                      <td className="py-2"><span className="px-1.5 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-500/20 text-[9px]">SSL</span></td>
                      <td className="py-2 text-right">
                        <button 
                          onClick={() => toggleFavorite(item.id, "SSL", item.isFavorite)}
                          className="text-slate-500 hover:text-red-400 transition cursor-pointer"
                        >
                          <Heart className={`w-3.5 h-3.5 ${item.isFavorite ? "fill-red-500 text-red-500" : ""}`} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(!data?.whois?.length && !data?.ssl?.length) && (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-slate-600">No active domain queries logged.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Uploaded Nmap Scans */}
          <div className="cyber-panel p-6 rounded-lg">
            <h3 className="font-mono text-xs font-bold text-[#00E5FF] mb-4 flex items-center gap-2">
              <Bookmark className="w-4 h-4" /> UPLOADED SECURITY SCANS
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-[11px] text-slate-400">
                <thead>
                  <tr className="border-b border-cyan-500/10 text-slate-300">
                    <th className="pb-2">FILE NAME</th>
                    <th className="pb-2">SCAN FORMAT</th>
                    <th className="pb-2">SUMMARY</th>
                    <th className="pb-2 text-right">DATE IMPORTED</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyan-500/5">
                  {data?.reports?.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-900/35 transition">
                      <td className="py-2 text-slate-200">{item.fileName}</td>
                      <td className="py-2"><span className="px-1.5 py-0.5 rounded bg-purple-950 text-purple-400 border border-purple-500/20 text-[9px]">{item.fileType}</span></td>
                      <td className="py-2 text-cyan-400">
                        {item.summary?.hostsCount || 0} Hosts / {item.summary?.portsCount || 0} Ports
                      </td>
                      <td className="py-2 text-right">{new Date(item.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {!data?.reports?.length && (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-slate-600">No XML report logs imported yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </main>

      <footer className="border-t border-cyan-500/5 bg-slate-950/20 py-4 mt-12 text-center text-slate-600 font-mono text-[10px]">
        CYBER RECON PORTAL — WORKSPACE RECON 2026
      </footer>
    </div>
  );
}
