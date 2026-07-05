import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { CveQuerySchema } from "@/lib/validators";
import { rateLimit } from "@/lib/rate-limit";
import { db } from "@/lib/db";

const CVE_DATABASE = [
  {
    cveId: "CVE-2024-3094",
    sourceIdentifier: "security@debian.org",
    published: "2024-03-29T18:15:08.283",
    lastModified: "2024-04-01T12:35:10.110",
    vulnStatus: "Analyzed",
    descriptions: "Malicious code was discovered in the upstream tarballs of xz, starting with version 5.6.0. Through a series of complex obfuscations, the liblzma build process extracts a prebuilt object file from a disguised test file, which is then used to modify functions in the liblzma code.",
    metrics: {
      cvssMetricV31: {
        score: 10.0,
        vectorString: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H",
        severity: "CRITICAL"
      }
    }
  },
  {
    cveId: "CVE-2021-44228",
    sourceIdentifier: "security@apache.org",
    published: "2021-12-10T14:15:08.120",
    lastModified: "2022-01-05T18:45:00.000",
    vulnStatus: "Analyzed",
    descriptions: "Apache Log4j2 versions 2.0-beta9 to 2.15.0 (excluding security releases) JNDI features used in configuration, log messages, and parameters do not protect against attacker controlled LDAP and other JNDI related endpoints.",
    metrics: {
      cvssMetricV31: {
        score: 10.0,
        vectorString: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H",
        severity: "CRITICAL"
      }
    }
  },
  {
    cveId: "CVE-2023-38606",
    sourceIdentifier: "security@apple.com",
    published: "2023-07-24T21:15:11.440",
    lastModified: "2023-08-02T16:22:30.900",
    vulnStatus: "Analyzed",
    descriptions: "An issue was addressed with improved state management. This issue was exploited in the wild against iOS versions prior to iOS 16.6. An attacker may be able to modify sensitive kernel state.",
    metrics: {
      cvssMetricV31: {
        score: 7.8,
        vectorString: "CVSS:3.1/AV:L/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:H",
        severity: "HIGH"
      }
    }
  },
  {
    cveId: "CVE-2023-4863",
    sourceIdentifier: "security@google.com",
    published: "2023-09-12T15:15:12.330",
    lastModified: "2023-09-18T10:14:20.120",
    vulnStatus: "Analyzed",
    descriptions: "Heap buffer overflow in libwebp in Google Chrome prior to 116.0.5845.187 and Octupus WebP codecs allowed a remote attacker to perform an out-of-bounds write via a crafted HTML page.",
    metrics: {
      cvssMetricV31: {
        score: 8.8,
        vectorString: "CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:H",
        severity: "HIGH"
      }
    }
  },
  {
    cveId: "CVE-2020-0601",
    sourceIdentifier: "secure@microsoft.com",
    published: "2020-01-14T23:15:14.330",
    lastModified: "2020-01-20T11:15:00.000",
    vulnStatus: "Analyzed",
    descriptions: "A spoofing vulnerability exists in the way Windows CryptoAPI (Crypt32.dll) validates Elliptic Curve Cryptography (ECC) certificates. An attacker could exploit the vulnerability by using a spoofed code-signing certificate.",
    metrics: {
      cvssMetricV31: {
        score: 7.5,
        vectorString: "CVSS:3.1/AV:N/AC:H/PR:N/UI:R/S:U/C:H/I:H/A:N",
        severity: "HIGH"
      }
    }
  },
  {
    cveId: "CVE-2022-22965",
    sourceIdentifier: "security@pivotal.io",
    published: "2022-04-01T10:15:08.430",
    lastModified: "2022-04-10T12:00:00.000",
    vulnStatus: "Analyzed",
    descriptions: "A Spring MVC or Spring WebFlux application running on JDK 9+ may be vulnerable to remote code execution (RCE) via class directory manipulation when data binding is used.",
    metrics: {
      cvssMetricV31: {
        score: 9.8,
        vectorString: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
        severity: "CRITICAL"
      }
    }
  },
  {
    cveId: "CVE-2017-0144",
    sourceIdentifier: "secure@microsoft.com",
    published: "2017-03-16T14:15:00.000",
    lastModified: "2019-10-10T12:00:00.000",
    vulnStatus: "Analyzed",
    descriptions: "The SMBv1 server in Microsoft Windows Vista SP2; Windows Server 2008 SP2 and R2 SP1; Windows 7 SP1; Windows 8.1; Windows Server 2012 Gold and R2; Windows RT 8.1; and Windows 10 Gold, 1511, and 1607 allows remote attackers to execute arbitrary code via crafted packets, aka EternalBlue.",
    metrics: {
      cvssMetricV31: {
        score: 8.1,
        vectorString: "CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:H",
        severity: "HIGH"
      }
    }
  }
];

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as any).id;

  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
  const limitCheck = await rateLimit(ip, 50);
  if (!limitCheck.success) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  try {
    const body = await req.json();
    const parse = CveQuerySchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json({ error: parse.error.errors[0].message }, { status: 400 });
    }

    const { query, severity, sortBy } = parse.data;
    const lowerQuery = query.toLowerCase();

    let filtered = CVE_DATABASE.filter(item => {
      const matchKeyword = item.cveId.toLowerCase().includes(lowerQuery) || 
                           item.descriptions.toLowerCase().includes(lowerQuery);
      const matchSeverity = severity ? item.metrics.cvssMetricV31.severity === severity : true;
      return matchKeyword && matchSeverity;
    });

    if (sortBy === 'SEVERITY') {
      filtered.sort((a, b) => b.metrics.cvssMetricV31.score - a.metrics.cvssMetricV31.score);
    } else {
      filtered.sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime());
    }

    await db.cveSearch.create({
      data: {
        userId,
        query,
        resultsCount: filtered.length,
      }
    });

    await db.auditLog.create({
      data: {
        userId,
        action: `CVE Search: "${query}" (Found ${filtered.length} entries)`,
        ipAddress: ip,
        userAgent: req.headers.get("user-agent"),
      }
    });

    return NextResponse.json({
      results: filtered,
      count: filtered.length
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to search CVE vulnerabilities" }, { status: 500 });
  }
}
export const runtime = "nodejs";
