'use strict';
const $=s=>document.querySelector(s),area=$('#tool-content'),panel=$('#workspace'),status=$('#status');$('#year').textContent=new Date().getFullYear();
const names={compress:['Image Compressor','Reduce image size using JPEG or WebP quality.'],convert:['Image Converter','Convert PNG, JPG and WebP files.'],password:['Password Generator','Create secure random passwords locally.'],words:['Word Counter','Count words, characters and lines instantly.'],json:['JSON Formatter','Validate, format and minify JSON.'],colors:['Color Converter','Pick a color and copy HEX or RGB.'],resize:['Image Resizer','Resize images to exact pixel dimensions.'],case:['Text Case Converter','Change text to uppercase, lowercase or title case.'],base64:['Base64 Encoder / Decoder','Encode or decode Unicode text as Base64.'],uuid:['UUID Generator','Generate random version 4 UUIDs locally.'],imagebase64:['Image to Base64','Convert an image to a Base64 data URL locally.'],qr:['QR Code Generator','Create and download QR codes for links and text.'],url:['URL Encoder / Decoder','Encode or decode URL text safely.'],hash:['SHA-256 Hash Generator','Generate SHA-256 hashes for text locally.'],dedupe:['Remove Duplicate Lines','Clean duplicate lines while keeping their original order.']};
function note(t,bad=false){status.textContent=t;status.className=bad?'error':''}
function save(blob,name){const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),3000)}
async function copy(t){try{await navigator.clipboard.writeText(t);note('Copied to clipboard.')}catch{note('Copy manually; clipboard permission unavailable.',true)}}
function images(compress){
 area.innerHTML='<div class="tool-form"><label>Select image<input id="file" type="file" accept="image/*"></label><label>Output format<select id="format"><option value="image/jpeg">JPEG</option><option value="image/webp">WebP</option>'+(compress?'':'<option value="image/png">PNG</option>')+'</select></label><label id="quality-label">Quality: <span id="qval">80</span>%<input id="quality" type="range" min="10" max="100" value="80"></label><div class="actions"><button class="action" id="run">Process & download</button></div><small>Maximum input: 50 MB and 40 megapixels. Processing stays on your device. Animated images become a single frame.</small></div>';
 const input=$('#file'),run=$('#run'),format=$('#format'),quality=$('#quality');
 const MAX_BYTES=50e6,MAX_PIXELS=4e7;let processing=false,revision=0;
 quality.oninput=()=>$('#qval').textContent=quality.value;
 format.onchange=()=>$('#quality-label').hidden=format.value==='image/png';
 input.onchange=()=>{revision++;const file=input.files[0];if(!file)return note('');if(file.size>MAX_BYTES)return note('Maximum file size is 50 MB.',true);if(file.type&&!file.type.startsWith('image/'))return note('Choose an image file.',true);note('Image selected. Ready to process.')};
 run.onclick=async()=>{
  if(processing)return;
  const file=input.files[0];if(!file)return note('Choose an image first.',true);
  if(file.size>MAX_BYTES)return note('Maximum file size is 50 MB.',true);
  if(file.type&&!file.type.startsWith('image/'))return note('Choose an image file.',true);
  processing=true;run.disabled=true;const current=revision;let bitmap,canvas;
  try{
   bitmap=await createImageBitmap(file);
   if(current!==revision||input.files[0]!==file)return note('Image selection changed. Please try again.',true);
   if(!bitmap.width||!bitmap.height||bitmap.width*bitmap.height>MAX_PIXELS)return note('Maximum source image resolution is 40 megapixels.',true);
   canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;
   const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas unavailable');
   const type=format.value;
   if(type==='image/jpeg'){ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height)}
   ctx.drawImage(bitmap,0,0);bitmap.close();bitmap=null;
   const out=await new Promise(resolve=>canvas.toBlob(resolve,type,Number(quality.value)/100));
   if(current!==revision||input.files[0]!==file)return note('Image selection changed. Please try again.',true);
   if(!out)return note('Conversion failed.',true);
   const ext=type==='image/jpeg'?'jpg':type.split('/')[1];
   save(out,file.name.replace(/\.[^.]+$/,'')+'-processed.'+ext);
   note('Done: '+Math.round(file.size/1024)+' KB → '+Math.round(out.size/1024)+' KB'+(out.size>file.size?' (output is larger)':''));
  }catch{note('Could not read or process this image.',true)}
  finally{if(bitmap)bitmap.close();if(canvas){canvas.width=0;canvas.height=0}processing=false;run.disabled=false}
 };
}
function passwords(){area.innerHTML='<div class="tool-form"><label>Length: <span id="len">20</span><input type="range" id="length" min="8" max="64" value="20"></label><div class="options"><label><input type="checkbox" id="upper" checked> Uppercase</label><label><input type="checkbox" id="lower" checked> Lowercase</label><label><input type="checkbox" id="digits" checked> Numbers</label><label><input type="checkbox" id="symbols" checked> Symbols</label></div><div class="output" id="result"></div><div class="actions"><button class="action" id="generate">Generate</button><button class="secondary" id="copy">Copy</button></div></div>';$('#length').oninput=()=>$('#len').textContent=$('#length').value;function rand(n){const a=new Uint32Array(1),limit=Math.floor(4294967296/n)*n;do{crypto.getRandomValues(a)}while(a[0]>=limit);return a[0]%n}function generate(){const sets=[['upper','ABCDEFGHIJKLMNOPQRSTUVWXYZ'],['lower','abcdefghijklmnopqrstuvwxyz'],['digits','0123456789'],['symbols','!@#$%^&*()-_=+?']].filter(v=>$('#'+v[0]).checked).map(v=>v[1]);if(!sets.length)return note('Select a character set.',true);const chars=sets.map(s=>s[rand(s.length)]),pool=sets.join('');while(chars.length<Number($('#length').value))chars.push(pool[rand(pool.length)]);for(let i=chars.length-1;i>0;i--){const j=rand(i+1);[chars[i],chars[j]]=[chars[j],chars[i]]}$('#result').textContent=chars.join('');note('Secure password generated.')}$('#generate').onclick=generate;$('#copy').onclick=()=>copy($('#result').textContent);generate()}
function words(){
 area.innerHTML='<div class="tool-form"><label>Enter text<textarea id="text" placeholder="Start typing..."></textarea></label><div class="stats"><div class="stat"><strong id="wc">0</strong><small>Words</small></div><div class="stat"><strong id="cc">0</strong><small>Characters</small></div><div class="stat"><strong id="lc">0</strong><small>Lines</small></div></div><button class="secondary" id="clear">Clear</button><small>Maximum text length: 1 million characters.</small></div>';
 const field=$('#text'),MAX=1000000;
 function update(){
  const v=field.value;
  if(v.length>MAX){$('#wc').textContent='—';$('#cc').textContent='—';$('#lc').textContent='—';return note('Text is too large. Maximum is 1 million characters.',true)}
  let words=0,inside=false,lines=v?1:0,chars=0;
  for(const ch of v){chars++;if(ch==='\n')lines++;if(/\s/u.test(ch)){inside=false}else if(!inside){inside=true;words++}}
  $('#wc').textContent=words;$('#cc').textContent=chars;$('#lc').textContent=lines;
  if(status.className==='error')note('');
 }
 field.oninput=update;$('#clear').onclick=()=>{field.value='';update();note('')};
}
function json(){
 area.innerHTML='<div class="tool-form"><label>JSON<textarea id="json" spellcheck="false" placeholder="{&quot;hello&quot;:&quot;world&quot;}"></textarea></label><div class="actions"><button class="action" id="format">Format</button><button class="secondary" id="minify">Minify</button><button class="secondary" id="copy">Copy</button></div><small>Maximum input: 2 million characters. Processing stays in your browser.</small></div>';
 const field=$('#json'),MAX_INPUT=2000000,MAX_OUTPUT=5000000;
 function run(spaces){
  const source=field.value;
  if(source.length>MAX_INPUT)return note('JSON is too large. Maximum input is 2 million characters.',true);
  try{
   const parsed=JSON.parse(source),result=JSON.stringify(parsed,null,spaces);
   if(result===undefined)return note('Unable to format this JSON.',true);
   if(result.length>MAX_OUTPUT)return note('Formatted JSON exceeds the 5 million character output limit.',true);
   field.value=result;note('Valid JSON.');
  }catch(e){note('Invalid JSON: '+e.message,true)}
 }
 $('#format').onclick=()=>run(2);
 $('#minify').onclick=()=>run(0);
 $('#copy').onclick=()=>field.value.length>MAX_OUTPUT?note('Text exceeds the copy limit.',true):copy(field.value);
}
function colors(){area.innerHTML='<div class="tool-form"><label>Pick color<input type="color" id="pick" value="#8b5cf6"></label><div class="output" id="preview" style="height:110px"></div><label>HEX<input id="hex" readonly></label><label>RGB<input id="rgb" readonly></label><div class="actions"><button class="secondary" id="copyhex">Copy HEX</button><button class="secondary" id="copyrgb">Copy RGB</button></div></div>';function update(){const h=$('#pick').value;$('#hex').value=h.toUpperCase();$('#rgb').value='rgb('+parseInt(h.slice(1,3),16)+', '+parseInt(h.slice(3,5),16)+', '+parseInt(h.slice(5,7),16)+')';$('#preview').style.background=h}$('#pick').oninput=update;$('#copyhex').onclick=()=>copy($('#hex').value);$('#copyrgb').onclick=()=>copy($('#rgb').value);update()}

