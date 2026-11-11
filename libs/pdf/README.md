# Local PDF libraries

This directory is reserved for reviewed, locally hosted PDF JavaScript dependencies.

Planned files (not installed yet):

- `pdf-lib.min.js` — pdf-lib 1.17.1 (MIT)
- `pdf.min.js` — PDF.js 3.11.174 (Apache-2.0)
- `pdf.worker.min.js` — PDF.js 3.11.174 worker (Apache-2.0)
- `jszip.min.js` — JSZip 3.10.1 (MIT/GPL-3.0 dual license)

Before adding each file: download the exact version from its official release or a trusted distribution, verify its SHA-384 or SHA-512 digest, record the source URL and digest, and include its required license notice. Keep the PDF.js main script and worker at the same version. After adding the files, update and test the affected tools before removing their CDN fallback. Do not add placeholders in place of executable libraries.

**Current state:** ToolNovaHub PDF tools still load their libraries from the existing external CDN URLs. Creating this directory does not change runtime behavior or security guarantees.
