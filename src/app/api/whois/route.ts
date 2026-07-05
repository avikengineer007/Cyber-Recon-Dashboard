import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { WhoisSchema } from "@/lib/validators";
import { rateLimit } from "@/lib/rate-limit";
import { db } from "@/lib/db";
import net from "net";

export const runtime = "nodejs";

// Exhaustive mapping of TLDs to their authoritative registry servers
const TLD_WHOIS_SERVERS: Record<string, string> = {
  com: "whois.verisign-grs.com",
  net: "whois.verisign-grs.com",
  org: "whois.pir.org",
  info: "whois.afilias.net",
  biz: "whois.nic.biz",
  us: "whois.nic.us",
  uk: "whois.nic.uk",
  ca: "whois.ca.fury.ca",
  in: "whois.nixiregistry.in",
  io: "whois.nic.io",
  co: "whois.nic.co",
  me: "whois.nic.me",
  xyz: "whois.nic.xyz",
  app: "whois.nic.google",
  dev: "whois.nic.google",
  page: "whois.nic.google",
  tv: "whois.nic.tv",
  cc: "whois.nic.cc",
  sh: "whois.nic.sh",
  ai: "whois.nic.ai",
  au: "whois.audns.net.au",
  nz: "whois.srs.net.nz",
  de: "whois.denic.de",
  fr: "whois.nic.fr",
  nl: "whois.domain-registry.nl",
  it: "whois.nic.it",
  ch: "whois.nic.ch",
  jp: "whois.jprs.jp",
  cn: "whois.cnnic.cn",
  ru: "whois.tcinet.ru",
  su: "whois.tcinet.ru",
  eu: "whois.eu",
  pl: "whois.dns.pl",
  br: "whois.registro.br",
  mx: "whois.mx",
  za: "whois.registry.net.za",
  kr: "whois.kr",
  tw: "whois.twnic.net.tw",
  se: "whois.iis.se",
  no: "whois.norid.no",
  fi: "whois.fi",
  dk: "whois.dk-hostmaster.dk",
  cz: "whois.nic.cz",
  sk: "whois.sk-nic.sk",
  hu: "whois.nic.hu",
  ro: "whois.rotld.ro",
  bg: "whois.register.bg",
  ua: "whois.ua",
  hk: "whois.hkirc.hk",
  sg: "whois.sgnic.sg",
  my: "whois.mynic.my",
  th: "whois.thnic.co.th",
  ph: "whois.dot.ph",
  id: "whois.id",
  il: "whois.isoc.org.il",
  tr: "whois.nic.tr",
  ae: "whois.aeda.net.ae",
  sa: "whois.nic.net.sa",
  ir: "whois.nic.ir",
  cl: "whois.nic.cl",
  pe: "kero.yachay.pe",
  ve: "whois.nic.ve",
  ec: "whois.nic.ec",
  uy: "whois.nic.org.uy",
  py: "whois.nic.py",
  bo: "whois.nic.bo",
  gq: "whois.dot.tk",
  tk: "whois.dot.tk",
  cf: "whois.dot.tk",
  ga: "whois.dot.tk",
  ml: "whois.dot.tk",
  top: "whois.nic.top",
  site: "whois.nic.site",
  online: "whois.nic.online",
  tech: "whois.nic.tech",
  store: "whois.nic.store",
  shop: "whois.nic.shop",
  vip: "whois.nic.vip",
  club: "whois.nic.club",
  space: "whois.nic.space",
  website: "whois.nic.website",
  link: "whois.uniregistry.net",
  click: "whois.uniregistry.net",
  work: "whois.nic.work",
  live: "whois.nic.live",
  studio: "whois.nic.studio",
  design: "whois.nic.design",
  wiki: "whois.nic.wiki",
  ink: "whois.nic.ink",
  agency: "whois.nic.agency",
  email: "whois.nic.email",
  company: "whois.nic.company",
  news: "whois.nic.news",
  icu: "whois.nic.icu",
  loan: "whois.nic.loan",
  win: "whois.nic.win",
  bid: "whois.nic.bid",
  pub: "whois.nic.pub",
};

function queryWhois(server: string, query: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = net.connect({ host: server, port: 43 }, () => {
      // Some registrars require specific format parameters
      // e.g. for .de / denic: "-T dn,ace domain.de"
      let command = query;
      if (server === "whois.denic.de" && !query.startsWith("-")) {
        command = "-T dn,ace " + query;
      }
      client.write(command + "\r\n");
    });
    
    client.setTimeout(8000); // 8 seconds timeout
    let buffer = "";
    
    client.on("data", (data) => {
      buffer += data.toString();
    });
    
    client.on("end", () => {
      resolve(buffer);
    });
    
    client.on("timeout", () => {
      client.destroy();
      reject(new Error(`Timeout connecting to WHOIS server (${server})`));
    });
    
    client.on("error", (err) => {
      reject(err);
    });
  });
}