function resize(){
 area.innerHTML='<div class="tool-form"><label>Choose an image<input type="file" id="resize-file" accept="image/*"></label><div class="options"><label>Width (px)<input id="resize-width" type="number" min="1" max="10000" value="800"></label><label>Height (px)<input id="resize-height" type="number" min="1" max="10000" value="600"></label></div><label class="inline-check"><input type="checkbox" id="resize-lock" checked> Keep aspect ratio</label><label>Output format<select id="resize-format"><option value="image/png">PNG</option><option value="image/jpeg">JPG</option><option value="image/webp">WebP</option></select></label><button class="action" id="resize-run">Resize & download</button><small>Maximum input: 50 MB and 40 megapixels. Output: up to 40 megapixels. Animated images become a single frame. Files stay on your device.</small></div>';
 const input=$('#resize-file'),w=$('#resize-width'),h=$('#resize-height'),run=$('#resize-run');
 const MAX_BYTES=50e6,MAX_PIXELS=4e7;let ratio=4/3,revision=0,loadedFile=null,processing=false;
 function validDimensions(width,height){return Number.isInteger(width)&&Number.isInteger(height)&&width>=1&&height>=1&&width<=10000&&height<=10000&&width*height<=MAX_PIXELS}
 function checkFile(file){if(!file)return 'Choose an image first.';if(file.size>MAX_BYTES)return 'Maximum file size is 50 MB.';if(file.type&&!file.type.startsWith('image/'))return 'Choose an image file.';return ''}
 input.onchange=async()=>{
  const current=++revision,file=input.files[0];loadedFile=null;
  if(!file)return note('');
  const error=checkFile(file);if(error)return note(error,true);
  let bitmap;
  try{
   bitmap=await createImageBitmap(file);
   if(current!==revision||input.files[0]!==file)return;
   if(!bitmap.width||!bitmap.height||bitmap.width*bitmap.height>MAX_PIXELS)return note('Maximum source image resolution is 40 megapixels.',true);
   ratio=bitmap.width/bitmap.height;w.value=bitmap.width;h.value=bitmap.height;loadedFile=file;
   note('Image loaded. Choose your dimensions.');
  }catch{if(current===revision)note('Unsupported image.',true)}
  finally{if(bitmap)bitmap.close()}
 };
 w.oninput=()=>{if($('#resize-lock').checked&&Number(w.value)>0)h.value=Math.max(1,Math.round(Number(w.value)/ratio))};
 h.oninput=()=>{if($('#resize-lock').checked&&Number(h.value)>0)w.value=Math.max(1,Math.round(Number(h.value)*ratio))};
 run.onclick=async()=>{
  if(processing)return;
  const file=input.files[0],width=Number(w.value),height=Number(h.value),error=checkFile(file);
  if(error)return note(error,true);
  if(file!==loadedFile)return note('Wait for the image to load or choose a supported image.',true);
  if(!validDimensions(width,height))return note('Dimensions must be valid, up to 10000 px per side and 40 megapixels.',true);
  processing=true;run.disabled=true;
  let bitmap;
  try{
   bitmap=await createImageBitmap(file);
   if(!bitmap.width||!bitmap.height||bitmap.width*bitmap.height>MAX_PIXELS)return note('Maximum source image resolution is 40 megapixels.',true);
   const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
   const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas unavailable');
   const type=$('#resize-format').value;
   if(type==='image/jpeg'){ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height)}
   ctx.drawImage(bitmap,0,0,width,height);
   bitmap.close();bitmap=null;
   const blob=await new Promise(resolve=>canvas.toBlob(resolve,type,.9));
   canvas.width=0;canvas.height=0;
   if(!blob)return note('Resize failed.',true);
   const ext=type==='image/jpeg'?'jpg':type.split('/')[1];
   save(blob,file.name.replace(/\.[^.]+$/,'')+'-'+width+'x'+height+'.'+ext);
   note('Resized to '+width+' × '+height+' pixels.');
  }catch{note('Could not resize this image.',true)}
  finally{if(bitmap)bitmap.close();processing=false;run.disabled=false}
 };
}
function caseConverter(){
 area.innerHTML='<div class="tool-form"><label>Your text<textarea id="case-text" placeholder="Paste or type text here..."></textarea></label><div class="actions"><button class="action" data-case="upper">UPPERCASE</button><button class="secondary" data-case="lower">lowercase</button><button class="secondary" data-case="title">Title Case</button><button class="secondary" data-case="sentence">Sentence case</button><button class="secondary" id="case-copy">Copy</button></div><small>Maximum text length: 1 million characters.</small></div>';
 const field=$('#case-text'),MAX=1000000;
 area.querySelectorAll('[data-case]').forEach(btn=>btn.onclick=()=>{
  if(field.value.length>MAX)return note('Text is too large. Maximum is 1 million characters.',true);
  const mode=btn.dataset.case;let t=field.value;
  if(mode==='upper')t=t.toUpperCase();
  if(mode==='lower')t=t.toLowerCase();
  if(mode==='title')t=t.toLowerCase().replace(/\b\p{L}/gu,c=>c.toUpperCase());
  if(mode==='sentence')t=t.toLowerCase().replace(/(^\s*\p{L}|[.!?]\s+\p{L})/gu,c=>c.toUpperCase());
  if(t.length>MAX)return note('Converted text exceeds the 1 million character limit.',true);
  field.value=t;note('Text converted.');
 });
 $('#case-copy').onclick=()=>field.value.length>MAX?note('Text is too large to copy.',true):copy(field.value);
}
function base64Tool(){
 area.innerHTML='<div class="tool-form"><label>Input text<textarea id="b64-input" placeholder="Enter text or Base64..."></textarea></label><div class="actions"><button class="action" id="b64-encode">Encode Base64</button><button class="secondary" id="b64-decode">Decode Base64</button><button class="secondary" id="b64-copy">Copy result</button><button class="secondary" id="b64-use">Use result as input</button></div><label>Result<textarea id="b64-output" readonly spellcheck="false"></textarea></label><small>Maximum input: 1 million characters. Decode uses the last encoded result when the input has not changed. Everything stays on your device.</small></div>';
 const input=$('#b64-input'),output=$('#b64-output'),MAX_INPUT=1000000,MAX_OUTPUT=2000000;
 let lastEncodedInput=null,lastEncodedResult=null;
 input.addEventListener('input',()=>{lastEncodedInput=null;lastEncodedResult=null});
 $('#b64-encode').onclick=()=>{
  if(input.value.length>MAX_INPUT)return note('Input is too large. Maximum is 1 million characters.',true);
  try{
   const bytes=new TextEncoder().encode(input.value);
   if(bytes.length>MAX_INPUT*3)return note('Encoded text is too large.',true);
   let binary='';
   for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
   const result=btoa(binary);
   if(result.length>MAX_OUTPUT)return note('Base64 result exceeds the output limit.',true);
   output.value=result;lastEncodedInput=input.value;lastEncodedResult=result;
   note('Text encoded. Click Decode to reverse it.');
  }catch{note('Could not encode this text.',true)}
 };
 $('#b64-decode').onclick=()=>{
  const source=lastEncodedInput!==null&&input.value===lastEncodedInput&&output.value===lastEncodedResult?lastEncodedResult:input.value;
  if(source.length>MAX_OUTPUT)return note('Base64 input is too large. Maximum is 2 million characters.',true);
  try{
   const raw=atob(source.replace(/\s+/g,'')),bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));
   const decoded=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
   if(decoded.length>MAX_INPUT)return note('Decoded text exceeds the 1 million character limit.',true);
   output.value=decoded;lastEncodedInput=null;lastEncodedResult=null;
   note('Base64 decoded successfully.');
  }catch{note('Invalid Base64 or non-UTF-8 data. Paste encoded text into Input.',true)}
 };
 $('#b64-copy').onclick=()=>output.value.length>MAX_OUTPUT?note('Result is too large to copy.',true):copy(output.value);
 $('#b64-use').onclick=()=>{if(output.value.length>MAX_OUTPUT)return note('Result is too large to move.',true);input.value=output.value;lastEncodedInput=null;lastEncodedResult=null;note('Result moved to input.')};
}
function uuidTool(){area.innerHTML='<div class="tool-form"><label>How many UUIDs?<input type="number" id="uuid-count" min="1" max="100" value="5"></label><div class="actions"><button class="action" id="uuid-generate">Generate UUIDs</button><button class="secondary" id="uuid-copy">Copy all</button></div><label>Generated UUIDs<textarea id="uuid-output" readonly spellcheck="false"></textarea></label><small>Cryptographically random UUID version 4, generated locally.</small></div>';const output=$('#uuid-output');$('#uuid-generate').onclick=()=>{const count=Number($('#uuid-count').value);if(!Number.isInteger(count)||count<1||count>100)return note('Choose 1–100 UUIDs.',true);if(!crypto.randomUUID)return note('Your browser does not support secure UUID generation.',true);output.value=Array.from({length:count},()=>crypto.randomUUID()).join('\n');note(count+' UUIDs generated.')};$('#uuid-copy').onclick=()=>copy(output.value);$('#uuid-generate').click()}


