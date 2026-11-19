# Security Policy

## Supported Versions

Security fixes are applied to the latest `1.x` release on `main`.

| Version | Supported |
| :--- | :--- |
| `1.x` | Yes |
| `< 1.0` | No |

## Reporting a Vulnerability

Please report suspected security vulnerabilities privately via GitHub Security Advisories:

- **Report privately:** https://github.com/Aaryan1524/UnslopAI/security/advisories/new

Please do not open public GitHub issues for undisclosed vulnerabilities. Include reproduction steps, affected script paths, Node.js version, and expected vs. observed behavior.

## Security & Operational Boundaries

`UnslopAI` scripts follow strict runtime safety rules:
- **Loopback-Only CDP:** Optional CDP inspection (`rea_inspect.mjs`) binds strictly to `127.0.0.1` on an ephemeral port and shuts down the browser cleanly in `finally` blocks.
- **Read-Only Passive Inspection:** Extraction scripts never execute arbitrary code retrieved from untrusted source maps or exported bundles.
- **No Access-Control Bypass:** Scripts detect HTTP 401/403/429/503 responses, CAPTCHAs, Turnstile gates, and login walls and halt immediately rather than attempting to bypass access restrictions.
