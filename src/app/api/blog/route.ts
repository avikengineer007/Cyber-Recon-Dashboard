import { NextRequest, NextResponse } from "next/server";
import xml2js from "xml2js";

export const runtime = "nodejs";

const CISA_FEED_URL = "https://www.cisa.gov/cybersecurity-advisories/all.xml";

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

// Generate threat tags based on title/description keywords
function extractTags(title: string, desc: string): { name: string }[] {
  const text = (title + " " + desc).toLowerCase();
  const tagsSet = new Set<string>();

  if (text.includes("industrial") || text.includes("ics") || text.includes("ot")) tagsSet.add("Industrial Control");
  if (text.includes("vulnerability") || text.includes("cve")) tagsSet.add("Vulnerability");
  if (text.includes("remote") || text.includes("rce")) tagsSet.add("Remote Code Execution");
  if (text.includes("buffer") || text.includes("overflow")) tagsSet.add("Buffer Overflow");
  if (text.includes("medical") || text.includes("healthcare")) tagsSet.add("Medical Devices");
  if (text.includes("cisa") || text.includes("advisory")) tagsSet.add("CISA Advisory");
  if (text.includes("firmware") || text.includes("hardware")) tagsSet.add("Firmware / HW");
  
  // Default tags if none matched
  if (tagsSet.size === 0) {
    tagsSet.add("Cyber Security");
    tagsSet.add("Threat Intel");
  }

  return Array.from(tagsSet).slice(0, 3).map(tag => ({ name: tag }));
}

// Strip HTML tags helper
function stripHtml(htmlStr: string): string {
  if (!htmlStr) return "";
  return htmlStr.replace(/<\/?[^>]+(>|$)/g, "").trim();
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slugParam = searchParams.get("slug");

  try {
    const res = await fetch(CISA_FEED_URL, {
      next: { revalidate: 300 } // Cache feed for 5 minutes
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch CISA RSS feed: ${res.status}`);
    }

    const xml = await res.text();
    const parser = new xml2js.Parser({ explicitArray: false });
    const parsedFeed = await parser.parseStringPromise(xml);
    
    const rawItems = parsedFeed.rss?.channel?.item || [];
    const itemsList = Array.isArray(rawItems) ? rawItems : [rawItems];

    const mappedPosts = itemsList.map((item: any, idx: number) => {
      const title = item.title || "Unnamed Threat Bulletin";
      const rawDesc = item.description || "";
      const textContent = stripHtml(rawDesc);
      const postSlug = slugify(title) || `bulletin-${idx}`;

      // Calculate dynamic reading time based on text word count
      const words = textContent.split(/\s+/).length;
      const readingTime = Math.max(3, Math.ceil(words / 180)) + " min read";

      return {
        id: `cisa-${idx}`,
        title,
        slug: postSlug,
        content: textContent.substring(0, 300) + (textContent.length > 300 ? "..." : ""),
        fullContent: rawDesc, // Retain HTML formatting for the slug details page
        readingTime,
        createdAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
        categories: [{ name: "CISA Intel" }],
        tags: extractTags(title, textContent)
      };
    });

    if (slugParam) {
      const matched = mappedPosts.find(p => p.slug === slugParam);
      if (matched) {
        return NextResponse.json(matched);
      }
      return NextResponse.json({ error: "Post not found in live feed" }, { status: 404 });
    }

    // Return the latest 9 posts
    return NextResponse.json(mappedPosts.slice(0, 9));
  } catch (error: any) {
    console.error("CISA live feed integration failed:", error.message);
    return NextResponse.json({ error: "Failed to fetch live threat advisories" }, { status: 500 });
  }
}
