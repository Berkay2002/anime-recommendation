# Phase 01: Logging Cleanup - Research

**Researched:** 2026-01-19
**Domain:** Next.js Logging and Error Handling
**Confidence:** HIGH

## Summary

The Anime Recommendation App currently has 52+ console.log/console.error statements scattered throughout the services and API routes. These need to be replaced with a structured logging system that supports environment-based log levels, proper error tracking, and production-ready formatting.

Based on the codebase analysis and ecosystem research, **Pino** is the recommended logging library for this Next.js application due to its exceptional performance (5x faster than alternatives), JSON structured logging, and minimal overhead. The implementation should include a centralized logger configuration with environment-based log levels, development-friendly formatting, and proper error context capture.

**Primary recommendation:** Use Pino logger with pino-pretty for development, implement log levels controlled by environment variables, and create a centralized logging utility that replaces all console statements.

## Standard Stack

The established libraries/tools for Next.js logging:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| pino | ^9.0.0 | High-performance JSON logger | 5x faster than alternatives, minimal overhead, structured logging |
| pino-pretty | ^11.0.0 | Development log formatting | Human-readable output in dev, disabled in production |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| pino-http | ^10.0.0 | HTTP request logging | For API route logging with request context |
| pino-pretty | ^11.0.0 | Development formatting | Only in development, not in production builds |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
------------|-----------|----------|
| pino | winston | Winston has more features but 5x slower performance |
| pino | bunyan | Bunyan is good but less actively maintained |
| pino | console.* | No structure, no log levels, poor production practice |

**Installation:**
```bash
cd frontend
npm install pino pino-pretty
npm install -D @types/pino  # If TypeScript types needed
```

## Architecture Patterns

### Recommended Project Structure
```
frontend/
├── lib/
│   └── logger.ts          # Centralized logger configuration
├── services/              # Business logic with injected logger
└── app/api/               # API routes using structured logging
```

### Pattern 1: Centralized Logger Configuration
**What:** Single logger instance with environment-based configuration
**When to use:** Throughout the application for consistent logging
**Example:**
```typescript
// Source: Pino documentation and Next.js best practices
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    }
  } : undefined,
  base: {
    env: process.env.NODE_ENV,
    version: process.env.npm_package_version,
  },
});

export default logger;
```

### Pattern 2: Service Layer Logging
**What:** Inject logger into service classes with contextual information
**When to use:** In all service files to replace console.log statements
**Example:**
```typescript
// Source: Based on existing animeCacheService.ts pattern
import logger from '@/lib/logger';

class AnimeCacheService {
  private log: pino.Logger;

  constructor() {
    this.log = logger.child({ service: 'AnimeCacheService' });
  }

  async searchAnimeWithCache(query: string) {
    this.log.debug({ query }, 'Searching anime with cache');

    try {
      // ... existing logic
    } catch (error) {
      this.log.error({ error, query }, 'Error searching anime with cache');
      throw error;
    }
  }
}
```