function parseWhois(rawText: string) {
  const findValue = (regex: RegExp): string | null => {
    const match = rawText.match(regex);
    return match ? match[1].trim() : null;
  };

  const findValues = (regex: RegExp): string[] => {
    const matches = [...rawText.matchAll(new RegExp(regex, "gi"))];
    return matches.map((m) => m[1].trim());
  };

  // 1. Basic properties
  const registrar = findValue(/Registrar:\s*(.*)/i) || 
                    findValue(/registrar:\s*(.*)/i) || 
                    findValue(/Registrar Name:\s*(.*)/i) ||
                    findValue(/Sponsoring Registrar:\s*(.*)/i) ||
                    findValue(/organisation:\s*(.*)/i);
  
  const registeredAtStr = findValue(/Creation Date:\s*(.*)/i) || 
                          findValue(/created:\s*(.*)/i) || 
                          findValue(/Registered On:\s*(.*)/i) || 
                          findValue(/Registration Time:\s*(.*)/i) ||
                          findValue(/registered:\s*(.*)/i);
                          
  const expiresAtStr = findValue(/Registry Expiry Date:\s*(.*)/i) || 
                       findValue(/Expiration Date:\s*(.*)/i) || 
                       findValue(/Expiry Date:\s*(.*)/i) || 
                       findValue(/Registry Expiration Date:\s*(.*)/i) ||
                       findValue(/expire:\s*(.*)/i);
                       
  const updatedAtStr = findValue(/Updated Date:\s*(.*)/i) || 
                       findValue(/last-updated:\s*(.*)/i) || 
                       findValue(/changed:\s*(.*)/i);

  const registeredAt = registeredAtStr ? new Date(registeredAtStr) : null;
  const expiresAt = expiresAtStr ? new Date(expiresAtStr) : null;
  const updatedAt = updatedAtStr ? new Date(updatedAtStr) : null;

  let nameServers = findValues(/Name Server:\s*(.*)/i);
  if (nameServers.length === 0) {
    nameServers = findValues(/nserver:\s*(.*)/i);
  }
  nameServers = [...new Set(nameServers.map(ns => ns.toLowerCase()))];

  let status = findValues(/Domain Status:\s*(.*)/i);
  if (status.length === 0) {
    status = findValues(/status:\s*(.*)/i);
  }
  status = [...new Set(status)];

  const dnssec = findValue(/DNSSEC:\s*(.*)/i) || findValue(/dnssec:\s*(.*)/i) || "unsigned (standard delegation)";

  // 2. OSINT-grade contacts parsing
  const registrantOrganization = findValue(/Registrant Organization:\s*(.*)/i) || 
                                 findValue(/Registrant Org:\s*(.*)/i) || 
                                 findValue(/registrant-organization:\s*(.*)/i) || 
                                 findValue(/registrant_contact_organization:\s*(.*)/i) || 
                                 findValue(/org:\s*(.*)/i);

  const registrantName = findValue(/Registrant Name:\s*(.*)/i) || 
                         findValue(/Registrant:\s*(.*)/i) || 
                         findValue(/registrant-name:\s*(.*)/i) || 
                         findValue(/registrant_contact_name:\s*(.*)/i) || 
                         findValue(/person:\s*(.*)/i);

  const registrantEmail = findValue(/Registrant Email:\s*(.*)/i) || 
                          findValue(/registrant-email:\s*(.*)/i) || 
                          findValue(/registrant_contact_email:\s*(.*)/i) || 
                          findValue(/e-mail:\s*(.*)/i);

  const abuseEmail = findValue(/Registrar Abuse Contact Email:\s*(.*)/i) || 
                     findValue(/Abuse Contact Email:\s*(.*)/i) || 
                     findValue(/abuse-email:\s*(.*)/i) ||
                     findValue(/Abuse Email:\s*(.*)/i);

  const abusePhone = findValue(/Registrar Abuse Contact Phone:\s*(.*)/i) || 
                     findValue(/Abuse Contact Phone:\s*(.*)/i) || 
                     findValue(/abuse-phone:\s*(.*)/i) ||
                     findValue(/Abuse Phone:\s*(.*)/i);

  const registrarUrl = findValue(/Registrar Referral URL:\s*(.*)/i) || 
                       findValue(/Registrar URL:\s*(.*)/i) || 
                       findValue(/referral-url:\s*(.*)/i) ||
                       findValue(/url:\s*(.*)/i);

  const primaryRegistrant = registrantOrganization || registrantName || "Redacted for Privacy (Contact Privacy Service)";

  return {
    registrar: registrar || "Unknown Registrar",
    registeredAt: registeredAt && !isNaN(registeredAt.getTime()) ? registeredAt : null,
    expiresAt: expiresAt && !isNaN(expiresAt.getTime()) ? expiresAt : null,
    updatedAt: updatedAt && !isNaN(updatedAt.getTime()) ? updatedAt : null,
    status: status.length > 0 ? status : ["active"],
    nameServers: nameServers.length > 0 ? nameServers : [],
    registrant: primaryRegistrant,
    dnssec,
    // OSINT detailed fields
    registrantOrganization: registrantOrganization || "Redacted for Privacy",
    registrantName: registrantName || "Redacted for Privacy",
    registrantEmail: registrantEmail || "Redacted for Privacy",
    abuseEmail: abuseEmail || "N/A",
    abusePhone: abusePhone || "N/A",
    registrarUrl: registrarUrl || "N/A"
  };
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
    const parse = WhoisSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json({ error: parse.error.errors[0].message }, { status: 400 });
    }

    const { domain } = parse.data;
    const cleanDomain = domain.trim().toLowerCase();

    // Determine initial registry server based on domain extension (TLD)
    const domainParts = cleanDomain.split(".");
    const tld = domainParts[domainParts.length - 1];
    const ccTld = domainParts.length > 2 ? domainParts[domainParts.length - 2] + "." + tld : tld;
    
    let referServer = TLD_WHOIS_SERVERS[ccTld] || TLD_WHOIS_SERVERS[tld] || "whois.iana.org";
    let rawText = "";

    try {
      // Step 1: Query registry server with fallback support
      try {
        const registryText = await queryWhois(referServer, cleanDomain);
        rawText += registryText;
      } catch (err: any) {
        console.warn(`Query to primary server ${referServer} failed: ${err.message}. Falling back to whois.iana.org`);
        if (referServer !== "whois.iana.org") {
          referServer = "whois.iana.org";
          const ianaText = await queryWhois(referServer, cleanDomain);
          rawText += ianaText;
        } else {
          throw err;
        }
      }

      // If we queried IANA, check refer: and query next authoritative server
      if (referServer === "whois.iana.org") {
        const referMatch = rawText.match(/refer:\s*([^\s]+)/i) || rawText.match(/whois:\s*([^\s]+)/i);
        if (referMatch) {
          referServer = referMatch[1].trim();
          const tldText = await queryWhois(referServer, cleanDomain);
          rawText += "\n\n=== TLD REGISTRY DIRECTORY ===\n\n" + tldText;
        }
      }

      // Check if we need to redirect queries to the domain's registrar WHOIS server
      const registrarWhoisMatch = rawText.match(/Registrar WHOIS Server:\s*([^\s]+)/i) || 
                                  rawText.match(/whois:\s*([^\s]+)/i);
      if (registrarWhoisMatch) {
        const registrarServer = registrarWhoisMatch[1].trim();
        // Prevent infinite self-loops if it redirects to itself
        if (registrarServer !== referServer && registrarServer !== "whois.iana.org") {
          const registrarText = await queryWhois(registrarServer, cleanDomain);
          rawText += "\n\n=== REGISTRAR DETAILS ===\n\n" + registrarText;
        }
      }
    } catch (e: any) {
      console.warn(`WHOIS recursive resolution failed at ${referServer}:`, e.message);
      if (!rawText) {
        throw new Error(`Failed to connect to WHOIS servers: ${e.message}`);
      }
    }

    const parsed = parseWhois(rawText);

    // Save to search records
    const saved = await db.whoisSearch.create({
      data: {
        userId,
        domain: cleanDomain,
        registrar: parsed.registrar,
        registeredAt: parsed.registeredAt,
        expiresAt: parsed.expiresAt,
        updatedAt: parsed.updatedAt,
        status: parsed.status,
        nameServers: parsed.nameServers,
      }
    });

    // Write audit log
    await db.auditLog.create({
      data: {
        userId,
        action: `WHOIS OSINT Search: ${cleanDomain}`,
        ipAddress: ip,
        userAgent: req.headers.get("user-agent"),
      }
    });

    return NextResponse.json({
      ...saved,
      registrant: parsed.registrant,
      dnssec: parsed.dnssec,
      rawText: rawText || "No raw feed received.",
      // OSINT Extra contacts details
      registrantOrganization: parsed.registrantOrganization || "Redacted for Privacy",
      registrantName: parsed.registrantName || "Redacted for Privacy",
      registrantEmail: parsed.registrantEmail || "Redacted for Privacy",
      abuseEmail: parsed.abuseEmail || "N/A",
      abusePhone: parsed.abusePhone || "N/A",
      registrarUrl: parsed.registrarUrl || "N/A"
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to query WHOIS records" }, { status: 500 });
  }
}
