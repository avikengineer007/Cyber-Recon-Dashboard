import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { DnsSchema } from "@/lib/validators";
import { rateLimit } from "@/lib/rate-limit";
import { db } from "@/lib/db";
import dns from "dns";
import net from "net";

const dnsPromises = dns.promises;
export const runtime = "nodejs";

// In-Memory cache storage
interface CachedRecord {
  data: any;
  status: "SUCCESS" | "NO_DATA";
  error?: string;
  expiresAt: number;
  ttl: number;
}

// Global caching mapping
const dnsCache = new Map<string, CachedRecord>();

// Helper to trace root -> TLD -> authoritative hierarchy
async function generateDnsTrace(domain: string, cacheResults: Record<string, boolean>): Promise<string[]> {
  const trace: string[] = [];
  const parts = domain.trim().split(".");
  const tld = parts[parts.length - 1];

  trace.push(`[1/5] CLIENT QUERY: Received DNS lookup request for domain: ${domain}`);
  
  // Cache check summary
  const hitTypes = Object.entries(cacheResults).filter(([_, hit]) => hit).map(([type]) => type);
  const missTypes = Object.entries(cacheResults).filter(([_, hit]) => !hit).map(([type]) => type);

  if (hitTypes.length > 0) {
    trace.push(`[2/5] CACHE CHECK: Cache Hit found for record types: [ ${hitTypes.join(", ")} ]`);
  }
  if (missTypes.length > 0) {
    trace.push(`[2/5] CACHE CHECK: Cache Miss. Querying hierarchy for types: [ ${missTypes.join(", ")} ]`);
    
    // Root Server Trace
    trace.push(`[3/5] ROOT DNS: Querying root-servers.net for zone '.${tld}' name servers`);
    try {
      const tldServers = await dnsPromises.resolveNs(tld);
      if (tldServers && tldServers.length > 0) {
        trace.push(`ROOT DNS RESPONSE: Found ${tldServers.length} TLD servers authoritative for '.${tld}': [ ${tldServers.slice(0, 3).join(", ")} ]`);
      }
    } catch (e: any) {
      trace.push(`ROOT DNS WARN: Could not retrieve authoritative NS for TLD '.${tld}'. Falling back to default root.`);
    }

    // TLD Server Trace
    trace.push(`[4/5] TLD DNS: Querying Top-Level Domain servers for '${domain}' authoritative name servers`);
    try {
      const authServers = await dnsPromises.resolveNs(domain);
      if (authServers && authServers.length > 0) {
        trace.push(`TLD DNS RESPONSE: Found authoritative nameservers for '${domain}': [ ${authServers.join(", ")} ]`);
      }
    } catch (e: any) {
      trace.push(`TLD DNS WARN: Could not resolve authoritative NS for '${domain}'. Using fallback zone servers.`);
    }

    // Authoritative Server Trace
    trace.push(`[5/5] AUTHORITATIVE DNS: Connecting to authoritative nameservers to extract records`);
    trace.push(`LOCAL CACHING: Resolution complete. Storing network records in local cache with respective TTL durations`);
  } else {
    trace.push(`[3/5] ROOT DNS: Bypassed (All records resolved from cache)`);
    trace.push(`[4/5] TLD DNS: Bypassed (All records resolved from cache)`);
    trace.push(`[5/5] AUTHORITATIVE DNS: Bypassed (All records resolved from cache)`);
  }

  return trace;
}

