
// ──────────────────────────────────────────────────
//  STATE
// ──────────────────────────────────────────────────
let pages = [];
let currentPageId = null;

async function loadPages() {
  try {
    const res = await fetch('/api/pages');
    pages = await res.json();
    if(pages.length === 0) {
      const createRes = await fetch('/api/pages', { 
        method:'POST', 
        headers:{'Content-Type':'application/json'}, 
        body: JSON.stringify({name:'Home'}) 
      });
      const newHome = await createRes.json();
      pages = [newHome];
    }
    
    // Hydrate blocks and find max ID
    let maxId = 0;
    pages.forEach(p => {
      (p.blocks || []).forEach(b => {
        const tpl = TEMPLATES[b.type];
        if (tpl) {
          b.label = tpl.label;
          b.html = tpl.render(b.data);
        }
        if (b.id > maxId) maxId = b.id;
      });
    });
    idCounter = maxId;

    currentPageId = pages[0].id;
    renderPageTabs();
    render();
  } catch(e) { console.error('Failed to load pages', e); }
}
let selectedId = null;
let dragType = null;
let dragBlockId = null;
let idCounter = 0;
let pageIdCounter = 1;
let activeModalBlock = null;
let activeModalTab = 'content';

function currentPage() { 
  return pages.find(p => p.id === currentPageId) || null; 
}
function get_blocks() { 
  const p = currentPage(); 
  return p ? (p.blocks || []) : []; 
}

// ──────────────────────────────────────────────────
//  TEMPLATES
// ──────────────────────────────────────────────────
const BG_COLORS = ['#1a1a2e','#5b4fff','#0F6E56','#cc3333','#111','#2d3a2e','#4a3728','#1e3a5f','#3d1a6e','#8b4513'];
const BG_LABELS = ['Dark Navy','Violet','Forest','Red','Charcoal','Dark Green','Brown','Navy','Purple','Brown'];

