# ToolsNova — Branch-only release checklist

Source: seo/priority-1-static-guides-about-20261115. No merge, no production deployment.

## Homepage
- [ ] All 30 cards are anchor links with correct destinations
- [ ] Search narrows visible tools and empty state works
- [ ] Category filters and "View all tools" reveal the right cards
- [ ] Keyboard Tab focus and Enter navigation work

## Top seven tools
- [ ] Password Generator: randomness, length selection, options, Copy
- [ ] JSON Formatter: pretty-print, minify, malformed JSON validation
- [ ] Merge PDF: selection validation, order, 2+ PDFs, output download
- [ ] Split PDF: invalid ranges, select pages, output download
- [ ] Compress PDF: missing file, valid PDF, result or honest no-size-reduction message
- [ ] QR Code Generator: generate, image preview, PNG download
- [ ] Word Counter: words, characters, lines, clear

## Mobile (390 x 844 minimum)
- [ ] No horizontal overflow
- [ ] How it works and example cards display correctly
- [ ] FAQ details open and answers are readable
- [ ] Three recommended-tool links remain tappable
- [ ] About ToolsNova sections, links and footer work

## SEO
- [ ] Homepage / tool / About titles and descriptions
- [ ] Canonicals point to intended toolsnova.online production URLs
- [ ] WebSite, WebApplication and AboutPage schema is valid JSON-LD
- [ ] Sitemap 45 unique URLs, including /about/
- [ ] Robots/analytics/Cloudflare configuration not modified

## Performance
- [ ] Lighthouse mobile: homepage, Password Generator and JSON Formatter
- [ ] Note lab scores are not field Core Web Vitals
- [ ] Check contrast, page layout and console errors

## Release gate
- [ ] CI test passes with no errors
- [ ] Screenshots or a visual human review of mobile/desktop
- [ ] Review the exact diff against main
- [ ] Separate explicit approval for merge; no direct publishing from this workflow
