"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Terminal, Shield, LogOut, LayoutDashboard, Globe, Network, Lock, FileText, Search, BookOpen } from "lucide-react";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const user = session?.user as any;
  const role = user?.role || "USER";

  const navigation = [
    { name: "Telemetry", href: "/dashboard", icon: LayoutDashboard },
    { name: "WHOIS", href: "/tools/whois", icon: Globe },
    { name: "DNS", href: "/tools/dns", icon: Network },
    { name: "SSL TLS", href: "/tools/ssl", icon: Lock },
    { name: "Ingest Logs", href: "/tools/reports", icon: FileText },
    { name: "CVE Lookup", href: "/tools/cve", icon: Search },
    { name: "Threat Intel", href: "/blog", icon: BookOpen },
  ];

  return (
    <nav className="w-full bg-[#090D16] border-b border-cyan-500/10 sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center space-x-2 mr-8">
              <Terminal className="w-6 h-6 text-[#00E5FF] filter drop-shadow-[0_0_5px_rgba(0,229,255,0.4)]" />
              <span className="font-mono text-base font-bold tracking-widest bg-gradient-to-r from-cyan-400 to-[#00E5FF] bg-clip-text text-transparent">
                CYBER PORTAL
              </span>
            </div>

            {/* Navigation links */}
            <div className="hidden md:flex space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded text-xs font-mono tracking-wider transition ${
                      isActive
                        ? "bg-cyan-500/10 text-[#00E5FF] border-b-2 border-cyan-400"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}

              {role === "ADMIN" && (
                <Link
                  href="/admin"
                  className={`flex items-center space-x-2 px-3 py-2 rounded text-xs font-mono tracking-wider transition ${
                    pathname === "/admin"
                      ? "bg-red-500/10 text-red-400 border-b-2 border-red-400"
                      : "text-slate-400 hover:text-red-400 hover:bg-slate-900/50"
                  }`}
                >
                  <Shield className="w-4 h-4 text-red-500" />
                  <span>Admin Control</span>
                </Link>
              )}
            </div>
          </div>

          {/* User info & Logout */}
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-slate-300 font-mono">
                {user?.name || user?.email}
              </div>
              <div className="flex items-center justify-end text-[10px] font-mono text-cyan-400/70">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse mr-1" />
                {role} ACCESS
              </div>
            </div>

            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="p-1.5 rounded border border-slate-700/60 hover:border-red-500/40 text-slate-400 hover:text-red-400 hover:bg-red-950/20 transition cursor-pointer"
              title="Terminate Handshake"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
