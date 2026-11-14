/* Local, zero-request search for ToolsNova's 30 published instruments. */
(()=>{
  "use strict";
  const input=document.getElementById("tn-tool-finder-input");
  const results=document.getElementById("tn-tool-finder-results");
  if(!input||!results)return;

  const data=[
    ["Image Compressor","Images","image-compressor"],
    ["Image Converter","Images","image-converter"],
    ["Password Generator","Security","password-generator"],
    ["Word Counter","Text","word-counter"],
    ["JSON Formatter","Developer","json-formatter"],
    ["QR Code Generator","Developer","qr-code-generator"],
    ["Split PDF","PDF","split-pdf"],
    ["Merge PDF","PDF","merge-pdf"],
    ["PDF to JPG","PDF","pdf-to-jpg"],
    ["Color Converter","Developer","color-converter"],
    ["Image Resizer","Images","image-resizer"],
    ["Text Case Converter","Text","text-case-converter"],
    ["Base64 Encoder / Decoder","Developer","base64-encoder-decoder"],
    ["UUID Generator","Developer","uuid-generator"],
    ["Image to Base64","Images","image-to-base64"],
    ["URL Encoder / Decoder","Developer","url-encoder-decoder"],
    ["SHA-256 Hash Generator","Developer","sha256-hash-generator"],
    ["Remove Duplicate Lines","Text","remove-duplicate-lines"],
    ["Text Sorter","Text","text-sorter"],
    ["Lorem Ipsum Generator","Text","lorem-ipsum-generator"],
    ["Character Counter","Text","character-counter"],
    ["HTML Encoder / Decoder","Developer","html-encoder-decoder"],
    ["Unix Timestamp Converter","Developer","unix-timestamp-converter"],
    ["CSS Minifier","Developer","css-minifier"],
    ["Text Diff Checker","Text","text-diff-checker"],
    ["JSON to CSV Converter","Developer","json-to-csv-converter"],
    ["SVG to PNG","Images","svg-to-png"],
    ["WebP to PNG","Images","webp-to-png"],
    ["Compress PDF","PDF","compress-pdf"],
    ["JPG to PDF Converter","PDF","jpg-to-pdf"]
  ];
  const normalize=s=>s.toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
  let matches=[];

  function close(){
    results.hidden=true;
    results.replaceChildren();
    input.setAttribute("aria-expanded","false");
  }
  function draw(){
    const q=normalize(input.value);
    if(!q){matches=[];close();return;}
    const terms=q.split(/\s+/);
    matches=data.filter(([name,category])=>{
      const text=normalize(name+" "+category);
      return terms.every(term=>text.includes(term));
    }).sort((a,b)=>{
      const aName=normalize(a[0]),bName=normalize(b[0]);
      return Number(bName.startsWith(q))-Number(aName.startsWith(q)) || aName.localeCompare(bName);
    }).slice(0,8);
    results.replaceChildren();
    if(matches.length===0){
      const no=document.createElement("li");
      no.className="tn-no-results";
      no.textContent="No matching tools. Try another keyword.";
      results.append(no);
    }else{
      for(const [name,category,slug] of matches){
        const li=document.createElement("li");
        const a=document.createElement("a");
        const title=document.createElement("span");
        const categoryLabel=document.createElement("span");
        a.href="/tools/"+slug+"/";
        title.textContent=name;
        categoryLabel.className="tn-result-category";
        categoryLabel.textContent=category;
        a.append(title,categoryLabel);
        li.append(a);
        results.append(li);
      }
    }
    results.hidden=false;
    input.setAttribute("aria-expanded","true");
  }
  input.addEventListener("input",draw);
  input.addEventListener("keydown",event=>{
    if(event.key==="Escape"){close();return;}
    if(event.key==="ArrowDown"&&!results.hidden){
      const first=results.querySelector("a");
      if(first){event.preventDefault();first.focus();}
    }
    if(event.key==="Enter"&&matches.length){
      event.preventDefault();
      window.location.assign("/tools/"+matches[0][2]+"/");
    }
  });
  results.addEventListener("keydown",event=>{
    if(event.key==="Escape"){event.preventDefault();close();input.focus();return;}
    if(event.key!=="ArrowDown"&&event.key!=="ArrowUp")return;
    const links=[...results.querySelectorAll("a")];
    const i=links.indexOf(document.activeElement);
    if(i<0)return;
    event.preventDefault();
    if(event.key==="ArrowUp"&&i===0)input.focus();
    else links[Math.min(links.length-1,Math.max(0,i+(event.key==="ArrowDown"?1:-1)))].focus();
  });
  document.addEventListener("pointerdown",event=>{
    if(!input.parentElement.contains(event.target))close();
  });
})();
