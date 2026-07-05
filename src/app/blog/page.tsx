"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/dashboard/Navbar";
import Link from "next/link";
import { BookOpen, Calendar, Clock, Tag, ArrowRight, ShieldCheck, Activity } from "lucide-react";

const MOCK_POSTS = [
  {
    id: "post-1",
    title: "The XZ Utils Backdoor: Analysis and Prevention",
    slug: "xz-utils-backdoor-analysis",
    content: "Detailed breakdown of the CVE-2024-3094 vulnerability targeting SSH authentication processes in system libraries...",
    readingTime: "8 min read",
    createdAt: "2024-03-30T09:00:00.000Z",
    categories: [{ name: "Supply Chain" }],
    tags: [{ name: "Backdoor" }, { name: "SSH" }, { name: "Linux" }]
  },
  {
    id: "post-2",
    title: "Understanding Log4Shell: The Anatomy of a Critical JNDI RCE",
    slug: "understanding-log4shell-rce",
    content: "An analysis of CVE-2021-44228: How recursive lookup parsing in Log4j logs enabled unauthenticated Remote Code Execution...",
    readingTime: "12 min read",
    createdAt: "2021-12-12T10:00:00.000Z",
    categories: [{ name: "Web Security" }],
    tags: [{ name: "RCE" }, { name: "Java" }, { name: "Log4j" }]
  },
  {
    id: "post-3",
    title: "Securing TLS/SSL Certificate Chains on Web Hosts",
    slug: "securing-tls-ssl-configurations",
    content: "Best practices for hardening public-facing web servers. Understanding handshake protocols, cipher suites, and key sizes...",
    readingTime: "5 min read",
    createdAt: "2023-11-05T14:30:00.000Z",
    categories: [{ name: "Hardening" }],
    tags: [{ name: "SSL" }, { name: "TLS" }, { name: "Certificates" }]
  }
];

export default function BlogList() {
  const [posts, setPosts] = useState<any[]>(MOCK_POSTS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Dynamic database fetch if seeded
    const fetchPosts = async () => {
      try {
        const res = await fetch("/api/blog");
        if (res.ok) {
          const dbPosts = await res.json();
          if (dbPosts && dbPosts.length > 0) {
            setPosts(dbPosts);
          }
        }
      } catch (err) {
        console.error("Failed to load blog posts from database, using local assets", err);
      }
    };
    fetchPosts();
  }, []);

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 flex flex-col scanline">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Title */}
        <div className="border-b border-cyan-500/10 pb-4">
          <h1 className="text-xl font-mono font-bold tracking-wider text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <span>THREAT INTELLIGENCE BLOG</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">Review tactical mitigation profiles, scan blueprints, and details compiled by cybersecurity architects</p>
        </div>

        {/* Feature Banner */}
        <div className="cyber-panel p-6 rounded-lg bg-gradient-to-r from-slate-950 to-slate-900/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#00E5FF]/5 rounded-full blur-3xl pointer-events-none" />
          <div className="max-w-2xl space-y-4">
            <span className="px-2 py-1 bg-red-950/40 border border-red-500/20 text-red-400 text-[9px] font-mono rounded tracking-widest uppercase font-bold">
              CRITICAL REPORT
            </span>
            <h2 className="text-xl font-mono font-bold text-white">SYSTEM LEVEL MITIGATION VULNERABILITY ARCHIVE</h2>
            <p className="text-xs text-slate-400 font-mono leading-relaxed">
              Active intel bulletins detailing supply chain backdoors, zero-day kernel exploits, cryptographic authentication failures, and custom audit methodologies for modern enterprise networks.
            </p>
          </div>
        </div>

        {/* Blog Post List */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.map((post) => (
            <div key={post.id} className="cyber-panel p-6 rounded-lg flex flex-col justify-between space-y-4 hover:border-cyan-500/30 transition duration-200">
              <div className="space-y-3">
                
                {/* Category & Date */}
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-cyan-400 uppercase font-semibold">
                    {post.categories?.[0]?.name || "Uncategorized"}
                  </span>
                  <span className="text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-mono text-sm font-bold text-white leading-snug hover:text-[#00E5FF] transition">
                  <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                </h3>

                {/* Blurb */}
                <p className="text-slate-400 text-xs font-mono line-clamp-3 leading-relaxed">
                  {post.content}
                </p>
              </div>

              {/* Footer info and link */}
              <div className="border-t border-slate-800 pt-3 flex items-center justify-between font-mono text-[10px]">
                <span className="text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {post.readingTime}
                </span>

                <Link href={`/blog/${post.slug}`} className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition">
                  <span>READ INTELLIGENCE</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>

      </main>
    </div>
  );
}