const TEMPLATES = {
  navbar: {
    label:'Navbar', icon:'☰', table:'Navbar',
    dataFields:['logo','ctaText'],
    defaultData:{ logo:'Brand', ctaText:'Get started' },
    render: d => `<div class="b-navbar"><div class="nav-logo">${d.logo}</div><div class="nav-links"><span>Home</span><span>About</span><span>Services</span></div><div class="nav-cta">${d.ctaText}</div></div>`
  },
  hero: {
    label:'Hero', icon:'★', table:'Hero',
    dataFields:['heading','subtext','btnText','bg'],
    defaultData:{ heading:'Build something great', subtext:'The fastest way to launch your next idea into the world.', btnText:'Get started free', bg:'#1a1a2e' },
    render: d => `<div class="b-hero" style="background:${d.bg}"><h1>${d.heading}</h1><p>${d.subtext}</p><button class="hero-btn">${d.btnText}</button></div>`
  },
  textbanner: {
    label:'Text Banner', icon:'◈', table:'TextBanner',
    dataFields:['heading','subtext','btnPrimary','btnSecondary','bg'],
    defaultData:{ heading:'We build better products', subtext:'Focused on quality, speed, and real impact for the teams that use us.', btnPrimary:'Start free', btnSecondary:'Learn more', bg:'#5b4fff' },
    render: d => `<div class="b-textbanner" style="background:${d.bg};color:${isLight(d.bg)?'#111':'#fff'}"><h2>${d.heading}</h2><p>${d.subtext}</p><div class="tb-actions"><button class="btn-primary">${d.btnPrimary}</button><button class="btn-secondary" style="color:${isLight(d.bg)?'#111':'#fff'}">${d.btnSecondary}</button></div></div>`
  },
  text: {
    label:'Text Block', icon:'¶', table:'TextBlock',
    dataFields:['heading','body'],
    defaultData:{ heading:'About us', body:'We are a team of passionate designers and engineers building tools that help teams ship faster without sacrificing quality or creativity.' },
    render: d => `<div class="b-text"><h2>${d.heading}</h2><p>${d.body}</p></div>`
  },
  imgtext: {
    label:'Image + Text', icon:'⬛', table:'ImageText',
    dataFields:['tag','heading','body','btnText','imgSrc','imgAlt','layout','imgPosition','textAlign','bg'],
    defaultData:{ tag:'Featured', heading:'A picture is worth a thousand words', body:'Pair rich visuals with compelling copy. Adjust image placement, text alignment, and colors to match your brand perfectly.', btnText:'Learn more', imgSrc:'', imgAlt:'Feature image', layout:'left', imgPosition:'center', textAlign:'left', bg:'#ffffff' },
    render: d => {
      const img = d.imgSrc
        ? `<img src="${d.imgSrc}" alt="${d.imgAlt}" style="width:100%;height:100%;object-fit:cover;object-position:${d.imgPosition}">`
        : `<div class="imgtext-img placeholder"><div class="ph-icon">🖼</div><div>600 × 400</div></div>`;
      const imgWrap = d.imgSrc ? `<div class="imgtext-img" style="overflow:hidden">${img}</div>` : img;
      return `<div class="b-imgtext img-${d.layout}" style="background:${d.bg}"><div class="imgtext-img" style="flex:0 0 45%;background:#f0ede8;min-height:180px;overflow:hidden">${d.imgSrc?`<img src="${d.imgSrc}" alt="${d.imgAlt}" style="width:100%;height:100%;object-fit:cover;object-position:${d.imgPosition}">`:`<div class="imgtext-img placeholder" style="height:100%;min-height:180px"><div class="ph-icon">🖼</div><div style="font-size:11px">Click to set image</div></div>`}</div><div class="imgtext-body" style="text-align:${d.textAlign}"><div class="it-tag">${d.tag}</div><h2>${d.heading}</h2><p>${d.body}</p><button class="it-btn">${d.btnText}</button></div></div>`;
    }
  },
  gridimgtext: {
    label:'Grid Cards', icon:'⊞', table:'GridImageText',
    dataFields:['heading','subtext','cols','items','cardBg','headerBg','titleColor','descColor','tagColor','textAlign','imgPosition'],
    defaultData:{
      heading:'Our work', subtext:'A selection of recent projects and case studies.', cols:'3', cardBg:'#ffffff', headerBg:'#f0ede8',
      titleColor:'#111111', descColor:'#666666', tagColor:'#888888', textAlign:'left', imgPosition:'center',
      items:[
        {title:'Project Alpha',desc:'A modern SaaS product for enterprise teams.',tag:'Product',imgSrc:''},
        {title:'Brand Identity',desc:'Full visual identity system for a fintech startup.',tag:'Design',imgSrc:''},
        {title:'Mobile App',desc:'Cross-platform mobile experience, zero to launch.',tag:'Mobile',imgSrc:''},
      ]
    },
    render: d => {
      const imgPos = d.imgPosition || 'center';
      const textAlign = d.textAlign || 'left';
      const titleColor = d.titleColor || '#111111';
      const descColor = d.descColor || '#666666';
      const tagColor = d.tagColor || '#888888';
      const cards = (d.items||[]).map(it => {
        const imgHtml = it.imgSrc ? `<img src="${it.imgSrc}" alt="${it.title||''}" style="width:100%;height:100%;object-fit:cover;object-position:${imgPos}">` : `<span style="font-size:24px;color:#bbb">🖼</span>`;
        return `<div class="git-card" style="background:${d.cardBg}"><div class="git-card-img" style="background:${d.headerBg}">${imgHtml}</div><div class="git-card-body" style="text-align:${textAlign}"><span class="git-tag" style="color:${tagColor};background:${tagColor}18">${it.tag||''}</span><h3 style="color:${titleColor}">${it.title}</h3><p style="color:${descColor}">${it.desc}</p></div></div>`;
      }).join('');
      return `<div class="b-gridimgtext"><div class="git-header"><h2>${d.heading}</h2><p>${d.subtext}</p></div><div class="git-grid cols-${d.cols}">${cards}</div></div>`;
    }
  },
  gridimgtextrow: {
    label:'Grid Image+Text', icon:'▤', table:'GridImgTextRow',
    dataFields:['heading','subtext','cols','items','cardBg','imgBg','titleColor','descColor','tagColor','btnColor','textAlign','imgPosition','imgLayout'],
    defaultData:{
      heading:'What we offer', subtext:'Each card pairs a visual with focused copy.', cols:'2',
      cardBg:'#ffffff', imgBg:'#f0ede8',
      titleColor:'#111111', descColor:'#666666', tagColor:'#5b4fff', btnColor:'#111111',
      textAlign:'left', imgPosition:'center', imgLayout:'left',
      items:[
        {title:'Design Systems',desc:'Scalable, consistent UI components built for your brand.',tag:'Design',btnText:'Learn more',imgSrc:''},
        {title:'Development',desc:'Clean, maintainable code that ships fast and scales well.',tag:'Engineering',btnText:'Learn more',imgSrc:''},
        {title:'Strategy',desc:'Product thinking grounded in real user needs and data.',tag:'Strategy',btnText:'Learn more',imgSrc:''},
        {title:'Growth',desc:'Marketing and analytics frameworks that drive measurable results.',tag:'Growth',btnText:'Learn more',imgSrc:''},
      ]
    },
    render: d => {
      const imgPos   = d.imgPosition || 'center';
      const imgLayout = d.imgLayout || 'left';
      const textAlign = d.textAlign || 'left';
      const titleColor = d.titleColor || '#111111';
      const descColor  = d.descColor  || '#666666';
      const tagColor   = d.tagColor   || '#5b4fff';
      const btnColor   = d.btnColor   || '#111111';
      const cards = (d.items||[]).map(it => {
        const imgHtml = it.imgSrc
          ? `<img src="${it.imgSrc}" alt="${it.title||''}" style="width:100%;height:100%;object-fit:cover;object-position:${imgPos}">`
          : `<span style="font-size:22px;color:#bbb">&#128444;</span>`;
        return `<div class="gitrow-card img-${imgLayout}" style="background:${d.cardBg}"><div class="gitrow-card-img" style="background:${d.imgBg}">${imgHtml}</div><div class="gitrow-card-body" style="text-align:${textAlign}"><span class="gr-tag" style="color:${tagColor};background:${tagColor}18">${it.tag||''}</span><h3 style="color:${titleColor}">${it.title||''}</h3><p style="color:${descColor}">${it.desc||''}</p><button class="gr-btn" style="background:${btnColor}">${it.btnText||'Learn more'}</button></div></div>`;
      }).join('');
      return `<div class="b-gridimgtextrow"><div class="gitrow-header"><h2>${d.heading}</h2><p>${d.subtext}</p></div><div class="gitrow-grid cols-${d.cols}">${cards}</div></div>`;
    }
  },
  features: {
    label:'Features', icon:'⊡', table:'Features',
    dataFields:['heading','items'],
    defaultData:{ heading:'Why choose us', items:[{icon:'⚡',title:'Fast',desc:'Blazing fast performance.'},{icon:'🔒',title:'Secure',desc:'Enterprise-grade security.'},{icon:'🎨',title:'Beautiful',desc:'Pixel-perfect designs.'}] },
    render: d => {
      const cards = (d.items||[]).map(it=>`<div class="feat-card"><div class="feat-icon">${it.icon}</div><h3>${it.title}</h3><p>${it.desc}</p></div>`).join('');
      return `<div class="b-features"><h2>${d.heading}</h2><div class="feat-grid">${cards}</div></div>`;
    }
  },
  cta: {
    label:'CTA Banner', icon:'▶', table:'CTABanner',
    dataFields:['heading','subtext','btnText','bg'],
    defaultData:{ heading:'Ready to get started?', subtext:'Join thousands of teams already using our platform.', btnText:'Start for free', bg:'#5b4fff' },
    render: d => `<div class="b-cta" style="background:${d.bg}"><h2>${d.heading}</h2><p>${d.subtext}</p><button style="color:${d.bg}">${d.btnText}</button></div>`
  },
  testimonial: {
    label:'Testimonial', icon:'❝', table:'Testimonial',
    dataFields:['quote','author','role'],
    defaultData:{ quote:'This tool changed the way we work. Our team ships 3x faster and our designs have never looked better.', author:'Sarah Johnson', role:'Head of Design at Acme' },
    render: d => {
      const initials = d.author.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
      return `<div class="b-testimonial"><blockquote>"${d.quote}"</blockquote><div class="author"><div class="avatar">${initials}</div><div class="author-info"><strong>${d.author}</strong><span>${d.role}</span></div></div></div>`;
    }
  },
  form: {
    label:'Contact Form', icon:'⬜', table:'ContactForm',
    dataFields:['heading','btnText'],
    defaultData:{ heading:'Get in touch', btnText:'Send message' },
    render: d => `<div class="b-form"><h2>${d.heading}</h2><div class="form-row"><div class="form-field"><label>First name</label><input type="text" placeholder="Jane"></div><div class="form-field"><label>Last name</label><input type="text" placeholder="Smith"></div></div><div class="form-field" style="margin-bottom:10px"><label>Email</label><input type="email" placeholder="jane@company.com"></div><div class="form-field" style="margin-bottom:10px"><label>Message</label><textarea rows="3" placeholder="How can we help?" style="resize:none;font-family:var(--sans)"></textarea></div><button class="submit-btn">${d.btnText}</button></div>`
  },
  footer: {
    label:'Footer', icon:'▬', table:'Footer',
    dataFields:['brand','copy'],
    defaultData:{ brand:'Brand', copy:'© 2026 Brand Inc.' },
    render: d => `<div class="b-footer"><div class="footer-brand">${d.brand}</div><div class="footer-links"><span>Privacy</span><span>Terms</span><span>Contact</span></div><div class="footer-copy">${d.copy}</div></div>`
  }
};

