type RateLimitInfo = {
  count: number;
  resetTime: number;
};

const rateLimitMap = new Map<string, RateLimitInfo>();

export async function rateLimit(
  ip: string,
  limit: number = 60,
  windowMs: number = 60 * 1000
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const now = Date.now();
  const trackingKey = ip || "anonymous";
  const current = rateLimitMap.get(trackingKey);

  if (!current || now > current.resetTime) {
    const info: RateLimitInfo = {
      count: 1,
      resetTime: now + windowMs,
    };
    rateLimitMap.set(trackingKey, info);
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: info.resetTime,
    };
  }

  if (current.count >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: current.resetTime,
    };
  }

  current.count += 1;
  rateLimitMap.set(trackingKey, current);
  return {
    success: true,
    limit,
    remaining: limit - current.count,
    reset: current.resetTime,
  };
}
