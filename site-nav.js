(()=>{const menu=document.querySelector(".nav-categories");if(!menu)return;document.addEventListener("pointerdown",event=>{if(menu.open&&!menu.contains(event.target))menu.open=false});document.addEventListener("keydown",event=>{if(event.key==="Escape"&&menu.open){menu.open=false;menu.querySelector("summary").focus()}})})();
/* Load the matching guidance on tool pages only. */
(()=>{if(!/^\/tools\/[^/]+\/?$/.test(location.pathname)||!document.querySelector(".tool-explainer"))return;
const css=document.createElement("link");css.rel="stylesheet";css.href="/tool-help.css?v=3";document.head.appendChild(css);
const script=document.createElement("script");script.src="/tool-help.js?v=1";script.defer=true;document.head.appendChild(script);
})();

/* Shared visual polish for homepage, category, guide and tool headings. */
(()=>{if(document.querySelector('link[href^="/heading-polish.css"]'))return;const l=document.createElement("link");l.rel="stylesheet";l.href="/heading-polish.css?v=8";document.head.appendChild(l);})();