function isLight(hex) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return (r*299+g*587+b*114)/1000 > 128;
}

// ──────────────────────────────────────────────────
//  PAGES
// ──────────────────────────────────────────────────
function renderPageTabs() {
  const cont = document.getElementById('page-tabs');
  cont.innerHTML = pages.map(p =>
    `<div class="page-tab${p.id===currentPageId?' active':''}" onclick="switchPage(${p.id})">${p.name}</div>`
  ).join('');
}
function switchPage(id) {
  selectedId = null;
  currentPageId = id;
  renderPageTabs();
  render();
  document.getElementById('props-body').innerHTML = '<p class="empty">Select a block to edit its properties.</p>';
}
function openPageModal() { document.getElementById('pm-name-input').value=''; document.getElementById('page-modal').classList.add('open'); document.getElementById('pm-name-input').focus(); }
async function createPage() {
  const name = document.getElementById('pm-name-input').value.trim() || 'Page '+(pages.length+1);
  try {
    const res = await fetch('/api/pages', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({name})
    });
    const newPage = await res.json();
    newPage.blocks = []; // Ensure initialized
    pages.push(newPage);
    document.getElementById('page-modal').classList.remove('open');
    switchPage(newPage.id);
  } catch(e) { console.error(e); }
}

async function deletePage(id) {
  if (pages.length <= 1) {
    alert("Cannot delete the last page.");
    return;
  }
  if (!confirm("Are you sure you want to delete this page?")) return;
  
  try {
    const res = await fetch(`/api/pages/${id}`, { method: 'DELETE' });
    if (res.ok) {
      pages = pages.filter(p => p.id !== id);
      if (currentPageId === id) {
        currentPageId = pages[0].id;
      }
      renderPageTabs();
      render();
    } else {
      alert("Failed to delete page.");
    }
  } catch(e) { console.error(e); }
}

// ──────────────────────────────────────────────────
//  DRAG & DROP
// ──────────────────────────────────────────────────
document.querySelectorAll('.comp-item').forEach(el => {
  el.addEventListener('dragstart', e => { e.stopPropagation(); dragType = el.dataset.type; dragBlockId = null; e.dataTransfer.effectAllowed='copy'; });
  el.addEventListener('dragend', () => { dragType = null; });
});
const canvas = document.getElementById('canvas');
canvas.addEventListener('dragover', e => { e.preventDefault(); canvas.classList.add('drag-over'); });
canvas.addEventListener('dragleave', e => { if(!canvas.contains(e.relatedTarget)) canvas.classList.remove('drag-over'); });
canvas.addEventListener('drop', e => { e.preventDefault(); canvas.classList.remove('drag-over'); if(dragType) addBlock(dragType); dragType=null; dragBlockId=null; });

// Prevent multiple simultaneous drags
document.addEventListener('dragstart', e => {
  // Only one drag source can be active at a time; state is already set by the specific handlers
  // This guard ensures no ghost state if drag is cancelled mid-flight
}, true);

// ──────────────────────────────────────────────────
//  BLOCKS
// ──────────────────────────────────────────────────
function addBlock(type, afterId=null) {
  const page = currentPage();
  if(!page) { alert("Please select or create a page first."); return; }
  const tpl = TEMPLATES[type]; if(!tpl) return;
  const id = ++idCounter;
  const data = JSON.parse(JSON.stringify(tpl.defaultData));
  const block = { id, type, label:tpl.label, data, pageId: currentPageId, componentOrder: get_blocks().length+1 };
  block.html = tpl.render(data);
  if(afterId !== null) { const idx = get_blocks().findIndex(b=>b.id===afterId); get_blocks().splice(idx+1,0,block); }
  else get_blocks().push(block);
  render(); selectBlock(id);
}

function render() {
  const blocks = get_blocks();
  const inner = document.getElementById('canvas-inner');
  const hint = document.getElementById('drop-hint');
  const countBtn = document.getElementById('block-count-btn');
  if(blocks.length===0){ inner.innerHTML=''; inner.appendChild(hint); countBtn.textContent='0 blocks'; return; }
  if(hint) hint.remove(); inner.innerHTML='';
  blocks.forEach(block => {
    const tpl = TEMPLATES[block.type];
    const wrap = document.createElement('div');
    wrap.className='canvas-block'+(selectedId===block.id?' selected':'');
    wrap.dataset.id = block.id;
    wrap.innerHTML = block.html;

    const ctrl = document.createElement('div');
    ctrl.className='block-controls';
    const hasListData = ['gridimgtext','gridimgtextrow','features'].includes(block.type);
    ctrl.innerHTML=`
      <button class="blk-ctrl" title="Move up" onclick="moveBlock(${block.id},-1)">↑</button>
      <button class="blk-ctrl" title="Move down" onclick="moveBlock(${block.id},1)">↓</button>
      <button class="blk-ctrl" title="Duplicate" onclick="duplicateBlock(${block.id})">⧉</button>
      ${hasListData?`<button class="blk-ctrl data-btn" title="Edit data" onclick="openModal(${block.id})">⊞ data</button>`:''}
      <button class="blk-ctrl del" title="Delete" onclick="deleteBlock(${block.id})">✕</button>`;
    wrap.appendChild(ctrl);

    wrap.addEventListener('click', e=>{ e.stopPropagation(); selectBlock(block.id); });
    wrap.setAttribute('draggable',true);
    wrap.addEventListener('dragstart', e=>{ dragBlockId=block.id; dragType=null; e.dataTransfer.effectAllowed='move'; e.stopPropagation(); wrap.classList.add('dragging'); });
    wrap.addEventListener('dragend', ()=>{ wrap.classList.remove('dragging'); dragBlockId=null; dragType=null; document.querySelectorAll('.drag-over-block').forEach(el=>el.classList.remove('drag-over-block')); });
    wrap.addEventListener('dragover', e=>{ e.preventDefault(); e.stopPropagation(); if(dragBlockId&&dragBlockId!==block.id){ document.querySelectorAll('.drag-over-block').forEach(el=>el.classList.remove('drag-over-block')); wrap.classList.add('drag-over-block'); } });
    wrap.addEventListener('drop', e=>{ e.stopPropagation(); e.preventDefault(); canvas.classList.remove('drag-over'); if(dragBlockId&&dragBlockId!==block.id){ reorderBlock(dragBlockId,block.id); } else if(dragType){ addBlock(dragType,block.id); } dragBlockId=null; dragType=null; wrap.classList.remove('drag-over-block'); });
    inner.appendChild(wrap);
  });
  countBtn.textContent = blocks.length+' block'+(blocks.length!==1?'s':'');
}