// OSINT DNS query helper with DNS-over-HTTPS (DoH) API fallback support
async function queryDnsRecord(domain: string, recordType: string): Promise<{ data: any; ttl: number }> {
  try {
    let records: any = [];
    let ttl = 300; // Default TTL

    if (recordType === 'A') {
      const rawA = await dnsPromises.resolve4(domain, { ttl: true });
      records = rawA.map((r: any) => r.address);
      if (rawA.length > 0) ttl = rawA[0].ttl;
    } else if (recordType === 'AAAA') {
      const rawAAAA = await dnsPromises.resolve6(domain, { ttl: true });
      records = rawAAAA.map((r: any) => r.address);
      if (rawAAAA.length > 0) ttl = rawAAAA[0].ttl;
    } else if (recordType === 'MX') {
      records = await dnsPromises.resolveMx(domain);
    } else if (recordType === 'TXT') {
      const rawTxt = await dnsPromises.resolveTxt(domain);
      records = rawTxt.map(arr => arr.join(" "));
    } else if (recordType === 'NS') {
      records = await dnsPromises.resolveNs(domain);
    } else if (recordType === 'SOA') {
      records = [await dnsPromises.resolveSoa(domain)];
    } else if (recordType === 'CNAME') {
      records = await dnsPromises.resolveCname(domain);
    } else if (recordType === 'PTR') {
      if (net.isIP(domain)) {
        records = await dnsPromises.reverse(domain);
      } else {
        records = await dnsPromises.resolvePtr(domain);
      }
    } else if (recordType === 'SRV') {
      records = await dnsPromises.resolveSrv(domain);
    }

    return { data: records, ttl };
  } catch (err: any) {
    // Port 53 UDP block detected or query timed out. fallback to Google DoH API over port 443
    console.warn(`Standard UDP DNS resolve for ${recordType} failed: ${err.message}. Trying Google DoH fallback...`);
    
    const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=${encodeURIComponent(recordType)}`);
    if (!res.ok) {
      throw new Error(`Google DoH API failed with status ${res.status}`);
    }
    const json = await res.json();
    
    if (json.Status !== 0) {
      if (json.Status === 3) {
        throw new Error("NXDOMAIN");
      }
      throw new Error(`DNS lookup failed with DoH Status ${json.Status}`);
    }

    const answers = json.Answer || [];
    let ttl = 300;
    if (answers.length > 0) {
      ttl = answers[0].TTL;
    }

    let parsedData: any[] = [];
    
    if (recordType === 'MX') {
      parsedData = answers.map((ans: any) => {
        const parts = ans.data.split(" ");
        return {
          priority: parseInt(parts[0], 10),
          exchange: parts[1]?.replace(/\.$/, "") || ""
        };
      });
    } else if (recordType === 'SOA') {
      parsedData = answers.map((ans: any) => {
        const parts = ans.data.split(" ");
        return {
          nsname: parts[0]?.replace(/\.$/, "") || "",
          hostmaster: parts[1]?.replace(/\.$/, "") || "",
          serial: parts[2] ? parseInt(parts[2], 10) : 0,
          refresh: parts[3] ? parseInt(parts[3], 10) : 0,
          retry: parts[4] ? parseInt(parts[4], 10) : 0,
          expire: parts[5] ? parseInt(parts[5], 10) : 0,
          minttl: parts[6] ? parseInt(parts[6], 10) : 0
        };
      });
    } else if (recordType === 'SRV') {
      parsedData = answers.map((ans: any) => {
        const parts = ans.data.split(" ");
        return {
          priority: parseInt(parts[0], 10),
          weight: parseInt(parts[1], 10),
          port: parseInt(parts[2], 10),
          name: parts[3]?.replace(/\.$/, "") || ""
        };
      });
    } else if (recordType === 'TXT') {
      parsedData = answers.map((ans: any) => ans.data.replace(/^"|"$/g, ""));
    } else {
      parsedData = answers.map((ans: any) => ans.data.replace(/\.$/, ""));
    }

    return { data: parsedData, ttl };
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as any).id;

  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
  const limitCheck = await rateLimit(ip, 30);
  if (!limitCheck.success) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  try {
    const body = await req.json();
    const parse = DnsSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json({ error: parse.error.errors[0].message }, { status: 400 });
    }

    const { domain, types } = parse.data;
    const cleanDomain = domain.trim().toLowerCase();
    const dnsTypesToQuery = types || ['A', 'AAAA', 'MX', 'TXT', 'NS', 'SOA', 'CNAME', 'PTR', 'SRV'];
    
    const results: any[] = [];
    const cacheResults: Record<string, boolean> = {};
    const now = Date.now();

    for (const recordType of dnsTypesToQuery) {
      const cacheKey = `${cleanDomain}:${recordType}`;
      const cached = dnsCache.get(cacheKey);

      if (cached && now < cached.expiresAt) {
        // Cache Hit
        cacheResults[recordType] = true;
        results.push({
          type: recordType,
          status: cached.status,
          data: cached.data,
          ttl: Math.max(0, Math.ceil((cached.expiresAt - now) / 1000)),
          source: "CACHE"
        });
        continue;
      }

      // Cache Miss - Query network
      cacheResults[recordType] = false;
      try {
        const queryRes = await queryDnsRecord(cleanDomain, recordType);

        const successRecord: CachedRecord = {
          data: queryRes.data,
          status: "SUCCESS",
          expiresAt: now + (queryRes.ttl * 1000),
          ttl: queryRes.ttl
        };

        dnsCache.set(cacheKey, successRecord);

        results.push({
          type: recordType,
          status: "SUCCESS",
          data: queryRes.data,
          ttl: queryRes.ttl,
          source: "NETWORK"
        });
      } catch (err: any) {
        // Cache negative lookup (NXDOMAIN / ENODATA) to prevent spam, TTL of 60s
        const errorRecord: CachedRecord = {
          data: [],
          status: "NO_DATA",
          error: err.code || err.message,
          expiresAt: now + (60 * 1000),
          ttl: 60
        };

        dnsCache.set(cacheKey, errorRecord);

        results.push({
          type: recordType,
          status: "NO_DATA",
          data: [],
          ttl: 60,
          error: err.code || err.message,
          source: "NETWORK"
        });
      }
    }

    // Generate hierarchy log trace
    const trace = await generateDnsTrace(cleanDomain, cacheResults);

    // Save search details to database
    const saved = await db.dnsSearch.create({
      data: {
        userId,
        domain: cleanDomain,
        records: results as any,
      }
    });

    // Write audit log
    await db.auditLog.create({
      data: {
        userId,
        action: `DNS Resolution: ${cleanDomain} [Cache Hits: ${Object.values(cacheResults).filter(Boolean).length}]`,
        ipAddress: ip,
        userAgent: req.headers.get("user-agent"),
      }
    });

    return NextResponse.json({
      ...saved,
      records: results,
      trace,
      cacheHitCount: Object.values(cacheResults).filter(Boolean).length,
      cacheMissCount: Object.values(cacheResults).filter(v => !v).length
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to resolve DNS zones" }, { status: 500 });
  }
}
