/* Use the same balanced logo in the header, footer, and other shared branding on every page. */
(()=>{const src="/toolsnova-tools.svg?v=4";document.querySelectorAll('img[src^="/toolsnova-tools.svg"]').forEach(img=>{if(img.getAttribute("src")!==src)img.setAttribute("src",src)})})();
(()=>{const menu=document.querySelector(".nav-categories");if(!menu)return;document.addEventListener("pointerdown",event=>{if(menu.open&&!menu.contains(event.target))menu.open=false});document.addEventListener("keydown",event=>{if(event.key==="Escape"&&menu.open){menu.open=false;menu.querySelector("summary").focus()}})})();
/* Load the matching guidance on tool pages only. */
(()=>{if(!/^\/tools\/[^/]+\/?$/.test(location.pathname)||!document.querySelector(".tool-explainer"))return;
const css=document.createElement("link");css.rel="stylesheet";css.href="/tool-help.css?v=3";document.head.appendChild(css);
const script=document.createElement("script");script.src="/tool-help.js?v=1";script.defer=true;document.head.appendChild(script);
})();

/* Shared visual polish for homepage, category, guide and tool headings. */
(()=>{if(document.querySelector('link[href^="/heading-polish.css"]'))return;const l=document.createElement("link");l.rel="stylesheet";l.href="/heading-polish.css?v=9";document.head.appendChild(l);})();


/* Back-to-top button for all 30 individual tool pages, without duplicating existing buttons. */
(()=>{
  if(!/^\/tools\/[^/]+\/?$/.test(location.pathname))return;
  const css=document.createElement("link");
  css.rel="stylesheet";
  css.href="/tool-back-to-top.css?v=1";
  document.head.appendChild(css);
  let button=document.getElementById("back-to-top");
  if(button)return;
  button=document.createElement("button");
  button.id="back-to-top";
  button.className="back-to-top";
  button.type="button";
  button.setAttribute("aria-label","Back to top");
  button.title="Back to top";
  button.hidden=true;
  const arrow=document.createElement("span");
  arrow.setAttribute("aria-hidden","true");
  arrow.textContent="↑";
  button.appendChild(arrow);
  document.body.appendChild(button);
  const update=()=>{button.hidden=window.scrollY<450};
  window.addEventListener("scroll",update,{passive:true});
  update();
  button.addEventListener("click",()=>window.scrollTo({
    top:0,
    behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth"
  }));
})();

/* Remove the redundant "View all tools" shortcut from the Related tools heading. */
(()=>{if(!/^\/tools\/[^/]+\/?$/.test(location.pathname))return;const head=document.querySelector(".related-tools .related-head");if(!head)return;for(const link of head.querySelectorAll('a[href="/#tools"]')){if(link.textContent.trim().toLowerCase().startsWith("view all tools"))link.remove()}})();

/* Mobile tool search and privacy-control placement, shared by all site pages. */
(()=>{if(document.querySelector('link[href^="/mobile-ux.css"]'))return;const sheet=document.createElement("link");sheet.rel="stylesheet";sheet.href="/mobile-ux.css?v=1";document.head.appendChild(sheet)})();