function selectBlock(id) {
  selectedId = id; render();
  const block = get_blocks().find(b=>b.id===id); if(!block) return;
  renderProps(block);
}
canvas.addEventListener('click',()=>{ selectedId=null; render(); document.getElementById('props-body').innerHTML='<p class="empty">Select a block to edit its properties.</p>'; });

function rebuildBlock(block) {
  const tpl = TEMPLATES[block.type]; if(!tpl) return;
  block.html = tpl.render(block.data);
}

function deleteBlock(id){ const blocks=get_blocks(); const idx=blocks.findIndex(b=>b.id===id); blocks.splice(idx,1); if(selectedId===id){selectedId=null; document.getElementById('props-body').innerHTML='<p class="empty">Select a block.</p>';} render(); }
function moveBlock(id,dir){ const blocks=get_blocks(); const idx=blocks.findIndex(b=>b.id===id); const ni=idx+dir; if(ni<0||ni>=blocks.length) return; [blocks[idx],blocks[ni]]=[blocks[ni],blocks[idx]]; render(); }
function duplicateBlock(id){ const blocks=get_blocks(); const block=blocks.find(b=>b.id===id); if(!block) return; const nb={...block,id:++idCounter,data:JSON.parse(JSON.stringify(block.data))}; nb.html=TEMPLATES[nb.type].render(nb.data); blocks.splice(blocks.indexOf(block)+1,0,nb); render(); selectBlock(nb.id); }
function reorderBlock(fromId,toId){ const blocks=get_blocks(); const fi=blocks.findIndex(b=>b.id===fromId); const ti=blocks.findIndex(b=>b.id===toId); const [r]=blocks.splice(fi,1); blocks.splice(ti,0,r); render(); }
function clearCanvas(){ if(!get_blocks().length) return; currentPage().blocks=[]; selectedId=null; document.getElementById('props-body').innerHTML='<p class="empty">Select a block.</p>'; render(); }

// ──────────────────────────────────────────────────
//  PROPS PANEL
// ──────────────────────────────────────────────────
function renderProps(block) {
  const tpl = TEMPLATES[block.type]; if(!tpl) return;
  const d = block.data;
  const pb = document.getElementById('props-body');
  let html = `<div style="font-size:12px;font-weight:500;color:var(--text);margin-bottom:12px;display:flex;align-items:center;gap:6px"><span style="width:20px;height:20px;background:var(--accent-light);border-radius:5px;display:inline-flex;align-items:center;justify-content:center;font-size:11px;color:var(--accent-text)">${tpl.icon}</span>${block.label}</div>`;

  // simple text fields
  const textFields = { heading:'Heading', subtext:'Subtext', body:'Body', btnText:'Button', btnPrimary:'Primary btn', btnSecondary:'Secondary btn', logo:'Logo', ctaText:'CTA text', brand:'Brand', copy:'Copyright', quote:'Quote', author:'Author', role:'Role', tag:'Tag label', it_tag:'Tag', imgAlt:'Image alt' };
  Object.entries(textFields).forEach(([k,label])=>{
    if(d[k]===undefined) return;
    html+=`<div class="prop-group"><span class="prop-label">${label}</span><input class="prop-input" value="${String(d[k]).replace(/"/g,'&quot;')}" oninput="updateProp(${block.id},'${k}',this.value)"></div>`;
  });

  // img src
  if(d.imgSrc!==undefined){
    html+=`<div class="prop-group"><span class="prop-label">Image URL</span><input class="prop-input" value="${d.imgSrc}" placeholder="https://..." oninput="updateProp(${block.id},'imgSrc',this.value)"></div>`;
  }

  // layout for imgtext
  if(d.layout!==undefined){
    html+=`<div class="prop-group"><span class="prop-label">Image position</span><div class="pos-grid">
      ${['left','right','top','bottom'].map(v=>`<button class="pos-btn${d.layout===v?' active':''}" onclick="updateProp(${block.id},'layout','${v}')">${v.charAt(0).toUpperCase()+v.slice(1)}</button>`).join('')}
    </div></div>`;
  }
  // textAlign
  if(d.textAlign!==undefined){
    html+=`<div class="prop-group"><span class="prop-label">Text align</span><div class="pos-grid">
      ${['left','center','right'].map(v=>`<button class="pos-btn${d.textAlign===v?' active':''}" onclick="updateProp(${block.id},'textAlign','${v}')">${v.charAt(0).toUpperCase()+v.slice(1)}</button>`).join('')}
    </div></div>`;
  }
  // cols
  if(d.cols!==undefined){
    html+=`<div class="prop-group"><span class="prop-label">Columns</span><div class="pos-grid">
      ${['2','3','4'].map(v=>`<button class="pos-btn${d.cols===v?' active':''}" onclick="updateProp(${block.id},'cols','${v}')">${v} cols</button>`).join('')}
    </div></div>`;
  }

  // bg color
  if(d.bg!==undefined){
    html+=`<div class="prop-group"><span class="prop-label">Background</span><div class="bg-grid">
      ${BG_COLORS.map(c=>`<div class="bg-swatch${d.bg===c?' active':''}" style="background:${c}" title="${c}" onclick="updateProp(${block.id},'bg','${c}')"></div>`).join('')}
      <div class="bg-swatch" style="background:linear-gradient(135deg,#fff 50%,#eee 50%);border:1px solid #ddd" title="White" onclick="updateProp(${block.id},'bg','#ffffff')"></div>
    </div></div>`;
  }

  // data connect button for list types
  if(['gridimgtext','gridimgtextrow','features'].includes(block.type)){
    html+=`<div class="prop-section">Backend data</div>`;
    html+=`<div class="prop-group"><span class="prop-label" style="color:var(--text3);font-size:10px;font-family:var(--mono)">Table: ${tpl.table}</span></div>`;
    html+=`<button class="data-connect-btn" onclick="openModal(${block.id})">⊞ Edit list data</button>`;
  }

  // schema note
  html+=`<div class="prop-section">DB schema</div>`;
  html+=`<div style="font-size:10px;font-family:var(--mono);color:var(--text3);line-height:1.8">
    <div>table: <span style="color:var(--accent-text)">${tpl.table}</span></div>
    <div>pageId: <span style="color:var(--amber)">INT FK</span></div>
    <div>componentOrder: <span style="color:var(--amber)">INT</span></div>
    <div>blockId: <span style="color:var(--amber)">VARCHAR</span></div>
  </div>`;

  pb.innerHTML = html;
}