function imageBase64Tool(){
 area.innerHTML='<div class="tool-form"><label>Choose an image<input id="img64-file" type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/bmp,image/avif"></label><div class="actions"><button class="action" id="img64-convert">Convert to Base64</button><button class="secondary" id="img64-copy">Copy data URL</button><button class="secondary" id="img64-download">Download .txt</button></div><label>Base64 data URL<textarea id="img64-output" readonly spellcheck="false" placeholder="Your encoded image will appear here..."></textarea></label><small>Maximum file size: 5 MB. Your image stays in your browser. The output may be much larger than the original file.</small></div>';
 const input=$('#img64-file'),output=$('#img64-output'),button=$('#img64-convert');
 let fileName='image',reader=null,revision=0;
 input.onchange=()=>{
  revision++;if(reader&&reader.readyState===FileReader.LOADING)reader.abort();
  reader=null;output.value='';fileName='image';note('');
 };
 button.onclick=()=>{
  const file=input.files[0];
  if(!file)return note('Choose an image first.',true);
  if(!['image/png','image/jpeg','image/webp','image/gif','image/bmp','image/avif'].includes(file.type))return note('Please choose a supported image file.',true);
  if(file.size>5*1024*1024)return note('Maximum file size is 5 MB.',true);
  if(reader&&reader.readyState===FileReader.LOADING)return note('Conversion already in progress.');
  const current=revision;reader=new FileReader();const active=reader;
  button.disabled=true;
  active.onload=()=>{
   if(current!==revision||input.files[0]!==file)return;
   output.value=String(active.result);fileName=file.name.replace(/\.[^.]+$/,'');
   note('Image converted to Base64 ('+Math.round(output.value.length/1024)+' KB of text).');
  };
  active.onerror=()=>{if(current===revision)note('Could not read this image.',true)};
  active.onabort=()=>{if(current===revision)note('Conversion cancelled.',true)};
  active.onloadend=()=>{if(reader===active)reader=null;button.disabled=false};
  active.readAsDataURL(file);
 };
 $('#img64-copy').onclick=()=>output.value?copy(output.value):note('Convert an image first.',true);
 $('#img64-download').onclick=()=>output.value?save(new Blob([output.value],{type:'text/plain;charset=utf-8'}),fileName+'-base64.txt'):note('Convert an image first.',true);
}
function qrTool(){
 area.innerHTML='<div class="tool-form"><label>Link or text<textarea id="qr-input" placeholder="https://example.com" maxlength="1500"></textarea></label><label>Image size<select id="qr-size"><option value="256">256 × 256</option><option value="512" selected>512 × 512</option><option value="1024">1024 × 1024</option></select></label><div class="actions"><button class="action" id="qr-generate">Generate QR code</button><button class="secondary" id="qr-download" disabled>Download PNG</button></div><div id="qr-preview" style="display:none;max-width:100%;width:max-content;padding:16px;border-radius:12px;background:white"></div><small>QR codes are generated entirely on your device. No data is sent to a QR service. Use a camera app to test your code before sharing.</small></div>';
 const input=$('#qr-input'),preview=$('#qr-preview'),download=$('#qr-download');let png=null;
 const clear=()=>{png=null;download.disabled=true;preview.style.display='none';preview.replaceChildren()};
 input.addEventListener('input',clear);$('#qr-size').addEventListener('change',clear);
 $('#qr-generate').onclick=()=>{clear();const value=input.value.trim();if(!value)return note('Enter a link or text first.',true);if(new TextEncoder().encode(value).length>1200)return note('Text is too long for a reliable QR code. Try a shorter link.',true);if(typeof QRCode==='undefined')return note('QR library unavailable. Please refresh the page.',true);
 try{const holder=document.createElement('div');new QRCode(holder,{text:value,width:512,height:512,colorDark:'#000000',colorLight:'#ffffff',correctLevel:QRCode.CorrectLevel.M});const source=holder.querySelector('canvas');if(!source)throw Error('Canvas unavailable');const size=Number($('#qr-size').value),margin=Math.max(16,Math.round(size/16));const canvas=document.createElement('canvas');canvas.width=size;canvas.height=size;const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas unavailable');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,size,size);ctx.imageSmoothingEnabled=false;ctx.drawImage(source,margin,margin,size-2*margin,size-2*margin);png=canvas.toDataURL('image/png');const image=document.createElement('img');image.src=png;image.alt='Generated QR code';image.style.cssText='display:block;width:256px;max-width:100%;height:auto;image-rendering:pixelated';preview.appendChild(image);preview.style.display='block';download.disabled=false;note('QR code generated. Scan it to verify the content.')}catch(e){clear();note('Could not generate this QR code. Try shorter text.',true)}
 };
 download.onclick=()=>{if(!png)return note('Generate a QR code first.',true);const a=document.createElement('a');a.href=png;a.download='toolnovahub-qr.png';a.click();note('QR code downloaded.')};
}


function urlTool(){
 area.innerHTML='<div class="tool-form"><label>Input text<textarea id="url-input" placeholder="Paste text or an encoded URL component..."></textarea></label><div class="actions"><button class="action" id="url-encode">Encode</button><button class="secondary" id="url-decode">Decode</button><button class="secondary" id="url-use">Use result as input</button><button class="secondary" id="url-copy">Copy result</button></div><label>Result<textarea id="url-output" readonly spellcheck="false"></textarea></label><small>Maximum input: 1 million characters. For complete URLs, encode only parameter values. Processing stays in your browser.</small></div>';
 const input=$('#url-input'),output=$('#url-output'),MAX_INPUT=1000000,MAX_OUTPUT=3000000;
 let lastInput=null,lastEncoded=null;
 input.addEventListener('input',()=>{lastInput=null;lastEncoded=null});
 $('#url-encode').onclick=()=>{
  if(input.value.length>MAX_INPUT)return note('Input exceeds the 1 million character limit.',true);
  try{
   const result=encodeURIComponent(input.value);
   if(result.length>MAX_OUTPUT)return note('Encoded result exceeds the 3 million character limit.',true);
   output.value=result;lastInput=input.value;lastEncoded=result;note('Text encoded. Click Decode to reverse it.');
  }catch{note('Could not encode this text.',true)}
 };
 $('#url-decode').onclick=()=>{
  const value=lastInput!==null&&input.value===lastInput&&output.value===lastEncoded?lastEncoded:input.value;
  if(value.length>MAX_OUTPUT)return note('Encoded input exceeds the 3 million character limit.',true);
  try{
   const result=decodeURIComponent(value);
   if(result.length>MAX_INPUT)return note('Decoded result exceeds the 1 million character limit.',true);
   output.value=result;lastInput=null;lastEncoded=null;note('URL text decoded.');
  }catch{note('Invalid percent-encoding or UTF-8 sequence.',true)}
 };
 $('#url-use').onclick=()=>{if(output.value.length>MAX_OUTPUT)return note('Result is too large.',true);input.value=output.value;lastInput=null;lastEncoded=null;note('Result moved to input.')};
 $('#url-copy').onclick=()=>output.value?copy(output.value):note('Generate a result first.',true);
}

function hashTool(){
 area.innerHTML='<div class="tool-form"><label>Text to hash<textarea id="hash-input" placeholder="Enter text to generate a SHA-256 hash..."></textarea></label><div class="actions"><button class="action" id="hash-run">Generate SHA-256</button><button class="secondary" id="hash-copy">Copy hash</button></div><label>SHA-256 (hex)<textarea id="hash-output" readonly spellcheck="false"></textarea></label><small>Uses your browser’s Web Crypto API. Maximum input: 1 million characters. Nothing is uploaded. SHA-256 is a hash, not encryption.</small></div>';
 const input=$('#hash-input'),output=$('#hash-output');input.addEventListener('input',()=>{output.value=''});
 $('#hash-run').onclick=async()=>{if(input.value.length>1000000)return note('Maximum input is 1 million characters.',true);const value=input.value;const btn=$('#hash-run');btn.disabled=true;try{if(!crypto.subtle)throw Error('Web Crypto unavailable');const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));if(input.value!==value)return note('Input changed. Generate again.',true);output.value=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');note('SHA-256 hash generated locally.')}catch{note('Could not generate hash. Use a secure HTTPS connection.',true)}finally{btn.disabled=false}};
 $('#hash-copy').onclick=()=>output.value?copy(output.value):note('Generate a hash first.',true);
}
function duplicatesTool(){
 area.innerHTML='<div class="tool-form"><label>Input lines<textarea id="dedupe-input" placeholder="Paste lines here, one per line..."></textarea></label><div class="options"><label><input type="checkbox" id="dedupe-case"> Ignore letter case</label><label><input type="checkbox" id="dedupe-empty"> Remove empty lines</label></div><div class="actions"><button class="action" id="dedupe-run">Remove duplicates</button><button class="secondary" id="dedupe-copy">Copy result</button><button class="secondary" id="dedupe-download">Download TXT</button></div><label>Cleaned text<textarea id="dedupe-output" readonly></textarea></label><small>Keeps the first occurrence of each line and preserves its original text and order. Maximum input: 1 million characters. Runs locally.</small></div>';
 const input=$('#dedupe-input'),output=$('#dedupe-output');input.addEventListener('input',()=>{output.value=''});
 $('#dedupe-run').onclick=()=>{const value=input.value;if(value.length>1000000)return note('Maximum input is 1 million characters.',true);const lines=value.split(/\r\n|\n|\r/),seen=new Set(),result=[];let removed=0;for(const line of lines){if($('#dedupe-empty').checked&&!line.trim()){removed++;continue}const key=$('#dedupe-case').checked?line.toLocaleLowerCase():line;if(seen.has(key)){removed++;continue}seen.add(key);result.push(line)}output.value=result.join('\n');note('Done: '+removed+' line(s) removed; '+result.length+' unique line(s) kept.')};
 $('#dedupe-copy').onclick=()=>output.value?copy(output.value):note('Process some lines first.',true);
 $('#dedupe-download').onclick=()=>output.value?save(new Blob([output.value],{type:'text/plain;charset=utf-8'}),'unique-lines.txt'):note('Process some lines first.',true);
}
\nfunction open(k){if(!names[k])return;$('#tool-title').textContent=names[k][0];$('#tool-description').textContent=names[k][1];panel.hidden=false;status.textContent='';status.className='';({compress:()=>images(true),convert:()=>images(false),password:passwords,words,json,colors,resize,case:caseConverter,base64:base64Tool,uuid:uuidTool,imagebase64:imageBase64Tool,qr:qrTool,url:urlTool,hash:hashTool,dedupe:duplicatesTool})[k]();if(!document.body.dataset.toolPage)panel.scrollIntoView({behavior:'smooth'})}
const toolPages={"compress":"/tools/image-compressor/","convert":"/tools/image-converter/","password":"/tools/password-generator/","words":"/tools/word-counter/","json":"/tools/json-formatter/","colors":"/tools/color-converter/","resize":"/tools/image-resizer/","case":"/tools/text-case-converter/","base64":"/tools/base64-encoder-decoder/","uuid":"/tools/uuid-generator/","imagebase64":"/tools/image-to-base64/","qr":"/tools/qr-code-generator/","url":"/tools/url-encoder-decoder/","hash":"/tools/sha256-hash-generator/","dedupe":"/tools/remove-duplicate-lines/"};
document.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>{const destination=toolPages[b.dataset.tool];if(destination){location.assign(destination)}else{open(b.dataset.tool)}});if($('#back'))$('#back').onclick=()=>{if(document.body.dataset.toolPage){location.href='/#tools';return}panel.hidden=true;$('#tools').scrollIntoView({behavior:'smooth'})};
if(document.body.dataset.toolPage)open(document.body.dataset.toolPage);

