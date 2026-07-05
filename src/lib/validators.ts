import { z } from 'zod';

export const WhoisSchema = z.object({
  domain: z.string().min(1, "Domain is required").regex(
    /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/,
    "Invalid domain format"
  ),
});

export const DnsSchema = z.object({
  domain: z.string().min(1, "Domain is required"),
  types: z.array(z.enum(['A', 'AAAA', 'MX', 'TXT', 'NS', 'SOA', 'CNAME', 'PTR', 'SRV'])).optional(),
});

export const SslSchema = z.object({
  host: z.string().min(1, "Host is required"),
});

export const CveQuerySchema = z.object({
  query: z.string().min(2, "Search term must be at least 2 characters long"),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  sortBy: z.enum(['LATEST', 'SEVERITY']).default('LATEST'),
});