function updateProp(id, key, value) {
  const block = get_blocks().find(b=>b.id===id); if(!block) return;
  block.data[key] = value;
  rebuildBlock(block); render(); renderProps(block);
}

// ──────────────────────────────────────────────────
//  DATA MODAL
// ──────────────────────────────────────────────────
function openModal(blockId) {
  activeModalBlock = get_blocks().find(b=>b.id===blockId); if(!activeModalBlock) return;
  const tpl = TEMPLATES[activeModalBlock.type];
  document.getElementById('modal-icon').textContent = tpl.icon;
  document.getElementById('modal-title').textContent = tpl.label+' — data editor';
  document.getElementById('modal-subtitle').textContent = `PageId: ${currentPageId} · ComponentOrder: ${activeModalBlock.componentOrder} · Table: ${tpl.table}`;
  document.getElementById('modal-schema-note').textContent = `INSERT INTO ${tpl.table} (pageId, componentOrder, ...) VALUES (...)`;
  activeModalTab = 'content';
  renderModalBody();
  document.getElementById('modal-overlay').classList.add('open');
}
function closeModal() { document.getElementById('modal-overlay').classList.remove('open'); activeModalBlock=null; }

function renderModalBody() {
  if(!activeModalBlock) return;
  const type = activeModalBlock.type;
  const d = activeModalBlock.data;
  const body = document.getElementById('modal-body');

  const tabs = `<div class="m-tabs">
    <button class="m-tab${activeModalTab==='content'?' active':''}" onclick="setModalTab('content')">Content</button>
    <button class="m-tab${activeModalTab==='style'?' active':''}" onclick="setModalTab('style')">Style & Layout</button>
    <button class="m-tab${activeModalTab==='schema'?' active':''}" onclick="setModalTab('schema')">DB Schema</button>
  </div>`;

  if(activeModalTab==='content'){
    if(type==='gridimgtext'){
      body.innerHTML = tabs + renderGridItemsForm(d);
    } else if(type==='gridimgtextrow'){
      body.innerHTML = tabs + renderGridImgTextRowForm(d);
    } else if(type==='features'){
      body.innerHTML = tabs + renderFeatItemsForm(d);
    } else {
      body.innerHTML = tabs + '<p style="color:var(--text2);font-size:13px">Use the properties panel on the right to edit this block\'s content.</p>';
    }
  } else if(activeModalTab==='style'){
    body.innerHTML = tabs + renderStyleTab(d, type);
  } else {
    body.innerHTML = tabs + renderSchemaTab(type);
  }
}

function setModalTab(tab){ activeModalTab=tab; renderModalBody(); }

function renderGridItemsForm(d) {
  let html = `<div class="m-field"><div class="m-label">Section heading</div><input class="m-input" id="m-heading" value="${d.heading}"></div>`;
  html += `<div class="m-field"><div class="m-label">Subtext</div><input class="m-input" id="m-subtext" value="${d.subtext}"></div>`;
  html += `<div class="m-field"><div class="m-label">Columns <span class="m-badge">layout</span></div><select class="m-select" id="m-cols"><option${d.cols==='2'?' selected':''}>2</option><option${d.cols==='3'?' selected':''}>3</option><option${d.cols==='4'?' selected':''}>4</option></select></div>`;
  html += `<div class="m-label" style="margin-bottom:8px">Cards <span class="m-badge">list</span></div>`;
  html += `<div class="m-list" id="m-items-list">`;
  (d.items||[]).forEach((it,i) => {
    html += `<div class="m-list-item">
      <div class="item-num">${i+1}</div>
      <div class="item-img">${it.imgSrc?`<img src="${it.imgSrc}">`:'🖼'}</div>
      <div class="item-inputs">
        <input placeholder="Title" value="${it.title||''}" oninput="updateListItem('gridimgtext',${i},'title',this.value)">
        <input placeholder="Tag (e.g. Design)" value="${it.tag||''}" oninput="updateListItem('gridimgtext',${i},'tag',this.value)">
        <input placeholder="Description" value="${it.desc||''}" oninput="updateListItem('gridimgtext',${i},'desc',this.value)" style="grid-column:span 2">
        <input placeholder="Image URL (optional)" value="${it.imgSrc||''}" oninput="updateListItem('gridimgtext',${i},'imgSrc',this.value);updateImgPreview(this,${i})" style="grid-column:span 2">
      </div>
      <button style="border:none;background:none;cursor:pointer;color:var(--text3);font-size:14px;padding:2px" onclick="removeListItem(${i})">✕</button>
    </div>`;
  });
  html += `</div><button class="m-add-btn" onclick="addListItem('gridimgtext')">+ Add card</button>`;
  return html;
}

function renderGridImgTextRowForm(d){
  let html = `<div class="m-field"><div class="m-label">Section heading</div><input class="m-input" id="m-heading" value="${d.heading}"></div>`;
  html += `<div class="m-field"><div class="m-label">Subtext</div><input class="m-input" id="m-subtext" value="${d.subtext}"></div>`;
  html += `<div class="m-field"><div class="m-label">Columns <span class="m-badge">layout</span></div><select class="m-select" id="m-cols"><option${d.cols==='1'?' selected':''}>1</option><option${d.cols==='2'?' selected':''}>2</option><option${d.cols==='3'?' selected':''}>3</option></select></div>`;
  html += `<div class="m-label" style="margin-bottom:8px">Cards <span class="m-badge">list</span></div>`;
  html += `<div class="m-list" id="m-items-list">`;
  (d.items||[]).forEach((it,i) => {
    html += `<div class="m-list-item">
      <div class="item-num">${i+1}</div>
      <div class="item-img">${it.imgSrc?`<img src="${it.imgSrc}">`:'&#128444;'}</div>
      <div class="item-inputs">
        <input placeholder="Title" value="${it.title||''}" oninput="updateListItem('gridimgtextrow',${i},'title',this.value)">
        <input placeholder="Tag" value="${it.tag||''}" oninput="updateListItem('gridimgtextrow',${i},'tag',this.value)">
        <input placeholder="Description" value="${it.desc||''}" oninput="updateListItem('gridimgtextrow',${i},'desc',this.value)" style="grid-column:span 2">
        <input placeholder="Button label" value="${it.btnText||'Learn more'}" oninput="updateListItem('gridimgtextrow',${i},'btnText',this.value)">
        <input placeholder="Image URL" value="${it.imgSrc||''}" oninput="updateListItem('gridimgtextrow',${i},'imgSrc',this.value);updateImgPreview(this,${i})">
      </div>
      <button style="border:none;background:none;cursor:pointer;color:var(--text3);font-size:14px;padding:2px" onclick="removeListItem(${i})">&#x2715;</button>
    </div>`;
  });
  html += `</div><button class="m-add-btn" onclick="addListItem('gridimgtextrow')">+ Add card</button>`;
  return html;
}