### Pattern 3: API Route Error Handling
**What:** Structured error logging in API routes with request context
**When to use:** In all API route error handlers
**Example:**
```typescript
// Source: Next.js error handling documentation
import logger from '@/lib/logger';

export async function GET(request: Request) {
  const log = logger.child({
    route: '/api/anime/search',
    method: 'GET'
  });

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    log.debug({ query }, 'Received search request');

    // ... search logic

    log.info({ query, resultCount: results.length }, 'Search completed');
    return Response.json(results);

  } catch (error) {
    log.error({ error }, 'Search request failed');
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Anti-Patterns to Avoid
- **Console.log in production:** Never ship console statements to production
- **No log levels:** Always use appropriate log levels (debug, info, warn, error)
- **No context:** Always include relevant context (userId, requestId, etc.)
- **Logging sensitive data:** Never log passwords, tokens, or personal information

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON formatting | Custom JSON.stringify | Pino's built-in JSON | Handles circular references, performance optimized |
| Log rotation | Manual file management | Pino transports | Built-in rotation, compression, streaming |
| Log levels | If/else conditions | Pino level system | Standardized levels, filtering, performance |
| Pretty printing | Custom formatting | pino-pretty | Color codes, timestamps, filtering, development friendly |

**Key insight:** Custom logging solutions quickly become complex when handling edge cases like circular references, large objects, performance optimization, and production formatting. Pino handles these efficiently with minimal overhead.

## Common Pitfalls

### Pitfall 1: Logging in Client-Side Code
**What goes wrong:** Pino and other Node.js loggers don't work in browser
**Why it happens:** Next.js bundles both server and client code
**How to avoid:** Create separate logger instances or use conditional imports
**Warning signs:** Build errors about 'fs' module or Node.js dependencies

### Pitfall 2: Exposing Sensitive Logs
**What goes wrong:** API keys, tokens, or user data appears in logs
**Why it happens:** Logging entire objects without filtering
**How to avoid:** Use Pino's redaction feature or manually filter sensitive fields
**Warning signs:** Logs containing "password", "token", "apiKey" fields

### Pitfall 3: Performance Impact
**What goes wrong:** Logging slows down the application
**Why it happens:** Synchronous logging, logging too much data
**How to avoid:** Use Pino's asynchronous logging, appropriate log levels
**Warning signs:** High response times correlating with log volume

### Pitfall 4: Missing Request Context
**What goes wrong:** Can't correlate logs to specific requests
**Why it happens:** No request ID or user context in logs
**How to avoid:** Use child loggers with request context
**Warning signs:** Can't trace user actions across multiple logs

### Pitfall 5: Environment Variable Leaks
**What goes wrong:** NEXT_PUBLIC_ prefixes expose logger configuration
**Why it happens:** Using wrong environment variable prefix
**How to avoid:** Use non-prefixed variables for server-side logging config
**Warning signs:** Log levels or sensitive config visible in browser

## Code Examples

Verified patterns from official sources:

### Basic Logger Setup
```typescript
// Source: Pino documentation adapted for Next.js
// frontend/lib/logger.ts
import pino from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  transport: isDevelopment ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    }
  } : undefined,
  formatters: {
    level: (label) => ({ level: label.toUpperCase() }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export default logger;
```

### Service with Contextual Logging
```typescript
// Source: Based on existing codebase patterns
// frontend/services/animeCacheService.ts
import logger from '@/lib/logger';

export class AnimeCacheService {
  private log: pino.Logger;

  constructor() {
    this.log = logger.child({ service: 'AnimeCacheService' });
  }

  async upsertAnimeToDatabase(anime: any) {
    this.log.debug({ mal_id: anime.mal_id, title: anime.title }, 'Processing anime upsert');

    try {
      // ... existing logic
      this.log.info({ mal_id: anime.mal_id, anime_id: result.rows[0]?.anime_id }, 'Anime upsert successful');
      return result;
    } catch (error) {
      this.log.error({ error, mal_id: anime.mal_id }, 'Failed to upsert anime');
      throw error;
    }
  }
}
```

### Environment Variables Configuration
```bash
# .env.local
# Logging configuration
LOG_LEVEL=debug  # debug, info, warn, error

# Production - no pretty printing, JSON logs
# Development - pretty printed, colored logs
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| console.log everywhere | Structured logging with Pino | 2025 | Better performance, structured data, environment control |
| No log levels | Standard log levels (debug/info/warn/error) | Always | Proper log filtering and monitoring |
| Plain text logs | JSON structured logs | 2020+ | Machine-readable, better for log aggregation |
| Synchronous logging | Asynchronous logging | 2018+ | No blocking, better performance |

**Deprecated/outdated:**
- **console.log in production:** Security risk, no structure, performance issues
- **Winston for high-performance needs:** Pino is 5x faster
- **Custom logging solutions:** Reinventing the wheel, missing edge cases

## Open Questions

Things that couldn't be fully resolved:

1. **Client-side logging strategy**
   - What we know: Pino doesn't work in browser, need separate solution
   - What's unclear: Best practice for unified server/client logging
   - Recommendation: Use simple console.info/warn/error in client components, keep structured logging server-side only

2. **Log aggregation in production**
   - What we know: Pino outputs JSON for log aggregation tools
   - What's unclear: Specific setup for Vercel deployment
   - Recommendation: Start with basic JSON logging, investigate Vercel log drains later

## Sources

### Primary (HIGH confidence)
- Pino GitHub repository - Performance characteristics and basic usage
- Next.js official documentation - Error handling patterns and recommendations
- Pino documentation - Configuration options and best practices

### Secondary (MEDIUM confidence)
- Next.js community patterns for structured logging
- Production logging best practices for Node.js applications

### Tertiary (LOW confidence)
- WebSearch results for 2025 logging trends (no results found)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Pino is well-established with clear performance advantages
- Architecture: HIGH - Based on existing codebase patterns and official docs
- Pitfalls: HIGH - Common issues well-documented in community

**Research date:** 2026-01-19
**Valid until:** 2026-02-19 (30 days - stable domain)