"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/dashboard/Navbar";
import { Shield, Clock, UserCheck, Activity, Users, FileText, Globe, Key, AlertTriangle } from "lucide-react";

export default function AdminConsole() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAdminLogs();
  }, []);

  const fetchAdminLogs = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/admin");
      const logs = await res.json();
      
      if (!res.ok) {
        throw new Error(logs.error || "Failed to load audit trails");
      }
      setData(logs);
    } catch (err: any) {
      setError(err.message || "Forbidden or Database connection failure");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080C14] text-slate-200 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center space-y-4 scanline">
          <Activity className="w-8 h-8 text-[#00E5FF] animate-spin" />
          <p className="font-mono text-xs text-cyan-400 tracking-widest animate-pulse">
            AUTHENTICATING ADMINISTRATIVE CREDENTIALS...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#080C14] text-slate-200 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center space-y-4 scanline px-6">
          <div className="cyber-panel p-8 rounded-lg max-w-md text-center space-y-4 border-red-500/25">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto animate-bounce" />
            <h2 className="font-mono text-sm font-bold text-red-400 tracking-widest uppercase">
              SECURITY FAULT: ACCESS FORBIDDEN
            </h2>
            <p className="font-mono text-xs text-slate-400 leading-relaxed">
              {error}. Administrative authorization claims were rejected. This event has been logged on the system audit ledger.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 flex flex-col scanline">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Title */}
        <div className="border-b border-cyan-500/10 pb-4">
          <h1 className="text-xl font-mono font-bold tracking-wider text-red-400 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            <span>OPERATIONAL AUDIT & CONTROL</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">Review active system audit logs, user registries, and resource utilization</p>
        </div>

        {/* Admin metrics cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="cyber-panel p-5 rounded-lg border-red-500/10">
            <div className="flex items-center justify-between text-slate-400 font-mono text-[10px]">
              <span>OPERATOR ROSTER</span>
              <Users className="w-4 h-4 text-red-400" />
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-2xl font-black text-white">{data?.metrics?.totalUsers || 0}</span>
              <span className="text-[9px] text-red-400 font-mono">USERS</span>
            </div>
          </div>

          <div className="cyber-panel p-5 rounded-lg border-red-500/10">
            <div className="flex items-center justify-between text-slate-400 font-mono text-[10px]">
              <span>RECON ACTIONS LOGGED</span>
              <Globe className="w-4 h-4 text-red-400" />
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-2xl font-black text-white">
                {(data?.metrics?.whoisTotal || 0) + (data?.metrics?.dnsTotal || 0) + (data?.metrics?.sslTotal || 0)}
              </span>
              <span className="text-[9px] text-red-400 font-mono">QUERIES</span>
            </div>
          </div>

          <div className="cyber-panel p-5 rounded-lg border-red-500/10">
            <div className="flex items-center justify-between text-slate-400 font-mono text-[10px]">
              <span>NMAP SCAN INGESTS</span>
              <FileText className="w-4 h-4 text-red-400" />
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-2xl font-black text-white">{data?.metrics?.reportsTotal || 0}</span>
              <span className="text-[9px] text-red-400 font-mono">REPORTS</span>
            </div>
          </div>

          <div className="cyber-panel p-5 rounded-lg border-red-500/10">
            <div className="flex items-center justify-between text-slate-400 font-mono text-[10px]">
              <span>AUDIT CHAIN EVENTS</span>
              <Activity className="w-4 h-4 text-red-400" />
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-2xl font-black text-white">{data?.metrics?.auditLogsTotal || 0}</span>
              <span className="text-[9px] text-red-400 font-mono">EVENTS</span>
            </div>
          </div>
        </div>

        {/* Double tables grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* User Roster */}
          <div className="cyber-panel p-6 rounded-lg lg:col-span-1">
            <h3 className="font-mono text-xs font-bold text-slate-200 mb-4 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-red-400" /> OPERATOR REGISTRY
            </h3>
            <div className="space-y-4">
              {data?.users?.map((user: any) => (
                <div key={user.id} className="p-3 bg-slate-950/40 border border-slate-800 rounded flex flex-col space-y-1 text-[11px] font-mono">
                  <div className="flex justify-between items-center text-slate-200 font-bold">
                    <span>{user.name}</span>
                    <span className={`text-[9px] px-1 py-0.5 rounded ${
                      user.role === "ADMIN" ? "bg-red-950 text-red-400 border border-red-500/20" : "bg-slate-900 text-slate-400 border border-slate-700"
                    }`}>
                      {user.role}
                    </span>
                  </div>
                  <div className="text-slate-500">{user.email}</div>
                  <div className="text-[9px] text-cyan-400/80 pt-1.5 flex gap-2">
                    <span>{user._count?.whoisSearches || 0} WHOIS</span>
                    <span>{user._count?.dnsSearches || 0} DNS</span>
                    <span>{user._count?.reports || 0} Nmap</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Audit Logs */}
          <div className="cyber-panel p-6 rounded-lg lg:col-span-2">
            <h3 className="font-mono text-xs font-bold text-slate-200 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-red-400" /> SYSTEM AUDIT LOG LEDGER
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-[11px] text-slate-400">
                <thead>
                  <tr className="border-b border-red-500/10 text-slate-300">
                    <th className="pb-2">TIMESTAMP</th>
                    <th className="pb-2">OPERATOR</th>
                    <th className="pb-2">ACTION EVENT</th>
                    <th className="pb-2 text-right">SOURCE IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {data?.auditLogs?.map((log: any) => (
                    <tr key={log.id} className="hover:bg-slate-900/15">
                      <td className="py-2.5 text-slate-500">
                        {new Date(log.createdAt).toISOString().replace("T", " ").substring(0, 19)}
                      </td>
                      <td className="py-2.5 text-slate-300">
                        {log.user?.name || log.user?.email || "SYSTEM_DAEMON"}
                      </td>
                      <td className="py-2.5 text-red-400/90 font-semibold">{log.action}</td>
                      <td className="py-2.5 text-right text-slate-500">{log.ipAddress || "127.0.0.1"}</td>
                    </tr>
                  ))}
                  {!data?.auditLogs?.length && (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-slate-600">No events logged on administrative ledger.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
export const runtime = "nodejs";