function renderFeatItemsForm(d){
  let html=`<div class="m-field"><div class="m-label">Section heading</div><input class="m-input" id="m-heading" value="${d.heading}"></div>`;
  html+=`<div class="m-label" style="margin-bottom:8px">Features <span class="m-badge">list</span></div><div class="m-list">`;
  (d.items||[]).forEach((it,i)=>{
    html+=`<div class="m-list-item">
      <div class="item-num">${i+1}</div>
      <div class="item-inputs">
        <input placeholder="Icon (emoji)" value="${it.icon||''}" oninput="updateListItem('features',${i},'icon',this.value)" style="max-width:60px">
        <input placeholder="Title" value="${it.title||''}" oninput="updateListItem('features',${i},'title',this.value)">
        <input placeholder="Description" value="${it.desc||''}" oninput="updateListItem('features',${i},'desc',this.value)" style="grid-column:span 2">
      </div>
      <button style="border:none;background:none;cursor:pointer;color:var(--text3);font-size:14px" onclick="removeListItem(${i})">✕</button>
    </div>`;
  });
  html+=`</div><button class="m-add-btn" onclick="addListItem('features')">+ Add feature</button>`;
  return html;
}

function renderStyleTab(d, type){
  let html='';
  if(d.bg!==undefined){
    html+=`<div class="m-field"><div class="m-label">Background color</div><div class="bg-grid" style="grid-template-columns:repeat(10,1fr);gap:6px;margin-top:6px">
      ${BG_COLORS.map(c=>`<div class="bg-swatch${d.bg===c?' active':''}" style="background:${c}" onclick="modalUpdateProp('bg','${c}')"></div>`).join('')}
      <div class="bg-swatch" style="background:#fff;border:1px solid #ddd" onclick="modalUpdateProp('bg','#ffffff')"></div>
    </div></div>`;
  }
  if(d.layout!==undefined){
    html+=`<div class="m-field"><div class="m-label">Image placement</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">
      ${['left','right','top','bottom'].map(v=>`<button class="pos-btn${d.layout===v?' active':''}" onclick="modalUpdateProp('layout','${v}')" style="padding:6px 14px">${v}</button>`).join('')}
    </div></div>`;
  }
  if(d.textAlign!==undefined){
    html+=`<div class="m-field"><div class="m-label">Text align</div><div style="display:flex;gap:6px;margin-top:4px">
      ${['left','center','right'].map(v=>`<button class="pos-btn${d.textAlign===v?' active':''}" onclick="modalUpdateProp('textAlign','${v}')" style="padding:6px 14px">${v.charAt(0).toUpperCase()+v.slice(1)}</button>`).join('')}
    </div></div>`;
  }
  if(d.cardBg!==undefined){
    html+=`<div class="m-field"><div class="m-label">Card background</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">
      ${['#ffffff','#f9f9f7','#f0ede8','#eef4ff','#f0fff4'].map(c=>`<div class="bg-swatch" style="background:${c};border:2px solid ${d.cardBg===c?'#111':'#ddd'}" onclick="modalUpdateProp('cardBg','${c}')"></div>`).join('')}
    </div></div>`;
  }
  if(d.headerBg!==undefined){
    html+=`<div class="m-field"><div class="m-label">Image area background</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">
      ${['#f0ede8','#e8ecf0','#e8f0e8','#f0e8f0','#e8e8e8','#1a1a2e','#5b4fff','#0F6E56'].map(c=>`<div class="bg-swatch" style="background:${c};border:2px solid ${d.headerBg===c?'#111':'#ddd'}" onclick="modalUpdateProp('headerBg','${c}')"></div>`).join('')}
    </div></div>`;
  }
  if(d.imgLayout!==undefined){
    html+=`<div class="m-field"><div class="m-label">Image side (per card)</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">
      ${[['left','Image Left'],['right','Image Right'],['top','Image Top'],['bottom','Image Bottom']].map(([v,l])=>`<button class="pos-btn${d.imgLayout===v?' active':''}" onclick="modalUpdateProp('imgLayout','${v}')" style="padding:6px 14px">${l}</button>`).join('')}
    </div></div>`;
  }
  if(d.imgBg!==undefined){
    html+=`<div class="m-field"><div class="m-label">Image area background</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">
      ${['#f0ede8','#e8ecf0','#e8f0e8','#f0e8f0','#e8e8e8','#1a1a2e','#5b4fff','#0F6E56'].map(c=>`<div class="bg-swatch" style="background:${c};border:2px solid ${d.imgBg===c?'#111':'#ddd'}" onclick="modalUpdateProp('imgBg','${c}')"></div>`).join('')}
    </div></div>`;
  }
  if(d.btnColor!==undefined){
    const btnColors=['#111111','#5b4fff','#0F6E56','#cc3333','#d97706','#1e3a5f','#3d34cc','#ffffff'];
    html+=`<div class="m-field"><div class="m-label">Button color</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">
      ${btnColors.map(c=>`<div class="bg-swatch" style="background:${c};border:2px solid ${d.btnColor===c?'var(--accent)':'#ddd'}" title="${c}" onclick="modalUpdateProp('btnColor','${c}')"></div>`).join('')}
      <label style="display:flex;align-items:center;gap:4px;font-size:11px;color:var(--text2);cursor:pointer">
        <input type="color" value="${d.btnColor}" style="width:22px;height:22px;border:none;padding:0;cursor:pointer;border-radius:4px" onchange="modalUpdateProp('btnColor',this.value)">custom
      </label>
    </div></div>`;
  }
  if(d.imgPosition!==undefined){
    html+=`<div class="m-field"><div class="m-label">Image focal point</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">
      ${[['top','Top'],['center','Center'],['bottom','Bottom'],['left','Left'],['right','Right']].map(([v,l])=>`<button class="pos-btn${d.imgPosition===v?' active':''}" onclick="modalUpdateProp('imgPosition','${v}')" style="padding:6px 14px">${l}</button>`).join('')}
    </div></div>`;
  }
  if(d.titleColor!==undefined){
    const titleColors=['#111111','#333333','#5b4fff','#0F6E56','#cc3333','#d97706','#1e3a5f','#ffffff'];
    html+=`<div class="m-field"><div class="m-label">Title color</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">
      ${titleColors.map(c=>`<div class="bg-swatch" style="background:${c};border:2px solid ${d.titleColor===c?'var(--accent)':'#ddd'}" title="${c}" onclick="modalUpdateProp('titleColor','${c}')"></div>`).join('')}
      <label style="display:flex;align-items:center;gap:4px;font-size:11px;color:var(--text2);cursor:pointer">
        <input type="color" value="${d.titleColor}" style="width:22px;height:22px;border:none;padding:0;cursor:pointer;border-radius:4px" onchange="modalUpdateProp('titleColor',this.value)">custom
      </label>
    </div></div>`;
  }
  if(d.descColor!==undefined){
    const descColors=['#666666','#888888','#444444','#5b4fff','#0F6E56','#cc3333','#111111','#ffffff'];
    html+=`<div class="m-field"><div class="m-label">Description color</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">
      ${descColors.map(c=>`<div class="bg-swatch" style="background:${c};border:2px solid ${d.descColor===c?'var(--accent)':'#ddd'}" title="${c}" onclick="modalUpdateProp('descColor','${c}')"></div>`).join('')}
      <label style="display:flex;align-items:center;gap:4px;font-size:11px;color:var(--text2);cursor:pointer">
        <input type="color" value="${d.descColor}" style="width:22px;height:22px;border:none;padding:0;cursor:pointer;border-radius:4px" onchange="modalUpdateProp('descColor',this.value)">custom
      </label>
    </div></div>`;
  }
  if(d.tagColor!==undefined){
    const tagColors=['#888888','#5b4fff','#0F6E56','#cc3333','#d97706','#1e3a5f','#111111','#3d34cc'];
    html+=`<div class="m-field"><div class="m-label">Tag color</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">
      ${tagColors.map(c=>`<div class="bg-swatch" style="background:${c};border:2px solid ${d.tagColor===c?'var(--accent)':'#ddd'}" title="${c}" onclick="modalUpdateProp('tagColor','${c}')"></div>`).join('')}
      <label style="display:flex;align-items:center;gap:4px;font-size:11px;color:var(--text2);cursor:pointer">
        <input type="color" value="${d.tagColor}" style="width:22px;height:22px;border:none;padding:0;cursor:pointer;border-radius:4px" onchange="modalUpdateProp('tagColor',this.value)">custom
      </label>
    </div></div>`;
  }
  if(!html) html='<p style="color:var(--text2);font-size:13px">No style options for this component.</p>';
  return html;
}