function setupToolDiscovery(){
 const search=$('#tool-search'),tabs=[...document.querySelectorAll('.filter-tab')],cards=[...document.querySelectorAll('.tool-card')],empty=$('#empty-results'),count=$('#visible-count'),more=$('#show-all-tools'),categories=[...document.querySelectorAll('[data-category-jump]')];
 if(!search||!tabs.length||!empty||!count||!more)return;
 let category='all',expanded=false;
 const featured=new Set(['compress','convert','password','qr','words','json']);
 function filter(){
  const query=search.value.trim().toLocaleLowerCase(),showEverything=expanded||category!=='all'||query.length>0;
  let visible=0,matched=0;
  for(const card of cards){
   const match=(category==='all'||card.dataset.category===category)&&card.textContent.toLocaleLowerCase().includes(query);
   if(match)matched++;
   const show=match&&(showEverything||featured.has(card.dataset.tool));
   card.hidden=!show;if(show)visible++;
  }
  count.textContent=showEverything?visible+' of '+cards.length+' tools':visible+' featured tools · '+cards.length+' total';
  empty.hidden=matched!==0;
  more.hidden=category!=='all'||query.length>0;
  more.textContent=expanded?'Show fewer tools':'View all '+cards.length+' tools';
  more.setAttribute('aria-expanded',String(expanded));
 }
 function setCategory(value){
  category=value;tabs.forEach(t=>t.setAttribute('aria-pressed',String(t.dataset.filter===value)));
  filter();
 }
 search.addEventListener('input',filter);
 tabs.forEach(tab=>tab.addEventListener('click',()=>setCategory(tab.dataset.filter)));
 categories.forEach(tile=>tile.addEventListener('click',()=>{search.value='';setCategory(tile.dataset.categoryJump);$('#tools').scrollIntoView({behavior:'smooth'});search.focus({preventScroll:true})}));
 more.addEventListener('click',()=>{expanded=!expanded;filter()});
 filter();
}
setupToolDiscovery();