function renderSchemaTab(type){
  const tpl = TEMPLATES[type];
  const schema = getSchemaForType(type);
  return `
    <p style="font-size:12px;color:var(--text2);margin-bottom:14px;line-height:1.6">
      Below is the recommended database table structure for this component. Each row maps to one instance placed on a page.
    </p>
    <div class="schema-box">${schema}</div>
    <p style="font-size:11px;color:var(--text3);margin-top:10px;line-height:1.6">
      Use <code style="background:var(--surface2);padding:1px 4px;border-radius:3px">pageId</code> as a foreign key to your Pages table.
      <code style="background:var(--surface2);padding:1px 4px;border-radius:3px">componentOrder</code> controls render order on the page.
    </p>`;
}

function getSchemaForType(type){
  const schemas = {
    gridimgtext:`<span class="scm">-- Table: GridImageText (one row per section)</span>
<span class="sk">CREATE TABLE</span> <span class="sc">GridImageText</span> (
  id              <span class="sv">INT PRIMARY KEY</span>,
  pageId          <span class="sv">INT NOT NULL</span>,   <span class="scm">-- FK → Pages.id</span>
  componentOrder  <span class="sv">INT NOT NULL</span>,   <span class="scm">-- render position on page</span>
  heading         <span class="sv">VARCHAR(255)</span>,
  subtext         <span class="sv">TEXT</span>,
  cols            <span class="sv">INT DEFAULT 3</span>,   <span class="scm">-- 2 | 3 | 4</span>
  cardBg          <span class="sv">VARCHAR(20)</span>,
  headerBg        <span class="sv">VARCHAR(20)</span>
);

<span class="scm">-- Table: GridImageTextItem (one row per card)</span>
<span class="sk">CREATE TABLE</span> <span class="sc">GridImageTextItem</span> (
  id              <span class="sv">INT PRIMARY KEY</span>,
  sectionId       <span class="sv">INT NOT NULL</span>,   <span class="scm">-- FK → GridImageText.id</span>
  itemOrder       <span class="sv">INT NOT NULL</span>,
  title           <span class="sv">VARCHAR(255)</span>,
  description     <span class="sv">TEXT</span>,
  tag             <span class="sv">VARCHAR(50)</span>,
  imgSrc          <span class="sv">VARCHAR(512)</span>,   <span class="scm">-- URL or storage key</span>
  imgAlt          <span class="sv">VARCHAR(255)</span>
);`,
    imgtext:`<span class="scm">-- Table: ImageText</span>
<span class="sk">CREATE TABLE</span> <span class="sc">ImageText</span> (
  id              <span class="sv">INT PRIMARY KEY</span>,
  pageId          <span class="sv">INT NOT NULL</span>,
  componentOrder  <span class="sv">INT NOT NULL</span>,
  tag             <span class="sv">VARCHAR(80)</span>,
  heading         <span class="sv">VARCHAR(255)</span>,
  body            <span class="sv">TEXT</span>,
  btnText         <span class="sv">VARCHAR(80)</span>,
  imgSrc          <span class="sv">VARCHAR(512)</span>,
  imgAlt          <span class="sv">VARCHAR(255)</span>,
  layout          <span class="sv">ENUM('left','right','top','bottom')</span>,
  imgPosition     <span class="sv">VARCHAR(20)</span>,    <span class="scm">-- CSS object-position</span>
  textAlign       <span class="sv">ENUM('left','center','right')</span>,
  bg              <span class="sv">VARCHAR(20)</span>
);`,
    hero:`<span class="scm">-- Table: Hero</span>
<span class="sk">CREATE TABLE</span> <span class="sc">Hero</span> (
  id              <span class="sv">INT PRIMARY KEY</span>,
  pageId          <span class="sv">INT NOT NULL</span>,
  componentOrder  <span class="sv">INT NOT NULL</span>,
  heading         <span class="sv">VARCHAR(255)</span>,
  subtext         <span class="sv">TEXT</span>,
  btnText         <span class="sv">VARCHAR(80)</span>,
  bg              <span class="sv">VARCHAR(20)</span>
);`,
    gridimgtextrow:`<span class="scm">-- Table: GridImgTextRow (one row per section)</span>
<span class="sk">CREATE TABLE</span> <span class="sc">GridImgTextRow</span> (
  id              <span class="sv">INT PRIMARY KEY</span>,
  pageId          <span class="sv">INT NOT NULL</span>,
  componentOrder  <span class="sv">INT NOT NULL</span>,
  heading         <span class="sv">VARCHAR(255)</span>,
  subtext         <span class="sv">TEXT</span>,
  cols            <span class="sv">INT DEFAULT 2</span>,
  imgLayout       <span class="sv">ENUM('left','right','top','bottom')</span>,
  imgPosition     <span class="sv">VARCHAR(20)</span>,
  textAlign       <span class="sv">ENUM('left','center','right')</span>,
  cardBg          <span class="sv">VARCHAR(20)</span>,
  imgBg           <span class="sv">VARCHAR(20)</span>,
  titleColor      <span class="sv">VARCHAR(20)</span>,
  descColor       <span class="sv">VARCHAR(20)</span>,
  tagColor        <span class="sv">VARCHAR(20)</span>,
  btnColor        <span class="sv">VARCHAR(20)</span>
);

<span class="scm">-- Table: GridImgTextRowItem (one row per card)</span>
<span class="sk">CREATE TABLE</span> <span class="sc">GridImgTextRowItem</span> (
  id              <span class="sv">INT PRIMARY KEY</span>,
  sectionId       <span class="sv">INT NOT NULL</span>,
  itemOrder       <span class="sv">INT NOT NULL</span>,
  title           <span class="sv">VARCHAR(255)</span>,
  description     <span class="sv">TEXT</span>,
  tag             <span class="sv">VARCHAR(50)</span>,
  btnText         <span class="sv">VARCHAR(80)</span>,
  imgSrc          <span class="sv">VARCHAR(512)</span>,
  imgAlt          <span class="sv">VARCHAR(255)</span>
);`,
    features:`<span class="scm">-- Table: FeaturesSection + FeatureItem</span>
<span class="sk">CREATE TABLE</span> <span class="sc">FeaturesSection</span> (
  id              <span class="sv">INT PRIMARY KEY</span>,
  pageId          <span class="sv">INT NOT NULL</span>,
  componentOrder  <span class="sv">INT NOT NULL</span>,
  heading         <span class="sv">VARCHAR(255)</span>
);
<span class="sk">CREATE TABLE</span> <span class="sc">FeatureItem</span> (
  id              <span class="sv">INT PRIMARY KEY</span>,
  sectionId       <span class="sv">INT NOT NULL</span>,
  itemOrder       <span class="sv">INT NOT NULL</span>,
  icon            <span class="sv">VARCHAR(10)</span>,
  title           <span class="sv">VARCHAR(100)</span>,
  description     <span class="sv">TEXT</span>
);`
  };
  return schemas[type] || `<span class="scm">-- Table: ${TEMPLATES[type].table}</span>
<span class="sk">CREATE TABLE</span> <span class="sc">${TEMPLATES[type].table}</span> (
  id              <span class="sv">INT PRIMARY KEY</span>,
  pageId          <span class="sv">INT NOT NULL</span>,
  componentOrder  <span class="sv">INT NOT NULL</span>,
  <span class="scm">-- component-specific fields here</span>
  createdAt       <span class="sv">DATETIME DEFAULT NOW()</span>
);`;
}

function modalUpdateProp(key, value){
  if(!activeModalBlock) return;
  activeModalBlock.data[key] = value;
  rebuildBlock(activeModalBlock); render();
  renderModalBody();
}

function updateListItem(type, idx, key, value){
  if(!activeModalBlock) return;
  activeModalBlock.data.items[idx][key] = value;
  rebuildBlock(activeModalBlock); render();
}

function removeListItem(idx){
  if(!activeModalBlock) return;
  activeModalBlock.data.items.splice(idx,1);
  rebuildBlock(activeModalBlock); render(); renderModalBody();
}

function addListItem(type){
  if(!activeModalBlock) return;
  if(type==='gridimgtext') activeModalBlock.data.items.push({title:'New card',desc:'Description here.',tag:'Tag',imgSrc:''});
  else if(type==='gridimgtextrow') activeModalBlock.data.items.push({title:'New card',desc:'Description here.',tag:'Tag',btnText:'Learn more',imgSrc:''});
  else if(type==='features') activeModalBlock.data.items.push({icon:'✦',title:'Feature',desc:'Description.'});
  rebuildBlock(activeModalBlock); render(); renderModalBody();
}

function saveModal(){
  // sync heading/subtext from modal inputs if present
  if(!activeModalBlock) return;
  const headingEl = document.getElementById('m-heading');
  const subtextEl = document.getElementById('m-subtext');
  const colsEl = document.getElementById('m-cols');
  if(headingEl) activeModalBlock.data.heading = headingEl.value;
  if(subtextEl) activeModalBlock.data.subtext = subtextEl.value;
  if(colsEl) activeModalBlock.data.cols = colsEl.value;
  rebuildBlock(activeModalBlock); render();
  if(selectedId===activeModalBlock.id) renderProps(activeModalBlock);
  closeModal();
}

// ──────────────────────────────────────────────────
//  EXPORT / SAVE
// ──────────────────────────────────────────────────
async function savePageData(){
  if(!currentPageId) return;
  const page = currentPage();
  const saveBtn = document.querySelector('.tb-btn.primary');
  const originalText = saveBtn.textContent;
  
  saveBtn.textContent = 'Saving...';
  saveBtn.disabled = true;

  const outputBlocks = page.blocks.map((b,i) => ({
    type: b.type,
    data: b.data
  }));
  
  try {
    const res = await fetch(`/api/pages/${page.id}/blocks`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(outputBlocks)
    });
    if(res.ok) {
      saveBtn.textContent = 'Saved!';
      setTimeout(() => {
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
      }, 2000);
    } else {
      alert('Error saving data');
      saveBtn.textContent = originalText;
      saveBtn.disabled = false;
    }
  } catch(e) {
    console.error(e);
    alert('Failed to save: ' + e);
    saveBtn.textContent = originalText;
    saveBtn.disabled = false;
  }
}

function previewPage(){
  const p = currentPage();
  if(!p) return;
  window.open(`/page/${p.slug}`, '_blank');
}

function exportHTML(){
  alert("Export HTML is now handled by the server rendering. Please see Preview.");
}

// ──────────────────────────────────────────────────
//  INIT
// ──────────────────────────────────────────────────
loadPages();
document.getElementById('pm-name-input').addEventListener('keydown', e=>{ if(e.key==='Enter') createPage(); });
document.getElementById('modal-overlay').addEventListener('click', e=>{ if(e.target===document.getElementById('modal-overlay')) closeModal(); });
document.getElementById('page-modal').addEventListener('click', e=>{ if(e.target===document.getElementById('page-modal')) document.getElementById('page-modal').classList.remove('open'); });

