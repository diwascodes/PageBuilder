
// ──────────────────────────────────────────────────
//  STATE
// ──────────────────────────────────────────────────
let pages = [];
let currentPageId = null;

async function loadPages() {
  try {
    const res = await fetch('/api/pages');
    pages = await res.json();
    if (pages.length === 0) {
      const createRes = await fetch('/api/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Home' })
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
    renderNavMenuManager();
    render();
  } catch (e) { console.error('Failed to load pages', e); }
}
let selectedId = null;
let dragType = null;
let dragNav = null;
let dragBlockId = null;
let idCounter = 0;
let pageIdCounter = 1;
let activeModalBlock = null;
let activeModalTab = 'content';
let dropHintEl = null;

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
const BG_COLORS = ['#1a1a2e', '#5b4fff', '#0F6E56', '#cc3333', '#111', '#2d3a2e', '#4a3728', '#1e3a5f', '#3d1a6e', '#8b4513'];
const BG_LABELS = ['Dark Navy', 'Violet', 'Forest', 'Red', 'Charcoal', 'Dark Green', 'Brown', 'Navy', 'Purple', 'Brown'];

const TEMPLATES = {
  heroslider: {
    label: 'Hero Slider Pro', icon: '◈', table: 'HeroSlider',
    dataFields: ['items', 'paddingV', 'overlayColor', 'autoplay'],
    defaultData: {
      paddingV: 0,
      overlayColor: 'rgba(26, 43, 85, 0.7)',
      autoplay: true,
      items: [
        { tag: 'SDLC METHODOLOGIES', heading: 'Quality Processes for Full Software Life Cycle', bgImage: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1600&q=80' },
        { tag: 'OUR MISSION', heading: 'Innovative Software Solutions for Your Business', bgImage: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1600&q=80' }
      ]
    },
    render: (d, id) => {
      const items = d.items || [];
      if (items.length === 0) return `<div class="b-hero-slider empty-slider" style="background:#f1f5f9; padding:100px; text-align:center;">Add slides to see the Hero Slider</div>`;
      const slidesHtml = items.map((it, i) => `
        <div class="h-slide ${i === 0 ? 'active' : ''}" style="background-image:url(${it.bgImage || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1600&q=80'});">
          <div class="h-overlay" style="background:${d.overlayColor || 'rgba(26, 43, 85, 0.7)'}"></div>
          <div class="h-content">
            ${it.tag ? `<div class="h-tag">${it.tag}</div>` : ''}
            <div class="h-title-box">
              <h2>${it.heading || 'Your Main Heading Here'}</h2>
            </div>
          </div>
        </div>
      `).join('');
      return `
        <div class="b-hero-slider" id="slider-${id}" style="padding-top:${d.paddingV || 0}px; padding-bottom:${d.paddingV || 0}px; height:600px; position:relative; overflow:hidden;">
          <div class="h-track" style="height:100%; width:100%">${slidesHtml}</div>
          <button class="h-nav prev" onclick="moveSlider(${id},-1)">❮</button>
          <button class="h-nav next" onclick="moveSlider(${id},1)">❯</button>
          <div class="h-dots">${items.map((_, i) => `<div class="h-dot ${i === 0 ? 'active' : ''}" onclick="jumpSlider(${id},${i})"></div>`).join('')}</div>
        </div>
        <script>setTimeout(() => { if(typeof initSliders === 'function') initSliders(); }, 100);</script>
      `;
    }
  },
  heroslider: {
    label: 'Hero Pro Slider', icon: '◈', table: 'HeroProSlider',
    dataFields: ['items', 'paddingV', 'overlayColor', 'autoplay', 'textColor', 'textAlign', 'contentPos', 'headingSize'],
    defaultData: { paddingV: 0, overlayColor: 'rgba(0, 0, 0, 0.4)', autoplay: true, textColor: '#ffffff', textAlign: 'center', contentPos: 'center', headingSize: 64, items: [{ tagTop: 'SDLC METHODOLOGIES', tag: 'QUALITY FOCUSED', heading: 'Quality Processes for Full Software Life Cycle', subtext: 'Empowering businesses with cutting-edge software solutions.', bgImage: 'https://alkuwaiti.com/wp-content/uploads/2020/05/Hero-Banner-Placeholder-Dark-1024x480.png' }, { tagTop: 'INNOVATION', tag: 'FUTURE READY', heading: 'Innovative Software Solutions for Your Business', subtext: 'We transform complex problems into elegant digital experiences.', bgImage: 'https://alkuwaiti.com/wp-content/uploads/2020/05/Hero-Banner-Placeholder-Dark-1024x480.png' }] },
    render: (d, id) => {
      const items = d.items || [];
      const slidesHtml = items.map((it, i) => `
        <div class="hp-slide valign-${d.contentPos || 'center'} pos-${d.textAlign || 'center'}" 
             style="flex:0 0 100%; height:100%; background-image:url('${it.bgImage || ''}'); background-size:cover; background-position:center; position:relative; display:flex; padding:0 40px; box-sizing:border-box;">
          <div class="hp-overlay" style="position:absolute; top:0; left:0; width:100%; height:100%; z-index:1; background:${d.overlayColor || 'rgba(0,0,0,0.5)'}"></div>
          <div class="hp-content-wrap" style="position:relative; z-index:2; width:100%; max-width:800px; color:${d.textColor || '#fff'}">
            ${it.tagTop ? `<div class="hp-tag-top" style="font-size:14px; font-weight:700; letter-spacing:0.2em; text-transform:uppercase; margin-bottom:15px; opacity:0.9;">${it.tagTop}</div>` : ''}
            <div class="hp-title-box"><h2 style="font-size:${d.headingSize || 64}px; font-weight:800; line-height:1.1; margin-bottom:20px; letter-spacing:-0.02em; color:inherit;">${it.heading || ''}</h2></div>
            ${it.tag ? `<div class="hp-tag" style="display:inline-block; font-size:12px; font-weight:700; padding:6px 16px; background:rgba(255,255,255,0.15); border-radius:4px; margin-bottom:20px; text-transform:uppercase;">${it.tag}</div>` : ''}
            ${it.subtext ? `<div class="hp-subtext" style="font-size:20px; line-height:1.6; opacity:0.85; max-width:600px; margin:0 auto;">${it.subtext}</div>` : ''}
          </div>
        </div>`).join('');
      return `<div class="b-heropro" id="slider-${id}" style="width:100%; height:700px; position:relative; overflow:hidden; background:#111;" data-autoscroll="${d.autoplay}">
        <div class="hp-track" style="display:flex; height:100%; transition:transform 0.6s cubic-bezier(0.645, 0.045, 0.355, 1);">${slidesHtml}</div>
        <button class="hp-nav prev" style="position:absolute; top:50%; left:20px; transform:translateY(-50%); z-index:10; background:rgba(255,255,255,0.1); border:none; color:#fff; width:40px; height:40px; border-radius:50%; cursor:pointer;" onclick="moveSlider(${id},-1)">❮</button>
        <button class="hp-nav next" style="position:absolute; top:50%; right:20px; transform:translateY(-50%); z-index:10; background:rgba(255,255,255,0.1); border:none; color:#fff; width:40px; height:40px; border-radius:50%; cursor:pointer;" onclick="moveSlider(${id},1)">❯</button>
      </div><script>setTimeout(() => { if(typeof initSliders === 'function') initSliders(); }, 100);</script>`;
    }
  },
  topbar: {
    label: 'Top Bar', icon: '▔', table: 'TopBar',
    dataFields: ['tickerText', 'isScrolling', 'email', 'phone', 'bg', 'accentBg', 'textColor'],
    defaultData: {
      tickerText: 'Welcome to Invincible Software Solutions Integrated |',
      isScrolling: true,
      email: 'bdindgroup@issi-software.com',
      phone: '+91 40 2763 2269 / +91 9440501439',
      bg: '#a6111f',
      accentBg: '#800d18',
      textColor: '#ffffff'
    },
    render: d => {
      const scrollClass = d.isScrolling ? 'is-scrolling' : '';
      return `
        <div class="b-topbar" style="background:${d.bg}; color:${d.textColor}">
          <div class="topbar-left ${scrollClass}">
            <div class="topbar-ticker">${d.tickerText}</div>
          </div>
          <div class="topbar-right" style="background:${d.accentBg}">
            <div class="topbar-contact">
              <span>✉ ${d.email}</span>
              <span>📞 ${d.phone}</span>
            </div>
          </div>
        </div>`;
    }
  },
  navbar: {
    label: 'Navbar', icon: '☰', table: 'Navbar',
    dataFields: ['logo', 'logoImage', 'linksPos', 'bg', 'logoColor', 'linksColor', 'linksSize', 'linksBold', 'linksItalic', 'paddingV'],
    defaultData: { logo: 'Brand', logoImage: '', linksPos: 'right', bg: '#ffffff', logoColor: '#111111', linksColor: '#777777', linksSize: 14, linksBold: false, linksItalic: false, paddingV: 18 },
    render: d => {
      const linkStyle = `color:${d.linksColor || '#777777'}; font-size:${d.linksSize || 14}px; font-weight:${d.linksBold ? 'bold' : 'normal'}; font-style:${d.linksItalic ? 'italic' : 'normal'}; text-decoration:none;`;
      let linksHtml = `<span style="${linkStyle}">Home</span><span style="${linkStyle}">About</span><span style="${linkStyle}">Services</span>`;
      if (typeof pages !== 'undefined' && pages.length > 0) {
        linksHtml = pages.filter(p => p.showInMenu !== false).map(p => `<span style="${linkStyle}">${p.name}</span>`).join('');
      }
      const logoHtml = d.logoImage ? `<img src="${d.logoImage}" alt="${d.logo}" style="max-height:40px">` : `<span style="color:${d.logoColor || '#111111'}">${d.logo}</span>`;
      return `
        <div class="b-navbar pos-${d.linksPos || 'right'}" style="background:${d.bg || '#ffffff'}; padding-top:${d.paddingV}px; padding-bottom:${d.paddingV}px">
          <div class="nav-logo">${logoHtml}</div>
          <button class="nav-toggle" onclick="this.parentElement.querySelector('.nav-links').classList.toggle('active')">☰</button>
          <div class="nav-links">${linksHtml}</div>
        </div>`;
    }
  },
  hero: {
    label: 'Hero', icon: '★', table: 'Hero',
    dataFields: ['heading', 'subtext', 'btnText', 'btnLink', 'bg', 'paddingV', 'headerColor', 'btnColor', 'btnTextColor'],
    defaultData: { heading: 'Build something great', subtext: 'The fastest way to launch your next idea into the world.', btnText: 'Get started free', btnLink: '#', bg: '#1a1a2e', paddingV: 80, headerColor: '#ffffff', btnColor: '#5b4fff', btnTextColor: '#ffffff' },
    render: d => `<div class="b-hero" style="background:${d.bg}; padding-top:${d.paddingV}px; padding-bottom:${d.paddingV}px"><h1 style="color:${d.headerColor || '#ffffff'}">${d.heading}</h1><p>${d.subtext}</p><a href="${d.btnLink || '#'}" class="hero-btn-link" style="text-decoration:none"><button class="hero-btn" style="background:${d.btnColor || '#5b4fff'}; color:${d.btnTextColor || '#ffffff'}">${d.btnText}</button></a></div>`
  },
  herosplit: {
    label: 'Hero Split', icon: '◨', table: 'HeroSplit',
    dataFields: ['heading', 'subtext', 'btnText', 'btnLink', 'imgSrc', 'bg', 'paddingV', 'headerColor', 'btnColor', 'btnTextColor'],
    defaultData: {
      heading: 'Build something great',
      subtext: 'The fastest way to launch your next idea into the world.',
      btnText: 'Get started free',
      btnLink: '#',
      imgSrc: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1470',
      bg: '#0d252a',
      paddingV: 100,
      headerColor: '#ffffff',
      btnColor: '#ffffff',
      btnTextColor: '#0d252a'
    },
    render: d => {
      const bgStyle = d.imgSrc ? `background-image:linear-gradient(rgba(13,37,42,0.3), rgba(13,37,42,0.3)), url(${d.imgSrc}); background-size:cover; background-position:center` : `background:${d.bg}`;
      return `
        <div class="b-herosplit" style="background:${d.bg}">
            <div class="herosplit-visual" style="${bgStyle}"></div>
            <div class="herosplit-content" style="padding-top:${d.paddingV}px; padding-bottom:${d.paddingV}px">
                <h1 style="color:${d.headerColor || '#ffffff'}">${d.heading}</h1>
                <p>${d.subtext}</p>
                <a href="${d.btnLink || '#'}" style="text-decoration:none">
                    <button class="hero-btn" style="background:${d.btnColor || '#ffffff'}; color:${d.btnTextColor || '#0d252a'}">${d.btnText}</button>
                </a>
            </div>
        </div>`;
    }
  },
  textbanner: {
    label: 'Text Banner', icon: '◈', table: 'TextBanner',
    dataFields: ['heading', 'subtext', 'btnPrimary', 'btnLink', 'btnSecondary', 'bg', 'headerColor', 'btnColor'],
    defaultData: { heading: 'We build better products', subtext: 'Focused on quality, speed, and real impact for the teams that use us.', btnPrimary: 'Start free', btnLink: '#', btnSecondary: 'Learn more', bg: '#5b4fff', headerColor: '#ffffff', btnColor: '#ffffff' },
    render: d => `<div class="b-textbanner" style="background:${d.bg};color:${isLight(d.bg) ? '#111' : '#fff'}"><h2 style="color:${d.headerColor || (isLight(d.bg) ? '#111' : '#fff')}">${d.heading}</h2><p>${d.subtext}</p><div class="tb-actions"><a href="${d.btnLink || '#'}" style="text-decoration:none"><button class="btn-primary" style="background:${d.btnColor || '#fff'}; color:${d.bg}">${d.btnPrimary}</button></a><button class="btn-secondary" style="color:${isLight(d.bg) ? '#111' : '#fff'}">${d.btnSecondary}</button></div></div>`
  },
  text: {
    label: 'Text Block', icon: '¶', table: 'TextBlock',
    dataFields: ['heading', 'body', 'headerColor', 'textColor'],
    defaultData: { heading: 'About us', body: 'We are a team of passionate designers and engineers building tools that help teams ship faster without sacrificing quality or creativity.', headerColor: '#1a1a2e', textColor: '#444444' },
    render: d => `<div class="b-text"><h2 style="color:${d.headerColor || '#1a1a2e'}">${d.heading}</h2><p style="color:${d.textColor || '#444444'}">${d.body}</p></div>`
  },
  imgtext: {
    label: 'Image + Text', icon: '⬛', table: 'ImageText',
    dataFields: ['tag', 'heading', 'body', 'btnText', 'btnLink', 'imgSrc', 'imgAlt', 'layout', 'imgPosition', 'textAlign', 'bg', 'headerColor', 'btnColor', 'btnTextColor', 'textColor'],
    defaultData: { tag: 'Featured', heading: 'A picture is worth a thousand words', body: 'Pair rich visuals with compelling copy. Adjust image placement, text alignment, and colors to match your brand perfectly.', btnText: 'Learn more', btnLink: '#', imgSrc: '', imgAlt: 'Feature image', layout: 'left', imgPosition: 'center', textAlign: 'left', bg: '#ffffff', headerColor: '#1a1a2e', btnColor: '#111111', btnTextColor: '#ffffff', textColor: '#666666' },
    render: d => {
      const img = d.imgSrc
        ? `<img src="${d.imgSrc}" alt="${d.imgAlt}" style="width:100%;height:100%;object-fit:cover;object-position:${d.imgPosition}">`
        : `<div class="imgtext-img placeholder"><div class="ph-icon">🖼</div><div>600 × 400</div></div>`;
      const imgWrap = d.imgSrc ? `<div class="imgtext-img" style="overflow:hidden">${img}</div>` : img;
      return `<div class="b-imgtext img-${d.layout}" style="background:${d.bg}"><div class="imgtext-img" style="flex:0 0 45%;background:#f0ede8;min-height:180px;overflow:hidden">${d.imgSrc ? `<img src="${d.imgSrc}" alt="${d.imgAlt}" style="width:100%;height:100%;object-fit:cover;object-position:${d.imgPosition}">` : `<div class="imgtext-img placeholder" style="height:100%;min-height:180px"><div class="ph-icon">🖼</div><div style="font-size:11px">Click to set image</div></div>`}</div><div class="imgtext-body" style="text-align:${d.textAlign}"><div class="it-tag">${d.tag}</div><h2 style="color:${d.headerColor || '#1a1a2e'}">${d.heading}</h2><p style="color:${d.textColor || '#666666'}">${d.body}</p><a href="${d.btnLink || '#'}" style="text-decoration:none"><button class="it-btn" style="background:${d.btnColor || '#111111'}; color:${d.btnTextColor || '#ffffff'}">${d.btnText}</button></a></div></div>`;
    }
  },
  gridimgtext: {
    label: 'Grid Cards', icon: '⊞', table: 'GridImageText',
    dataFields: ['heading', 'subtext', 'cols', 'items', 'cardBg', 'headerBg', 'titleColor', 'descColor', 'tagColor', 'textAlign', 'imgPosition', 'headerColor'],
    defaultData: {
      heading: 'Our work', subtext: 'A selection of recent projects and case studies.', cols: '3', cardBg: '#ffffff', headerBg: '#f0ede8',
      titleColor: '#111111', descColor: '#666666', tagColor: '#888888', textAlign: 'left', imgPosition: 'center', headerColor: '#111111',
      items: [
        { title: 'Project Alpha', desc: 'A modern SaaS product for enterprise teams.', tag: 'Product', imgSrc: '' },
        { title: 'Brand Identity', desc: 'Full visual identity system for a fintech startup.', tag: 'Design', imgSrc: '' },
        { title: 'Mobile App', desc: 'Cross-platform mobile experience, zero to launch.', tag: 'Mobile', imgSrc: '' },
      ]
    },
    render: d => {
      const imgPos = d.imgPosition || 'center';
      const textAlign = d.textAlign || 'left';
      const titleColor = d.titleColor || '#111111';
      const descColor = d.descColor || '#666666';
      const tagColor = d.tagColor || '#888888';
      const cards = (d.items || []).map(it => {
        const imgHtml = it.imgSrc ? `<img src="${it.imgSrc}" alt="${it.title || ''}" style="width:100%;height:100%;object-fit:cover;object-position:${imgPos}">` : `<span style="font-size:24px;color:#bbb">🖼</span>`;
        return `<div class="git-card" style="background:${d.cardBg}"><div class="git-card-img" style="background:${d.headerBg}">${imgHtml}</div><div class="git-card-body" style="text-align:${textAlign}"><span class="git-tag" style="color:${tagColor};background:${tagColor}18">${it.tag || ''}</span><h3 style="color:${titleColor}">${it.title}</h3><p style="color:${descColor}">${it.desc}</p></div></div>`;
      }).join('');
      return `<div class="b-gridimgtext"><div class="git-header"><h2 style="color:${d.headerColor || '#111'}">${d.heading}</h2><p>${d.subtext}</p></div><div class="git-grid cols-${d.cols}">${cards}</div></div>`;
    }
  },
  gridimgtextrow: {
    label: 'Grid Image+Text', icon: '▤', table: 'GridImgTextRow',
    dataFields: ['heading', 'subtext', 'cols', 'items', 'cardBg', 'imgBg', 'titleColor', 'descColor', 'tagColor', 'btnColor', 'textAlign', 'imgPosition', 'imgLayout', 'headerColor'],
    defaultData: {
      heading: 'What we offer', subtext: 'Each card pairs a visual with focused copy.', cols: '2',
      cardBg: '#ffffff', imgBg: '#f0ede8',
      titleColor: '#111111', descColor: '#666666', tagColor: '#5b4fff', btnColor: '#111111', headerColor: '#111111',
      textAlign: 'left', imgPosition: 'center', imgLayout: 'left',
      items: [
        { title: 'Design Systems', desc: 'Scalable, consistent UI components built for your brand.', tag: 'Design', btnText: 'Learn more', btnLink: '#', imgSrc: '' },
        { title: 'Development', desc: 'Clean, maintainable code that ships fast and scales well.', tag: 'Engineering', btnText: 'Learn more', btnLink: '#', imgSrc: '' },
        { title: 'Strategy', desc: 'Product thinking grounded in real user needs and data.', tag: 'Strategy', btnText: 'Learn more', btnLink: '#', imgSrc: '' },
        { title: 'Growth', desc: 'Marketing and analytics frameworks that drive measurable results.', tag: 'Growth', btnText: 'Learn more', btnLink: '#', imgSrc: '' },
      ]
    },
    render: d => {
      const imgPos = d.imgPosition || 'center';
      const imgLayout = d.imgLayout || 'left';
      const textAlign = d.textAlign || 'left';
      const titleColor = d.titleColor || '#111111';
      const descColor = d.descColor || '#666666';
      const tagColor = d.tagColor || '#5b4fff';
      const btnColor = d.btnColor || '#111111';
      const cards = (d.items || []).map(it => {
        const imgHtml = it.imgSrc
          ? `<img src="${it.imgSrc}" alt="${it.title || ''}" style="width:100%;height:100%;object-fit:cover;object-position:${imgPos}">`
          : `<span style="font-size:22px;color:#bbb">&#128444;</span>`;
        return `<div class="gitrow-card img-${imgLayout}" style="background:${d.cardBg}"><div class="gitrow-card-img" style="background:${d.imgBg}">${imgHtml}</div><div class="gitrow-card-body" style="text-align:${textAlign}"><span class="gr-tag" style="color:${tagColor};background:${tagColor}18">${it.tag || ''}</span><h3 style="color:${titleColor}">${it.title || ''}</h3><p style="color:${descColor}">${it.desc || ''}</p><a href="${it.btnLink || '#'}" style="text-decoration:none"><button class="gr-btn" style="background:${btnColor}">${it.btnText || 'Learn more'}</button></a></div></div>`;
      }).join('');
      return `<div class="b-gridimgtextrow"><div class="gitrow-header"><h2 style="color:${d.headerColor || '#111'}">${d.heading}</h2><p>${d.subtext}</p></div><div class="gitrow-grid cols-${d.cols}">${cards}</div></div>`;
    }
  },
  features: {
    label: 'Features', icon: '⊡', table: 'Features',
    dataFields: ['heading', 'items', 'headerColor'],
    defaultData: { heading: 'Why choose us', items: [{ icon: '⚡', title: 'Fast', desc: 'Blazing fast performance.' }, { icon: '🔒', title: 'Secure', desc: 'Enterprise-grade security.' }, { icon: '🎨', title: 'Beautiful', desc: 'Pixel-perfect designs.' }], headerColor: '#1a1a2e' },
    render: d => {
      const cards = (d.items || []).map(it => `<div class="feat-card"><div class="feat-icon">${it.icon}</div><h3>${it.title}</h3><p>${it.desc}</p></div>`).join('');
      return `<div class="b-features"><h2 style="color:${d.headerColor || '#1a1a2e'}">${d.heading}</h2><div class="feat-grid">${cards}</div></div>`;
    }
  },
  cta: {
    label: 'CTA Banner', icon: '▶', table: 'CTABanner',
    dataFields: ['heading', 'subtext', 'btnText', 'btnLink', 'bg', 'headerColor', 'btnColor', 'btnTextColor', 'textColor'],
    defaultData: { heading: 'Ready to get started?', subtext: 'Join thousands of teams already using our platform.', btnText: 'Start for free', btnLink: '#', bg: '#5b4fff', headerColor: '#ffffff', btnColor: '#ffffff', btnTextColor: '#5b4fff', textColor: '#ffffff' },
    render: d => `<div class="b-cta" style="background:${d.bg}"><h2 style="color:${d.headerColor || '#ffffff'}">${d.heading}</h2><p style="color:${d.textColor || '#ffffff'}">${d.subtext}</p><a href="${d.btnLink || '#'}" style="text-decoration:none"><button style="background:${d.btnColor || '#ffffff'}; color:${d.btnTextColor || d.bg}">${d.btnText}</button></a></div>`
  },
  testimonial: {
    label: 'Testimonial Slider', icon: '❝', table: 'Testimonial',
    dataFields: ['heading', 'items', 'paddingV', 'bg', 'navType', 'showRole', 'italicQuote', 'headerColor', 'textColor'],
    defaultData: {
      heading: 'Testimonials',
      headerColor: '#1a1a2e',
      textColor: '#666666',
      paddingV: 80,
      bg: '#f0f7ff',
      navType: 'both',
      showRole: true,
      italicQuote: true,
      items: [
        { author: 'Agisol', role: 'Director', quote: 'The staffing resource provided by R&B has done and continues to do a great job on the Drug Safety program for the FDA. She has transitioned from Drug Safety Dashboards to Appian Workflow implementation with ease and she is the GO-TO developer on the...', rating: 5, imgSrc: '' },
        { author: 'Qlaire Systems Inc.', role: 'CEO', quote: 'R&B Services Inc., are one of our most valuable and excellent strategic partners. We appreciate your services and exceed our expectations every time! This is a great company and we highly recommend them.', rating: 5, imgSrc: '' }
      ]
    },
    render: (d, id) => {
      const itemsHtml = (d.items || []).map(it => {
        const initials = it.author ? it.author.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '??';
        const starsHtml = '★'.repeat(it.rating || 5) + '☆'.repeat(5 - (it.rating || 5));
        return `
          <div class="ts-item">
            <div class="ts-card">
              <div class="ts-author-row">
                <div class="ts-avatar">${it.imgSrc ? `<img src="${it.imgSrc}">` : '👤'}</div>
                <div class="ts-meta">
                  <div class="ts-name">${it.author}</div>
                  ${d.showRole ? `<div class="ts-role">${it.role || ''}</div>` : ''}
                  <div class="ts-stars">${starsHtml}</div>
                </div>
              </div>
              <div class="ts-quote-box">
                <span class="ts-quote-icon">“</span>
                <p class="ts-quote-text" style="${d.italicQuote ? 'font-style:italic' : ''}">${it.quote}</p>
                <span class="ts-quote-icon ts-quote-end">”</span>
              </div>
            </div>
          </div>`;
      }).join('');

      const dotsHtml = (d.items || []).map((_, i) => `<div class="ts-dot${i === 0 ? ' active' : ''}" data-index="${i}" onclick="jumpSlider(${id}, ${i})"></div>`).join('');

      const showArrows = d.navType !== 'dots';
      const showDots = d.navType !== 'arrows';

      return `
        <div class="b-testimonial-slider" id="slider-${id}" style="background:${d.bg || '#f0f7ff'}; padding-top:${d.paddingV || 80}px; padding-bottom:${d.paddingV || 80}px">
          <div class="ts-header">
            <div class="ts-line" style="background:${d.headerColor || '#a6111f'}"></div>
            <h2 style="color:${d.headerColor || '#1a1a2e'}">${d.heading}</h2>
            <div class="ts-line" style="background:${d.headerColor || '#a6111f'}"></div>
          </div>
          <div class="ts-viewport">
            <div class="ts-track">${itemsHtml}</div>
          </div>
          ${showArrows ? `
          <div class="ts-nav">
            <button class="ts-nav-btn ts-prev" onclick="moveSlider(${id}, -1)">←</button>
            <button class="ts-nav-btn ts-next" onclick="moveSlider(${id}, 1)">→</button>
          </div>` : ''}
          ${showDots ? `<div class="ts-dots">${dotsHtml}</div>` : ''}
        </div>`;
    }
  },
  form: {
    label: 'Contact Form', icon: '⬜', table: 'ContactForm',
    dataFields: ['heading', 'btnText', 'headerColor', 'btnColor', 'btnTextColor'],
    defaultData: { heading: 'Get in touch', btnText: 'Send message', headerColor: '#1a1a2e', btnColor: '#a6111f', btnTextColor: '#ffffff' },
    render: d => `<div class="b-form">
      <h2 style="color:${d.headerColor || '#1a1a2e'}">${d.heading}</h2>
      <div class="form-row">
        <div class="form-field"><label>First name</label><input type="text" class="cf-fname" placeholder="Jane"></div>
        <div class="form-field"><label>Last name</label><input type="text" class="cf-lname" placeholder="Smith"></div>
      </div>
      <div class="form-field" style="margin-bottom:10px">
        <label>Email</label><input type="email" class="cf-email" placeholder="jane@company.com">
      </div>
      <div class="form-field" style="margin-bottom:10px">
        <label>Message</label><textarea class="cf-message" rows="3" placeholder="How can we help?" style="resize:none;font-family:var(--sans)"></textarea>
      </div>
      <button class="submit-btn" style="width:200px; background:${d.btnColor || '#a6111f'}; color:${d.btnTextColor || '#ffffff'}" onclick="submitContactForm(this)">${d.btnText}</button>
      <div class="cf-status" style="display:none"></div>
    </div>`
  },
  footer: {
    label: 'Footer', icon: '▬', table: 'Footer',
    dataFields: ['brand', 'logoImage', 'copy', 'items', 'paddingV', 'bg', 'textColor', 'showBrand', 'showLogo', 'showItems', 'linkPosition', 'headerColor'],
    defaultData: {
      brand: 'Brand Name',
      logoImage: '',
      copy: '© 2026 Brand Inc. All rights reserved.',
      paddingV: 40,
      bg: '#ffffff',
      textColor: '#666666',
      showBrand: true,
      showLogo: true,
      showItems: true,
      linkPosition: 'center',
      items: [
        { label: 'Privacy', slug: 'privacy' },
        { label: 'Terms', slug: 'terms' },
        { label: 'Contact', slug: 'contact' }
      ]
    },
    render: d => {
      const itemsHtml = (d.items || []).map(it => `<span class="footer-link-item">${it.label}</span>`).join('');
      const logoHtml = (d.showLogo && d.logoImage) ? `<img src="${d.logoImage}" alt="Logo" style="max-height:30px; object-fit:contain;">` : '';
      const brandHtml = d.showBrand ? `<div class="footer-brand" style="margin-bottom:0; font-size:18px; color:${d.headerColor || d.textColor || '#666666'}">${d.brand}</div>` : '';
      const linksHtml = d.showItems ? `<div class="footer-links" style="margin-bottom:0; gap:25px; display:flex;">${itemsHtml}</div>` : '';

      const linkPos = d.linkPosition || 'center';
      // Logic: Links Center -> Copy Right; Links Left -> Copy Center
      const copyPos = linkPos === 'center' ? 'right' : 'center';

      return `
        <div class="b-footer" style="background:${d.bg || '#ffffff'}; color:${d.textColor || '#666666'}; padding-top:${d.paddingV}px; padding-bottom:${d.paddingV}px; width:100%; box-sizing:border-box;">
          <div class="footer-inner" style="max-width:1200px; margin:0 auto; padding:0 40px; display:flex; align-items:center; justify-content:space-between; position:relative;">
            
            <div class="f-left-group" style="display:flex; align-items:center; gap:20px; flex:1;">
               ${logoHtml}
               ${brandHtml}
               ${linkPos === 'left' ? linksHtml : ''}
            </div>

            ${linkPos === 'center' ? `<div class="f-center-group" style="position:absolute; left:50%; transform:translateX(-50%); display:flex; align-items:center; justify-content:center;">${linksHtml}</div>` : ''}
            ${copyPos === 'center' && linkPos === 'left' ? `<div class="f-center-group" style="position:absolute; left:50%; transform:translateX(-50%); display:flex; align-items:center; justify-content:center; font-size:12px; opacity:0.7;">${d.copy}</div>` : ''}

            <div class="f-right-group" style="display:flex; align-items:center; justify-content:flex-end; flex:1; font-size:12px; opacity:0.7;">
               ${copyPos === 'right' ? d.copy : ''}
            </div>

          </div>
        </div>`;
    },
  },
  footer2: {
    label: 'Footer Pro', icon: '▬', table: 'Footer2',
    dataFields: ['brand', 'tagline', 'logoImage', 'copy', 'bg', 'textColor', 'accentColor', 'showNewsletter', 'newsletterPlaceholder', 'newsletterBtnText', 'address1', 'address2', 'email', 'phone', 'colLayout', 'quickLinks', 'contactLinks', 'headerColor', 'btnColor', 'btnTextColor'],
    defaultData: {
      brand: 'YourBrand',
      tagline: 'Building great digital experiences since 2020.',
      logoImage: '',
      copy: '© 2026 YourBrand Inc. All rights reserved.',
      bg: '#12121e',
      textColor: '#ffffff',
      accentColor: '#a6111f',
      showNewsletter: true,
      newsletterPlaceholder: 'Email Address',
      newsletterBtnText: 'Join',
      address1: '3-5-663/202, L.K.R. Arcade, Street #9',
      address2: 'Hyderabad – 500 029',
      email: 'hello@yourbrand.com',
      phone: '+1 (800) 000-0000',
      colLayout: '4',
      quickLinks: [
        { label: 'About Us', slug: 'about', colName: 'QUICK LINKS', colOrder: 1 },
        { label: 'Services', slug: 'services', colName: 'QUICK LINKS', colOrder: 1 },
        { label: 'Contact', slug: 'contact', colName: 'QUICK LINKS', colOrder: 1 },
        { label: 'Privacy Policy', slug: 'privacy', colName: 'QUICK LINKS', colOrder: 1 },
      ],
      contactLinks: [
        { label: 'REGISTERED OFFICE', address: '3-6-663/203, L.K.R. Arcade, Street #9, Hyderabad-500 029', email: 'office@essi-software.com', phone: '+91 40 2763 2269' },
        { label: 'ADMIN OFFICE', address: '5-175/1A, SriRama Nilayam, Visakhapatnam-530 045', email: 'admin@essi-software.com', phone: '+91 9704304540' }
      ]
    },
    render: d => {
      const bg = d.bg || '#12121e';
      const textColor = d.textColor || '#ffffff';
      const accent = d.accentColor || '#a6111f';
      const colLayout = d.colLayout || '4';
      const is3Col = colLayout === '3';

      const logoHtml = d.logoImage
        ? `<img src="${d.logoImage}" alt="${d.brand}" style="max-height:48px;width:auto;object-fit:contain;margin-bottom:14px;display:block">`
        : `<div class="f2-brand" style="color:${d.headerColor || textColor}">${d.brand}</div>`;

      // Group link columns dynamically
      const groupedQuickLinks = {};
      (d.quickLinks || []).forEach(l => {
        const col = l.colName || 'QUICK LINKS';
        if (!groupedQuickLinks[col]) {
          groupedQuickLinks[col] = { title: col, order: l.colOrder || 1, links: [] };
        }
        groupedQuickLinks[col].links.push(l);
      });
      const sortedQuickLinkGroups = Object.values(groupedQuickLinks).sort((a, b) => a.order - b.order);

      const quickLinksHtml = sortedQuickLinkGroups.map(g => `
        <div class="f2-col">
          <div class="f2-col-title" style="color:${d.headerColor || textColor};border-color:${accent}">${g.title}</div>
          <ul class="f2-links-list">
            ${g.links.map(l => `<li><a href="/page/${l.slug}" style="color:${textColor}80;text-decoration:none" class="f2-link">${l.label}</a></li>`).join('')}
          </ul>
        </div>
      `).join('');

      const contactColsHtml = (d.contactLinks || []).map(c => `
        <div class="f2-contact-col">
          <div class="f2-col-title" style="color:${d.headerColor || textColor};border-color:${accent}">${c.label || 'CONTACT US'}</div>
          ${c.address ? `<div class="f2-contact-row"><span class="f2-contact-icon" style="color:${accent}">📍</span><span style="color:${textColor}80">${c.address}</span></div>` : ''}
          ${c.email ? `<div class="f2-contact-row"><span class="f2-contact-icon" style="color:${accent}">✉</span><a href="mailto:${c.email}" style="color:${accent};text-decoration:none">${c.email}</a></div>` : ''}
          ${c.phone ? `<div class="f2-contact-row"><span class="f2-contact-icon" style="color:${accent}">📞</span><span style="color:${textColor}80">${c.phone}</span></div>` : ''}
        </div>`
      ).join('');

      const newsletterHtml = d.showNewsletter ? `
        <div class="f2-col">
          <div class="f2-col-title" style="color:${d.headerColor || textColor};border-color:${accent}">NEWSLETTER</div>
          <p style="color:${textColor}80;font-size:13px;line-height:1.6;margin-bottom:16px">Stay updated with our latest news and insights.</p>
          <div class="f2-newsletter-row">
            <input type="email" placeholder="${d.newsletterPlaceholder || 'Email Address'}" class="f2-newsletter-input" style="background:${bg === '#ffffff' ? '#f4f4f2' : 'rgba(255,255,255,0.07)'};color:${textColor};border-color:rgba(255,255,255,0.12)">
            <button class="f2-newsletter-btn" style="background:${d.btnColor || accent}; color:${d.btnTextColor || '#ffffff'}">${d.newsletterBtnText || 'Join'}</button>
          </div>
        </div>` : '';

      return `
        <div class="b-footer2" style="background:${bg}">
          <div class="f2-inner">
            <div class="f2-grid-${colLayout}">
              <div class="f2-col">
                ${logoHtml}
                <p style="color:${textColor}80;font-size:13px;line-height:1.7;max-width:240px">${d.tagline}</p>
              </div>
              ${quickLinksHtml}
              <div class="f2-col">${contactColsHtml}</div>
              ${newsletterHtml}
            </div>
          </div>
          <div class="f2-bottom" style="border-color:rgba(255,255,255,0.08)">
            <span style="color:${textColor}50;font-size:12px">${d.copy}</span>
          </div>
        </div>`;
    }
  },
  abouthighlights: {
    label: 'Info + Highlights', icon: 'ℹ', table: 'AboutHighlights',
    dataFields: ['heading', 'subheading', 'body', 'btnText', 'btnLink', 'leftBg', 'rightBg', 'textColorLeft', 'textColorRight', 'btnBg', 'btnTextColor', 'iconColor', 'colWidth', 'alignItems', 'paddingV'],
    defaultData: {
      heading: 'Welcome To ISSI.',
      subheading: 'Invincible Software solutions Integrated (ISSI), is an award-winning software development and IT support services company.',
      body: 'Welcome To ISSI. ISSI is CMMI Level 3 appraised, ISO 9001:2015, and ISO 27001:2013 certified company. harnessing a suite of Software Development Life Cycle (SDLC) capabilities to accomplish client needs.',
      btnText: 'Know More',
      btnLink: '#',
      leftBg: '#ffffff',
      rightBg: '#a6111f',
      textColorLeft: '#a6111f',
      textColorRight: '#ffffff',
      btnBg: '#a6111f',
      btnTextColor: '#ffffff',
      iconColor: '#a6111f',
      colWidth: '50-50',
      alignItems: 'center',
      paddingV: 0,
      items: [
        { icon: '⚙', title: 'Our Purpose', desc: 'To make a qualitative difference in the lives of millions of people and organizations.' },
        { icon: '👁', title: 'Our Vision', desc: 'To be a dominant and profitable India-centric software company.' },
        { icon: '🎯', title: 'Our Mission', desc: 'To provide high-quality IT solutions and to help fill the niche requirements.' }
      ]
    },
    render: d => {
      const [leftW, rightW] = (d.colWidth || '50-50').split('-').map(v => v + '%');
      const itemsHtml = (d.items || []).map(it => `
          <div class="ah-item">
            <div class="ah-icon" style="background:${d.textColorRight}; color:${d.iconColor}">${it.icon}</div>
            <div class="ah-item-text">
              <h4 style="color:${d.textColorRight}">${it.title}</h4>
              <p style="color:${d.textColorRight}; opacity:0.9">${it.desc}</p>
            </div>
          </div>
        `).join('');

      return `
          <div class="b-abouthighlights" style="display:flex; flex-wrap:wrap; min-height:300px; padding-top:${d.paddingV}px; padding-bottom:${d.paddingV}px; align-items:${d.alignItems === 'center' ? 'center' : 'flex-start'}">
            <div class="ah-left" style="flex: 0 0 ${leftW}; background:${d.leftBg}; color:${d.textColorLeft}; padding:60px 40px">
              <h1 style="color:${d.headerColor || d.textColorLeft}; margin-bottom:15px; font-size:32px">${d.heading}</h1>
              <h3 style="color:${d.textColorLeft}; margin-bottom:20px; font-size:18px">${d.subheading}</h3>
              <p style="margin-bottom:30px; line-height:1.6; font-size:14px; color:#444">${d.body}</p>
              <a href="${d.btnLink || '#'}" style="text-decoration:none">
                <button class="ah-btn" style="background:${d.btnColor || d.btnBg}; color:${d.btnTextColor}; border:none; padding:12px 30px; border-radius:30px; cursor:pointer; font-weight:500">${d.btnText}</button>
              </a>
            </div>
            <div class="ah-right" style="flex: 0 0 ${rightW}; background:${d.rightBg}; color:${d.textColorRight}; padding:60px 40px">
              <div class="ah-items-list">${itemsHtml}</div>
            </div>
          </div>`;
    }
  },
  servicegrid: {
    label: 'Service Grid', icon: '▦', table: 'ServiceGrid',
    dataFields: ['heading', 'btnText', 'btnLink', 'items', 'paddingV', 'bg', 'accentColor', 'titleColor', 'headerColor'],
    defaultData: {
      heading: 'What We Offer',
      btnText: 'Know More',
      btnLink: '#',
      paddingV: 80,
      bg: '#ffffff',
      accentColor: '#a6111f',
      titleColor: '#1a1a2e',
      headerColor: '#a6111f',
      items: [
        { icon: '📋', title: 'Program & Project Management' },
        { icon: '💻', title: 'Software Development' },
        { icon: '🤝', title: 'Professional Services' },
        { icon: '🛠️', title: 'Managed IT Services' },
        { icon: '🏢', title: 'Enterprise Products' },
        { icon: '🛡️', title: 'Cyber Security/IT Infrastructure' },
        { icon: '🎧', title: 'Call Center/Help Desk Support' },
        { icon: '☁️', title: 'Cloud Computing' }
      ]
    },
    render: d => {
      const cards = (d.items || []).map(it => `
        <div class="wwo-card" style="border-color:${d.accentColor}22">
          <div class="wwo-icon-wrap" style="background:${d.accentColor}">${it.icon}</div>
          <h3 style="color:${d.titleColor || '#1a1a2e'}">${it.title}</h3>
        </div>
      `).join('');
      return `
        <div class="b-servicegrid" style="background:${d.bg || '#ffffff'}; padding-top:${d.paddingV || 80}px; padding-bottom:${d.paddingV || 80}px">
          <div class="wwo-header"><h2 style="color:${d.headerColor || d.titleColor || '#1a1a2e'}">${d.heading}<span style="background:${d.headerColor || '#a6111f'}; display:block; width:60px; height:3px; margin:10px auto 0"></span></h2></div>
          <div class="wwo-grid">${cards}</div>
          <button class="wwo-btn" style="background:${d.btnColor || d.accentColor || '#a6111f'}; color:${d.btnTextColor || '#ffffff'}">${d.btnText}</button>
        </div>`;
    }
  },
  logoslider: {
    label: 'Logo Slider', icon: '▤', table: 'LogoSlider',
    dataFields: ['heading', 'btnText', 'btnLink', 'items', 'paddingV', 'bg', 'headerColor', 'btnColor', 'btnTextColor'],
    defaultData: {
      heading: 'Our Trusted Partners',
      btnText: 'View All Partners',
      btnLink: '#',
      paddingV: 80,
      bg: '#ffffff',
      headerColor: '#1a1a2e',
      btnColor: '#a6111f',
      btnTextColor: '#ffffff',
      items: [
        { name: 'Google', imgSrc: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg', link: '#' },
        { name: 'Microsoft', imgSrc: 'https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg', link: '#' },
        { name: 'Apple', imgSrc: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg', link: '#' },
        { name: 'Amazon', imgSrc: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg', link: '#' },
        { name: 'Netflix', imgSrc: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg', link: '#' },
        { name: 'Meta', imgSrc: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg', link: '#' }
      ]
    },
    render: (d, id) => {
      const itemsHtml = (d.items || []).map(it => `
        <div class="ls-item">
          <img src="${it.imgSrc}" alt="${it.name}">
          <span>${it.name}</span>
        </div>
      `).join('');
      const dotsHtml = (d.items || []).map((_, i) => `<div class="ls-dot${i === 0 ? ' active' : ''}" data-index="${i}"></div>`).join('');

      return `
        <div class="b-logoslider" id="slider-${id}" style="background:${d.bg || '#ffffff'}; padding-top:${d.paddingV || 80}px; padding-bottom:${d.paddingV || 80}px">
          <div class="ls-header"><h2>${d.heading}</h2></div>
          <div class="ls-viewport">
            <button class="ls-ctrl ls-prev" onclick="moveSlider(${id}, -1)">‹</button>
            <div class="ls-track">${itemsHtml}</div>
            <button class="ls-ctrl ls-next" onclick="moveSlider(${id}, 1)">›</button>
          </div>
          <div class="ls-dots">${dotsHtml}</div>
          <a href="${d.btnLink || '#'}" style="text-decoration:none">
            <button class="ls-more-btn" style="background:${d.btnColor || '#a6111f'}; color:${d.btnTextColor || '#ffffff'}">${d.btnText}</button>
          </a>
        </div>`;
    }
  },
  clientslider: {
    label: 'Our Clients', icon: '🏢', table: 'ClientSlider',
    dataFields: ['heading', 'cols', 'items', 'paddingV', 'bg', 'textColor'],
    defaultData: {
      heading: 'Our Clients',
      paddingV: 100,
      bg: '#f8f9fa',
      textColor: '#1a1a2e',
      cols: '4',
      items: [
        { imgSrc: '' }, { imgSrc: '' }, { imgSrc: '' }, { imgSrc: '' },
        { imgSrc: '' }, { imgSrc: '' }, { imgSrc: '' }, { imgSrc: '' }
      ]
    },
    render: (d, id) => {
      const items = d.items || [];
      const cols = parseInt(d.cols) || 4;
      const isSlider = items.length > cols;

      const itemsHtml = items.map(it => `
        <div class="cs-item" style="min-width:0; flex: 0 0 ${isSlider ? `calc((100% - (${cols} - 1) * 30px) / ${cols})` : 'auto'};">
          <div class="cs-logo-card" style="background:#fff; height:140px; display:flex; align-items:center; justify-content:center; padding:20px; box-sizing:border-box; border-radius:16px; border:1px solid #f1f5f9; overflow:hidden;">
            ${it.imgSrc
          ? `<img src="${it.imgSrc}" alt="Client" style="max-width:100%; max-height:100%; object-fit:contain;">`
          : `<div class="cs-logo-placeholder" style="background:#f8fafc;width:100%;height:100%;border-radius:12px;display:flex;align-items:center;justify-content:center;"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="color:#cbd5e0"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg></div>`
        }
          </div>
        </div>
      `).join('');

      if (!isSlider) {
        return `
          <div class="b-client-grid" id="clients-${id}" style="background:${d.bg || '#f8f9fa'}; padding-top:${d.paddingV || 100}px; padding-bottom:${d.paddingV || 100}px">
            <div class="cg-inner">
              <div class="cg-header" style="text-align:center; width:100%; margin-bottom:60px;"><h2>${d.heading}</h2><div class="cg-divider" style="display:flex; align-items:center; justify-content:center; gap:15px;"><span class="cg-line" style="width:60px; height:1px; background:#e2e8f0;"></span><div class="cg-diamond" style="width:10px; height:10px; background:#a6111f; transform:rotate(45deg);"></div><span class="cg-line" style="width:60px; height:1px; background:#e2e8f0;"></span></div></div>
              <div class="cs-grid" style="display:grid; grid-template-columns:repeat(${cols}, 1fr); gap:30px; width:100%; box-sizing:border-box;">${itemsHtml}</div>
            </div>
          </div>
        `;
      }

      const dotsHtml = items.map((_, i) => `<div class="cs-dot${i === 0 ? ' active' : ''}" onclick="jumpSlider(${id}, ${i})"></div>`).join('');

      return `
        <div class="b-client-grid b-client-slider" id="slider-${id}" data-cols="${cols}" style="background:${d.bg || '#f8f9fa'}; padding-top:${d.paddingV || 100}px; padding-bottom:${d.paddingV || 100}px">
          <div class="cg-inner">
            <div class="cg-header" style="text-align:center; width:100%; margin-bottom:60px;"><h2 style="color:${d.textColor || '#1a1a2e'}">${d.heading}</h2><div class="cg-divider" style="display:flex; align-items:center; justify-content:center; gap:15px;"><span class="cg-line" style="width:60px; height:1px; background:#e2e8f0;"></span><div class="cg-diamond" style="width:10px; height:10px; background:#a6111f; transform:rotate(45deg);"></div><span class="cg-line" style="width:60px; height:1px; background:#e2e8f0;"></span></div></div>
            <div class="cs-viewport" style="overflow:hidden; position:relative;">
              <div class="cs-track" style="display:flex; gap:30px; transition:transform 0.5s ease;">${itemsHtml}</div>
            </div>
            <div class="cs-dots" style="display:flex; justify-content:center; gap:10px; margin-top:40px;">${dotsHtml}</div>
          </div>
        </div>
        <script>setTimeout(() => { if(typeof initSliders === 'function') initSliders(); }, 100);</script>
      `;
    }
  },
  locations: {
    label: 'Locations', icon: '📍', table: 'Locations',
    dataFields: ['heading', 'items', 'paddingV', 'bg', 'accentColor'],
    defaultData: {
      heading: 'Our Locations',
      paddingV: 80,
      bg: '#ffffff',
      accentColor: '#a6111f',
      items: [
        {
          title: 'Maryland Headquarters',
          address: '7337 Hanover Pkwy, Suite# A, Greenbelt, MD 20770',
          mapEmbed: 'https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=7337+Hanover+Pkwy+STE+A+Greenbelt+MD+20770',
          phone: '301-982-9700',
          fax: '301-982-0500',
          tollFree: '1-888-810-3661',
          email: 'info@issi-software.com'
        }
      ]
    },
    render: (d, id) => {
      const itemsHtml = (d.items || []).map((it, i) => `
        <div class="loc-item ${i === 0 ? 'active' : ''}" id="loc-${id}-${i}">
          <div class="loc-header" onclick="this.parentElement.classList.toggle('active')">
            <h3>${it.title}</h3>
            <div class="loc-toggle-icon">▼</div>
          </div>
          <div class="loc-content">
            <div class="loc-flex">
              <div class="loc-map">
                ${it.mapEmbed ? `<iframe src="${it.mapEmbed}" width="100%" height="350" style="border:0;" allowfullscreen="" loading="lazy"></iframe>` : `<div class="loc-map-placeholder">Map URL needed</div>`}
              </div>
              <div class="loc-details">
                <h3>${it.title}</h3>
                <div class="loc-detail-row">
                  <span class="loc-icon" style="color:${d.accentColor}">📍</span>
                  <span>${it.address}</span>
                </div>
                ${it.phone ? `<div class="loc-detail-group"><div class="loc-detail-label">Phone Number</div><div class="loc-detail-row"><span class="loc-icon" style="color:${d.accentColor}">📞</span><span>: ${it.phone}</span></div></div>` : ''}
                ${it.fax ? `<div class="loc-detail-group"><div class="loc-detail-label">Fax</div><div class="loc-detail-row"><span class="loc-icon" style="color:${d.accentColor}">📠</span><span>: ${it.fax}</span></div></div>` : ''}
                ${it.tollFree ? `<div class="loc-detail-group"><div class="loc-detail-label">Toll Free</div><div class="loc-detail-row"><span class="loc-icon" style="color:${d.accentColor}">📞</span><span>: ${it.tollFree}</span></div></div>` : ''}
                ${it.email ? `<div class="loc-detail-group"><div class="loc-detail-label">Email</div><div class="loc-detail-row"><span class="loc-icon" style="color:${d.accentColor}">✉</span><a href="mailto:${it.email}" style="color:inherit;text-decoration:none">: ${it.email}</a></div></div>` : ''}
              </div>
            </div>
          </div>
        </div>
      `).join('');

      return `
        <div class="b-locations" style="background:${d.bg || '#ffffff'}; padding-top:${d.paddingV || 80}px; padding-bottom:${d.paddingV || 80}px">
          <div class="loc-inner">
            <h1 class="loc-main-heading" style="color:${d.accentColor}">${d.heading}</h1>
            <div class="loc-list">${itemsHtml}</div>
          </div>
        </div>`;
    }
  }
};

function isLight(hex) {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}

// ──────────────────────────────────────────────────
//  IMAGE UPLOAD HELPERS
// ──────────────────────────────────────────────────
let _uploadCounter = 0;

async function handleImageUpload(inputEl, callback) {
  const file = inputEl.files[0];
  if (!file) return;
  const wrapper = inputEl.closest('.img-upload-wrap');
  const statusEl = wrapper ? wrapper.querySelector('.upload-status') : null;
  if (statusEl) { statusEl.textContent = 'Uploading…'; statusEl.className = 'upload-status uploading'; }

  const form = new FormData();
  form.append('file', file);
  try {
    const res = await fetch('/api/upload', { method: 'POST', body: form });
    if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Upload failed'); }
    const { url } = await res.json();
    if (statusEl) { statusEl.textContent = 'Uploaded ✓'; statusEl.className = 'upload-status success'; }
    // Update preview thumbnail
    const thumb = wrapper ? wrapper.querySelector('.upload-thumb') : null;
    if (thumb) thumb.innerHTML = `<img src="${url}" alt="preview">`;
    callback(url);
  } catch (e) {
    console.error(e);
    if (statusEl) { statusEl.textContent = e.message; statusEl.className = 'upload-status error'; }
  }
}

function renderUploadBtn(currentValue, onUploadFn, label) {
  const uid = 'upload-' + (++_uploadCounter);
  const thumbHtml = currentValue
    ? `<img src="${currentValue}" alt="preview">`
    : `<span class="upload-placeholder">📷</span>`;
  return `<div class="img-upload-wrap">
    <div class="upload-row">
      <div class="upload-thumb" id="thumb-${uid}">${thumbHtml}</div>
      <div class="upload-actions">
        <label class="upload-btn" for="${uid}">↑ Upload ${label || 'Image'}</label>
        <input type="file" id="${uid}" accept="image/*" style="display:none" onchange="${onUploadFn}">
        <span class="upload-status">${currentValue ? 'Uploaded ✓' : ''}</span>
      </div>
    </div>
    ${currentValue ? `<button class="upload-remove-btn" onclick="${onUploadFn.replace(/handleImageUpload\(this.*$/, '').replace('this.files[0]', '')}" style="display:none">✕ Remove</button>` : ''}
  </div>`;
}

// Helper for properties panel image upload
function propImageUpload(blockId, key, inputEl) {
  handleImageUpload(inputEl, (url) => {
    updateProp(blockId, key, url, false);
  });
}

// Helper for modal list item image upload
function modalListImageUpload(type, idx, key, inputEl) {
  handleImageUpload(inputEl, (url) => {
    updateListItem(type, idx, key, url);
    renderModalBody();
  });
}

// Helper for modal-level prop image upload  
function modalPropImageUpload(key, inputEl) {
  handleImageUpload(inputEl, (url) => {
    modalUpdateProp(key, url, false);
  });
}

// Remove image helper for props panel
function propImageRemove(blockId, key) {
  updateProp(blockId, key, '', false);
}

// Remove image helper for modal list items
function modalListImageRemove(type, idx, key) {
  updateListItem(type, idx, key, '');
  renderModalBody();
}

// Remove image helper for modal-level props
function modalPropImageRemove(key) {
  modalUpdateProp(key, '', false);
}

// Generates the upload UI HTML for property panel fields
function propUploadField(blockId, key, currentValue, label) {
  const uid = 'prop-upload-' + (++_uploadCounter);
  const thumbHtml = currentValue
    ? `<img src="${currentValue}" alt="preview">`
    : `<span class="upload-placeholder">📷</span>`;
  return `<div class="prop-group">
    <span class="prop-label">${label}</span>
    <div class="img-upload-wrap">
      <div class="upload-row">
        <div class="upload-thumb">${thumbHtml}</div>
        <div class="upload-actions">
          <label class="upload-btn" for="${uid}">↑ Upload</label>
          <input type="file" id="${uid}" accept="image/*" style="display:none" onchange="propImageUpload(${blockId},'${key}',this)">
          <span class="upload-status">${currentValue ? 'Uploaded ✓' : ''}</span>
        </div>
      </div>
      ${currentValue ? `<button class="upload-remove-btn" onclick="propImageRemove(${blockId},'${key}')">✕ Remove</button>` : ''}
    </div>
  </div>`;
}

// Generates the upload UI HTML for modal fields
function modalUploadField(key, currentValue, label) {
  const uid = 'modal-upload-' + (++_uploadCounter);
  const thumbHtml = currentValue
    ? `<img src="${currentValue}" alt="preview">`
    : `<span class="upload-placeholder">📷</span>`;
  return `<div class="m-field">
    <div class="m-label">${label}</div>
    <div class="img-upload-wrap">
      <div class="upload-row">
        <div class="upload-thumb">${thumbHtml}</div>
        <div class="upload-actions">
          <label class="upload-btn" for="${uid}">↑ Upload</label>
          <input type="file" id="${uid}" accept="image/*" style="display:none" onchange="modalPropImageUpload('${key}',this)">
          <span class="upload-status">${currentValue ? 'Uploaded ✓' : ''}</span>
        </div>
      </div>
      ${currentValue ? `<button class="upload-remove-btn" onclick="modalPropImageRemove('${key}')">✕ Remove</button>` : ''}
    </div>
  </div>`;
}

// Generates the inline upload UI for list item image fields in modals
function listItemUploadField(type, idx, key, currentValue, label) {
  const uid = 'li-upload-' + (++_uploadCounter);
  const thumbHtml = currentValue
    ? `<img src="${currentValue}" alt="preview">`
    : `<span class="upload-placeholder">📷</span>`;
  return `<div class="list-img-upload" style="grid-column:span 2">
    <div class="img-upload-wrap compact">
      <div class="upload-row">
        <div class="upload-thumb small">${thumbHtml}</div>
        <div class="upload-actions">
          <label class="upload-btn small" for="${uid}">↑ ${label || 'Upload Image'}</label>
          <input type="file" id="${uid}" accept="image/*" style="display:none" onchange="modalListImageUpload('${type}',${idx},'${key}',this)">
          <span class="upload-status">${currentValue ? '✓' : ''}</span>
        </div>
      </div>
      ${currentValue ? `<button class="upload-remove-btn small" onclick="modalListImageRemove('${type}',${idx},'${key}')">✕</button>` : ''}
    </div>
  </div>`;
}

// ──────────────────────────────────────────────────
//  PAGES
// ──────────────────────────────────────────────────
function renderPageTabs() {
  const cont = document.getElementById('page-tabs');
  cont.innerHTML = pages.map(p =>
    `<div class="page-tab${p.id === currentPageId ? ' active' : ''}" onclick="switchPage(${p.id})">${p.name}</div>`
  ).join('');
}
function switchPage(id) {
  selectedId = null;
  currentPageId = id;
  renderPageTabs();
  renderNavMenuManager();
  render();
  document.getElementById('props-body').innerHTML = '<p class="empty">Select a block to edit its properties.</p>';
}
function openPageModal() { document.getElementById('pm-name-input').value = ''; document.getElementById('page-modal').classList.add('open'); document.getElementById('pm-name-input').focus(); }
async function createPage() {
  const name = document.getElementById('pm-name-input').value.trim() || 'Page ' + (pages.length + 1);
  try {
    const res = await fetch('/api/pages', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    const newPage = await res.json();
    newPage.blocks = []; // Ensure initialized
    pages.push(newPage);
    document.getElementById('page-modal').classList.remove('open');
    switchPage(newPage.id);
  } catch (e) { console.error(e); }
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
  } catch (e) { console.error(e); }
}

// ──────────────────────────────────────────────────
//  DRAG & DROP
// ──────────────────────────────────────────────────
document.querySelectorAll('.comp-item').forEach(el => {
  el.addEventListener('dragstart', e => { e.stopPropagation(); dragType = el.dataset.type; dragNav = el.dataset.nav || null; dragBlockId = null; e.dataTransfer.effectAllowed = 'copy'; });
  el.addEventListener('dragend', () => { dragType = null; dragNav = null; });
});
const canvas = document.getElementById('canvas');
canvas.addEventListener('dragover', e => { e.preventDefault(); canvas.classList.add('drag-over'); });
canvas.addEventListener('dragleave', e => { if (!canvas.contains(e.relatedTarget)) canvas.classList.remove('drag-over'); });
canvas.addEventListener('drop', e => { e.preventDefault(); canvas.classList.remove('drag-over'); if (dragType) addBlock(dragType, null, dragNav); dragType = null; dragNav = null; dragBlockId = null; });

// Prevent multiple simultaneous drags
document.addEventListener('dragstart', e => {
  // Only one drag source can be active at a time; state is already set by the specific handlers
  // This guard ensures no ghost state if drag is cancelled mid-flight
}, true);

// ──────────────────────────────────────────────────
//  BLOCKS
// ──────────────────────────────────────────────────
function addBlock(type, afterId = null, navType = null) {
  const page = currentPage();
  if (!page) { alert("Please select or create a page first."); return; }
  const tpl = TEMPLATES[type]; if (!tpl) return;
  const id = ++idCounter;
  const data = JSON.parse(JSON.stringify(tpl.defaultData));
  if (navType) data.navType = navType;
  const block = { id, type, label: tpl.label, data, pageId: currentPageId, componentOrder: get_blocks().length + 1 };
  block.html = tpl.render(data);
  if (afterId !== null) { const idx = get_blocks().findIndex(b => b.id === afterId); get_blocks().splice(idx + 1, 0, block); }
  else get_blocks().push(block);
  render(); selectBlock(id);
}

function render() {
  const blocks = get_blocks();
  const inner = document.getElementById('canvas-inner');
  if (!dropHintEl) dropHintEl = document.getElementById('drop-hint');
  const countBtn = document.getElementById('block-count-btn');
  if (blocks.length === 0) { 
    inner.innerHTML = ''; 
    if (dropHintEl) inner.appendChild(dropHintEl); 
    countBtn.textContent = '0 blocks'; 
    return; 
  }
  if (dropHintEl) dropHintEl.remove(); 
  inner.innerHTML = '';
  blocks.forEach(block => {
    const tpl = TEMPLATES[block.type];
    if (block.type === 'navbar' && tpl) block.html = tpl.render(block.data);
    const wrap = document.createElement('div');
    wrap.className = 'canvas-block' + (selectedId === block.id ? ' selected' : '');
    wrap.dataset.id = block.id;
    wrap.innerHTML = block.html;

    const ctrl = document.createElement('div');
    ctrl.className = 'block-controls';
    const hasListData = ['gridimgtext', 'gridimgtextrow', 'features'].includes(block.type);
    const hasModal = hasListData || ['abouthighlights', 'footer2'].includes(block.type);
    ctrl.innerHTML = `
      <button class="blk-ctrl" title="Move up" onclick="moveBlock(${block.id},-1)">↑</button>
      <button class="blk-ctrl" title="Move down" onclick="moveBlock(${block.id},1)">↓</button>
      <button class="blk-ctrl" title="Duplicate" onclick="duplicateBlock(${block.id})">⧉</button>
      ${hasModal ? `<button class="blk-ctrl data-btn" title="Edit data" onclick="openModal(${block.id})">⊞ data</button>` : ''}
      <button class="blk-ctrl del" title="Delete" onclick="deleteBlock(${block.id})">✕</button>`;
    wrap.appendChild(ctrl);

    wrap.addEventListener('click', e => { e.stopPropagation(); selectBlock(block.id); });
    wrap.setAttribute('draggable', true);
    wrap.addEventListener('dragstart', e => { dragBlockId = block.id; dragType = null; e.dataTransfer.effectAllowed = 'move'; e.stopPropagation(); wrap.classList.add('dragging'); });
    wrap.addEventListener('dragend', () => { wrap.classList.remove('dragging'); dragBlockId = null; dragType = null; document.querySelectorAll('.drag-over-block').forEach(el => el.classList.remove('drag-over-block')); });
    wrap.addEventListener('dragover', e => { e.preventDefault(); e.stopPropagation(); if (dragBlockId && dragBlockId !== block.id) { document.querySelectorAll('.drag-over-block').forEach(el => el.classList.remove('drag-over-block')); wrap.classList.add('drag-over-block'); } });
    wrap.addEventListener('drop', e => { e.stopPropagation(); e.preventDefault(); canvas.classList.remove('drag-over'); if (dragBlockId && dragBlockId !== block.id) { reorderBlock(dragBlockId, block.id); } else if (dragType) { addBlock(dragType, block.id); } dragBlockId = null; dragType = null; wrap.classList.remove('drag-over-block'); });
    inner.appendChild(wrap);
  });
  countBtn.textContent = blocks.length + ' block' + (blocks.length !== 1 ? 's' : '');
  setTimeout(initSliders, 100);
}

function selectBlock(id) {
  selectedId = id; render();
  const block = get_blocks().find(b => b.id === id); if (!block) return;
  renderProps(block);
}
canvas.addEventListener('click', () => { selectedId = null; render(); document.getElementById('props-body').innerHTML = '<p class="empty">Select a block to edit its properties.</p>'; });

function rebuildBlock(block) {
  const tpl = TEMPLATES[block.type]; if (!tpl) return;
  block.html = tpl.render(block.data);
}

function deleteBlock(id) { const blocks = get_blocks(); const idx = blocks.findIndex(b => b.id === id); blocks.splice(idx, 1); if (selectedId === id) { selectedId = null; document.getElementById('props-body').innerHTML = '<p class="empty">Select a block.</p>'; } render(); }
function moveBlock(id, dir) { const blocks = get_blocks(); const idx = blocks.findIndex(b => b.id === id); const ni = idx + dir; if (ni < 0 || ni >= blocks.length) return;[blocks[idx], blocks[ni]] = [blocks[ni], blocks[idx]]; render(); }
function duplicateBlock(id) { const blocks = get_blocks(); const block = blocks.find(b => b.id === id); if (!block) return; const nb = { ...block, id: ++idCounter, data: JSON.parse(JSON.stringify(block.data)) }; nb.html = TEMPLATES[nb.type].render(nb.data); blocks.splice(blocks.indexOf(block) + 1, 0, nb); render(); selectBlock(nb.id); }
function reorderBlock(fromId, toId) { const blocks = get_blocks(); const fi = blocks.findIndex(b => b.id === fromId); const ti = blocks.findIndex(b => b.id === toId); const [r] = blocks.splice(fi, 1); blocks.splice(ti, 0, r); render(); }
function clearCanvas() { if (!get_blocks().length) return; currentPage().blocks = []; selectedId = null; document.getElementById('props-body').innerHTML = '<p class="empty">Select a block.</p>'; render(); }

// ──────────────────────────────────────────────────
//  PROPS PANEL
// ──────────────────────────────────────────────────
function renderProps(block) {
  const tpl = TEMPLATES[block.type]; if (!tpl) return;
  const d = block.data;
  const pb = document.getElementById('props-body');
  let html = `<div style="font-size:12px;font-weight:500;color:var(--text);margin-bottom:12px;display:flex;align-items:center;gap:6px"><span style="width:20px;height:20px;background:var(--accent-light);border-radius:5px;display:inline-flex;align-items:center;justify-content:center;font-size:11px;color:var(--accent-text)">${tpl.icon}</span>${block.label}</div>`;

  // Field label mapping
  const FIELD_LABELS = {
    heading: 'Heading', subtext: 'Subtext', body: 'Body', btnText: 'Button label',
    btnPrimary: 'Primary btn', btnSecondary: 'Secondary btn', logo: 'Logo text',
    btnLink: 'Button URL (Slug or link)',
    logoImage: 'Logo image URL', brand: 'Brand name', copy: 'Copyright text',
    quote: 'Quote text', author: 'Author name', role: 'Author role',
    tag: 'Section tag', imgSrc: 'Image URL', imgAlt: 'Image alt text',
    paddingV: 'Vertical Size'
  };

  // Image field keys that should render as upload buttons
  const IMAGE_FIELDS = ['logoImage', 'imgSrc'];

  // Loop through dataFields defined in the template
  (tpl.dataFields || []).forEach(k => {
    // Skip fields that have custom complex UI below
    if (['bg', 'layout', 'textAlign', 'cols', 'logoColor', 'linksPos', 'linksColor', 'linksSize', 'linksBold', 'linksItalic', 'items', 'cardBg', 'headerBg', 'titleColor', 'descColor', 'tagColor', 'btnColor', 'headerColor', 'textColor', 'btnTextColor', 'imgPosition', 'imgLayout', 'imgBg', 'paddingV', 'leftBg', 'rightBg', 'textColorLeft', 'textColorRight', 'btnBg', 'btnTextColor', 'iconColor', 'colWidth', 'alignItems', 'navType', 'showRole', 'italicQuote', 'showNewsletter', 'contentPos', 'autoplay'].includes(k)) return;

    const label = FIELD_LABELS[k] || (k.charAt(0).toUpperCase() + k.slice(1));
    const value = d[k] !== undefined ? String(d[k]).replace(/"/g, '&quot;') : '';

    // Render image fields as upload buttons instead of text inputs
    if (IMAGE_FIELDS.includes(k)) {
      html += propUploadField(block.id, k, d[k] || '', label);
      return;
    }

    html += `<div class="prop-group">
      <span class="prop-label">${label}</span>
      <input class="prop-input" value="${value}" oninput="updateProp(${block.id},'${k}',this.value,true)">
    </div>`;
  });

  // Vertical Resizing (Slider)
  if (d.paddingV !== undefined) {
    html += `<div class="prop-group">
      <span class="prop-label">Vertical Size</span>
      <div style="display:flex;align-items:center;gap:10px">
        <input type="range" min="0" max="250" value="${d.paddingV}" style="flex:1" oninput="this.nextElementSibling.innerText=this.value+'px'; updateProp(${block.id},'paddingV',parseInt(this.value),true)">
        <span style="font-size:11px;color:var(--text3);min-width:35px">${d.paddingV}px</span>
      </div>
    </div>`;
  }

  // Specific layout/style controls (if they exist in data)
  if (d.layout !== undefined) {
    html += `<div class="prop-group"><span class="prop-label">Layout</span><div class="pos-grid">
      ${['left', 'right', 'top', 'bottom'].map(v => `<button class="pos-btn${d.layout === v ? ' active' : ''}" onclick="updateProp(${block.id},'layout','${v}')">${v.charAt(0).toUpperCase() + v.slice(1)}</button>`).join('')}
    </div></div>`;
  }
  if (d.textAlign !== undefined) {
    html += `<div class="prop-group"><span class="prop-label">Text align</span><div class="pos-grid">
      ${['left', 'center', 'right'].map(v => `<button class="pos-btn${d.textAlign === v ? ' active' : ''}" onclick="updateProp(${block.id},'textAlign','${v}')">${v.charAt(0).toUpperCase() + v.slice(1)}</button>`).join('')}
    </div></div>`;
  }
  if (d.contentPos !== undefined) {
    html += `<div class="prop-group"><span class="prop-label">Vertical align</span><div class="pos-grid">
      ${['top', 'center', 'bottom'].map(v => `<button class="pos-btn${d.contentPos === v ? ' active' : ''}" onclick="updateProp(${block.id},'contentPos','${v}')">${v.charAt(0).toUpperCase() + v.slice(1)}</button>`).join('')}
    </div></div>`;
  }
  if (d.cols !== undefined) {
    html += `<div class="prop-group"><span class="prop-label">Grid columns</span><div class="pos-grid">
      ${['2', '3', '4'].map(v => `<button class="pos-btn${d.cols === v ? ' active' : ''}" onclick="updateProp(${block.id},'cols','${v}')">${v} cols</button>`).join('')}
    </div></div>`;
  }
  if (d.autoplay !== undefined) {
    html += `<div class="prop-group">
      <span class="prop-label">Autoplay</span>
      <select class="prop-input" onchange="updateProp(${block.id},'autoplay', this.value === 'true')">
        <option value="true" ${d.autoplay !== false ? 'selected' : ''}>Yes (Enabled)</option>
        <option value="false" ${d.autoplay === false ? 'selected' : ''}>No (Disabled)</option>
      </select>
    </div>`;
  }

  if (block.type === 'topbar') {
    html += `<div class="prop-section">Topbar Content</div>`;
    html += `<div class="prop-group"><span class="prop-label">Ticker Text</span>
      <textarea class="prop-input" style="height:60px" oninput="updateProp(${block.id},'tickerText',this.value)">${d.tickerText}</textarea>
    </div>`;
    html += `<div class="prop-group">
      <label style="display:flex;align-items:center;gap:8px;font-size:12px;cursor:pointer">
        <input type="checkbox" ${d.isScrolling ? 'checked' : ''} onchange="updateProp(${block.id},'isScrolling',this.checked)"> Enable Scrolling (Marquee)
      </label>
    </div>`;
    html += `<div class="prop-group"><span class="prop-label">Email</span>
      <input class="prop-input" value="${d.email}" oninput="updateProp(${block.id},'email',this.value)">
    </div>`;
    html += `<div class="prop-group"><span class="prop-label">Phone</span>
      <input class="prop-input" value="${d.phone}" oninput="updateProp(${block.id},'phone',this.value)">
    </div>`;

    html += `<div class="prop-section">Topbar Style</div>`;
    html += `<div class="prop-group"><span class="prop-label">Background</span>
      <input type="color" value="${d.bg}" style="width:100%;height:30px;border:1px solid #ddd;padding:2px;cursor:pointer;border-radius:4px" onchange="updateProp(${block.id},'bg',this.value)">
    </div>`;
    html += `<div class="prop-group"><span class="prop-label">Accent Background (Right Side)</span>
      <input type="color" value="${d.accentBg}" style="width:100%;height:30px;border:1px solid #ddd;padding:2px;cursor:pointer;border-radius:4px" onchange="updateProp(${block.id},'accentBg',this.value)">
    </div>`;
    html += `<div class="prop-group"><span class="prop-label">Text Color</span>
      <input type="color" value="${d.textColor}" style="width:100%;height:30px;border:1px solid #ddd;padding:2px;cursor:pointer;border-radius:4px" onchange="updateProp(${block.id},'textColor',this.value)">
    </div>`;
  }

  // Branding & Logo Style (Complex Navbar logic)
  if (block.type === 'navbar') {
    html += `<div class="prop-section">Links & Style</div>`;
    html += `<div class="prop-group"><span class="prop-label">Links position</span><div class="pos-grid">
      ${['left', 'center', 'right'].map(v => `<button class="pos-btn${d.linksPos === v ? ' active' : ''}" onclick="updateProp(${block.id},'linksPos','${v}')">${v.charAt(0).toUpperCase() + v.slice(1)}</button>`).join('')}
    </div></div>`;

    const logoColors = ['#111111', '#333333', '#5b4fff', '#0F6E56', '#cc3333', '#d97706', '#1e3a5f', '#ffffff'];
    html += `<div class="prop-group"><span class="prop-label">Logo color</span><div class="bg-grid">
      ${logoColors.map(c => `<div class="bg-swatch${d.logoColor === c ? ' active' : ''}" style="background:${c}; border-color:${d.logoColor === c ? 'var(--accent)' : '#ddd'}" title="${c}" onclick="updateProp(${block.id},'logoColor','${c}')"></div>`).join('')}
      <input type="color" value="${d.logoColor}" style="width:22px;height:22px;border:none;padding:0;cursor:pointer;border-radius:4px" onchange="updateProp(${block.id},'logoColor',this.value)">
    </div></div>`;

    html += `<div style="display:grid; grid-template-columns:1fr 1fr; gap:12px">
      <div class="prop-group"><span class="prop-label">Link size (px)</span><input type="number" class="m-input" value="${d.linksSize}" oninput="updateProp(${block.id},'linksSize',parseInt(this.value),true)"></div>
      <div class="prop-group"><span class="prop-label">Format</span><div style="display:flex;gap:8px;margin-top:6px">
        <label style="display:flex;align-items:center;gap:4px;font-size:11px;cursor:pointer"><input type="checkbox" ${d.linksBold ? 'checked' : ''} onchange="updateProp(${block.id},'linksBold',this.checked)"> B</label>
        <label style="display:flex;align-items:center;gap:4px;font-size:11px;cursor:pointer"><input type="checkbox" ${d.linksItalic ? 'checked' : ''} onchange="updateProp(${block.id},'linksItalic',this.checked)"> I</label>
      </div></div>
    </div>`;
  }

  if (block.type === 'servicegrid') {
    html += `<div class="prop-section">Style & Colors</div>`;
    html += `<div class="prop-group"><span class="prop-label">Accent Color (Icons/Btn)</span>
      <input type="color" value="${d.accentColor}" style="width:100%;height:30px;border:1px solid #ddd;padding:2px;cursor:pointer;border-radius:4px" onchange="updateProp(${block.id},'accentColor',this.value)">
    </div>`;
    html += `<div class="prop-group"><span class="prop-label">Title/Text Color</span>
      <input type="color" value="${d.titleColor}" style="width:100%;height:30px;border:1px solid #ddd;padding:2px;cursor:pointer;border-radius:4px" onchange="updateProp(${block.id},'titleColor',this.value)">
    </div>`;
    html += `<div class="prop-group"><span class="prop-label">Underline Color</span>
      <input type="color" value="${d.headerColor}" style="width:100%;height:30px;border:1px solid #ddd;padding:2px;cursor:pointer;border-radius:4px" onchange="updateProp(${block.id},'headerColor',this.value)">
    </div>`;
  }

  if (block.type === 'abouthighlights') {
    html += `<div class="prop-section">Left Panel Design</div>`;
    html += `<div style="display:grid; grid-template-columns:1fr 1fr; gap:10px">
      <div class="prop-group"><span class="prop-label">BG Color</span><input type="color" value="${d.leftBg}" style="width:100%;height:30px;border:1px solid #ddd;padding:2px;cursor:pointer;border-radius:4px" onchange="updateProp(${block.id},'leftBg',this.value)"></div>
      <div class="prop-group"><span class="prop-label">Text Color</span><input type="color" value="${d.textColorLeft}" style="width:100%;height:30px;border:1px solid #ddd;padding:2px;cursor:pointer;border-radius:4px" onchange="updateProp(${block.id},'textColorLeft',this.value)"></div>
    </div>`;

    html += `<div class="prop-section">Right Panel Design</div>`;
    html += `<div style="display:grid; grid-template-columns:1fr 1fr; gap:10px">
      <div class="prop-group"><span class="prop-label">BG Color</span><input type="color" value="${d.rightBg}" style="width:100%;height:30px;border:1px solid #ddd;padding:2px;cursor:pointer;border-radius:4px" onchange="updateProp(${block.id},'rightBg',this.value)"></div>
      <div class="prop-group"><span class="prop-label">Text Color</span><input type="color" value="${d.textColorRight}" style="width:100%;height:30px;border:1px solid #ddd;padding:2px;cursor:pointer;border-radius:4px" onchange="updateProp(${block.id},'textColorRight',this.value)"></div>
    </div>`;

    html += `<div class="prop-group"><span class="prop-label">Icon/Highlight Color</span>
      <input type="color" value="${d.iconColor}" style="width:100%;height:30px;border:1px solid #ddd;padding:2px;cursor:pointer;border-radius:4px" onchange="updateProp(${block.id},'iconColor',this.value)">
    </div>`;

    html += `<div class="prop-section">Button Design</div>`;
    html += `<div style="display:grid; grid-template-columns:1fr 1fr; gap:10px">
      <div class="prop-group"><span class="prop-label">BG Color</span><input type="color" value="${d.btnBg}" style="width:100%;height:30px;border:1px solid #ddd;padding:2px;cursor:pointer;border-radius:4px" onchange="updateProp(${block.id},'btnBg',this.value)"></div>
      <div class="prop-group"><span class="prop-label">Text Color</span><input type="color" value="${d.btnTextColor}" style="width:100%;height:30px;border:1px solid #ddd;padding:2px;cursor:pointer;border-radius:4px" onchange="updateProp(${block.id},'btnTextColor',this.value)"></div>
    </div>`;
  }

  // Global Color Overrides
  if (d.headerColor !== undefined || d.textColor !== undefined || d.btnColor !== undefined || d.btnTextColor !== undefined) {
    html += `<div class="prop-section">Text & button colors</div>`;
    if (d.headerColor !== undefined) {
      html += `<div class="prop-group"><span class="prop-label">Header text color</span>
        <input type="color" value="${d.headerColor}" style="width:100%;height:30px;border:1px solid #ddd;padding:2px;cursor:pointer;border-radius:4px" onchange="updateProp(${block.id},'headerColor',this.value)">
      </div>`;
    }
    if (d.textColor !== undefined) {
      html += `<div class="prop-group"><span class="prop-label">Body text color</span>
        <input type="color" value="${d.textColor}" style="width:100%;height:30px;border:1px solid #ddd;padding:2px;cursor:pointer;border-radius:4px" onchange="updateProp(${block.id},'textColor',this.value)">
      </div>`;
    }
    if (d.btnColor !== undefined) {
      html += `<div class="prop-group"><span class="prop-label">Button background</span>
        <input type="color" value="${d.btnColor}" style="width:100%;height:30px;border:1px solid #ddd;padding:2px;cursor:pointer;border-radius:4px" onchange="updateProp(${block.id},'btnColor',this.value)">
      </div>`;
    }
    if (d.btnTextColor !== undefined) {
      html += `<div class="prop-group"><span class="prop-label">Button text color</span>
        <input type="color" value="${d.btnTextColor}" style="width:100%;height:30px;border:1px solid #ddd;padding:2px;cursor:pointer;border-radius:4px" onchange="updateProp(${block.id},'btnTextColor',this.value)">
      </div>`;
    }
  }

  // Background color
  if (d.bg !== undefined) {
    html += `<div class="prop-group"><span class="prop-label">Background color</span><div class="bg-grid">
      ${BG_COLORS.map(c => `<div class="bg-swatch${d.bg === c ? ' active' : ''}" style="background:${c}" title="${c}" onclick="updateProp(${block.id},'bg','${c}')"></div>`).join('')}
      <div class="bg-swatch" style="background:linear-gradient(135deg,#fff 50%,#eee 50%);border:1px solid #ddd" title="White" onclick="updateProp(${block.id},'bg','#ffffff')"></div>
    </div></div>`;
  }

  // data connect button for list types
  if (['gridimgtext', 'gridimgtextrow', 'features', 'footer', 'abouthighlights', 'servicegrid', 'logoslider', 'clientslider', 'footer2', 'testimonial', 'locations', 'heroslider'].includes(block.type)) {
    html += `<div class="prop-section">Advanced Data</div>`;
    html += `<button class="data-connect-btn" onclick="openModal(${block.id})">⊞ Manage list items</button>`;
  }

  // Testimonial-specific sidebar controls
  if (block.type === 'testimonial') {
    html += `<div class="prop-section">Display Options</div>`;
    html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div class="prop-group"><span class="prop-label">Show Role</span>
        <select class="prop-input" onchange="updateProp(${block.id},'showRole', this.value === 'true')">
          <option value="true" ${d.showRole !== false ? 'selected' : ''}>Yes (Show)</option>
          <option value="false" ${d.showRole === false ? 'selected' : ''}>No (Hide)</option>
        </select>
      </div>
      <div class="prop-group"><span class="prop-label">Italic Quotes</span>
        <select class="prop-input" onchange="updateProp(${block.id},'italicQuote', this.value === 'true')">
          <option value="true" ${d.italicQuote !== false ? 'selected' : ''}>Yes (Italic)</option>
          <option value="false" ${d.italicQuote === false ? 'selected' : ''}>No (Normal)</option>
        </select>
      </div>
    </div>`;
    html += `<div class="prop-group"><span class="prop-label">Navigation Type</span>
      <select class="prop-input" onchange="updateProp(${block.id},'navType', this.value)">
        <option value="both" ${(d.navType || 'both') === 'both' ? 'selected' : ''}>Both (Arrows &amp; Dots)</option>
        <option value="dots" ${d.navType === 'dots' ? 'selected' : ''}>Dots Only</option>
        <option value="arrows" ${d.navType === 'arrows' ? 'selected' : ''}>Arrows Only</option>
      </select>
    </div>`;
  }

  // Footer2-specific sidebar controls
  if (block.type === 'footer2') {
    html += `<div class="prop-section">Display Options</div>`;
    html += `<div class="prop-group"><span class="prop-label">Show Newsletter</span>
      <select class="prop-input" onchange="updateProp(${block.id},'showNewsletter', this.value === 'true')">
        <option value="true" ${d.showNewsletter !== false ? 'selected' : ''}>Yes</option>
        <option value="false" ${d.showNewsletter === false ? 'selected' : ''}>No</option>
      </select>
    </div>`;
  }

  // schema note
  //html+=`<div class="prop-section">DB schema</div>`;
  //html+=`<div style="font-size:10px;font-family:var(--mono);color:var(--text3);line-height:1.8">
  //  <div>table: <span style="color:var(--accent-text)">${tpl.table}</span></div>
  //  <div>pageId: <span style="color:var(--amber)">INT FK</span></div>
  //  <div>componentOrder: <span style="color:var(--amber)">INT</span></div>
  //  <div>blockId: <span style="color:var(--amber)">VARCHAR</span></div>
  //</div>`;

  pb.innerHTML = html;
}

function updateProp(id, key, value, skipProps = false) {
  const block = get_blocks().find(b => b.id === id); if (!block) return;
  block.data[key] = value;
  rebuildBlock(block); render();
  if (!skipProps) renderProps(block);
}

// ──────────────────────────────────────────────────
//  DATA MODAL
// ──────────────────────────────────────────────────
function openModal(blockId) {
  activeModalBlock = get_blocks().find(b => b.id === blockId); if (!activeModalBlock) return;
  const tpl = TEMPLATES[activeModalBlock.type];
  document.getElementById('modal-icon').textContent = tpl.icon;
  document.getElementById('modal-title').textContent = tpl.label + ' — data editor';
  document.getElementById('modal-subtitle').textContent = `PageId: ${currentPageId} · ComponentOrder: ${activeModalBlock.componentOrder} · Table: ${tpl.table}`;
  document.getElementById('modal-schema-note').textContent = `INSERT INTO ${tpl.table} (pageId, componentOrder, ...) VALUES (...)`;
  activeModalTab = 'content';
  renderModalBody();
  document.getElementById('modal-overlay').classList.add('open');
}
function closeModal() { document.getElementById('modal-overlay').classList.remove('open'); activeModalBlock = null; }

function renderModalBody() {
  if (!activeModalBlock) return;
  const type = activeModalBlock.type;
  const d = activeModalBlock.data;
  const body = document.getElementById('modal-body');

  const tabs = `<div class="m-tabs">
    <button class="m-tab${activeModalTab === 'content' ? ' active' : ''}" onclick="setModalTab('content')">Content</button>
    <button class="m-tab${activeModalTab === 'style' ? ' active' : ''}" onclick="setModalTab('style')">Style & Layout</button>
    <button class="m-tab${activeModalTab === 'schema' ? ' active' : ''}" onclick="setModalTab('schema')">DB Schema</button>
  </div>`;

  if (activeModalTab === 'content') {
    if (type === 'gridimgtext') {
      body.innerHTML = tabs + renderGridItemsForm(d);
    } else if (type === 'gridimgtextrow') {
      body.innerHTML = tabs + renderGridImgTextRowForm(d);
    } else if (type === 'features') {
      body.innerHTML = tabs + renderFeatItemsForm(d);
    } else if (type === 'navbar') {
      body.innerHTML = tabs + renderNavbarForm(d);
    } else if (type === 'footer') {
      body.innerHTML = tabs + renderFooterLinksForm(d);
    } else if (type === 'footer2') {
      body.innerHTML = tabs + renderFooter2Form(d);
    } else if (type === 'abouthighlights') {
      body.innerHTML = tabs + renderAboutHighlightsForm(d);
    } else if (type === 'servicegrid') {
      body.innerHTML = tabs + renderServiceGridForm(d);
    } else if (type === 'logoslider') {
      body.innerHTML = tabs + renderLogoSliderForm(d);
    } else if (type === 'testimonial') {
      body.innerHTML = tabs + renderTestimonialSliderForm(d);
    } else if (type === 'clientslider') {
      body.innerHTML = tabs + renderClientSliderForm(d);
    } else if (type === 'heroslider') {
      body.innerHTML = tabs + renderHeroSliderForm(d);
    } else if (type === 'locations') {
      body.innerHTML = tabs + renderLocationsForm(d);
    } else {
      body.innerHTML = tabs + '<p style="color:var(--text2);font-size:13px">Use the properties panel on the right to edit this block\'s content.</p>';
    }
  } else if (activeModalTab === 'style') {
    body.innerHTML = tabs + renderStyleTab(d, type);
  } else {
    body.innerHTML = tabs + renderSchemaTab(type);
  }
}

function setModalTab(tab) { activeModalTab = tab; renderModalBody(); }

function renderGridItemsForm(d) {
  let html = `<div class="m-field"><div class="m-label">Section heading</div><input class="m-input" id="m-heading" value="${d.heading}" oninput="modalUpdateProp('heading',this.value)"></div>`;
  html += `<div class="m-field"><div class="m-label">Subtext</div><input class="m-input" id="m-subtext" value="${d.subtext}" oninput="modalUpdateProp('subtext',this.value)"></div>`;
  html += `<div class="m-field"><div class="m-label">Columns <span class="m-badge">layout</span></div><select class="m-select" id="m-cols" onchange="modalUpdateProp('cols',this.value)"><option${d.cols === '2' ? ' selected' : ''}>2</option><option${d.cols === '3' ? ' selected' : ''}>3</option><option${d.cols === '4' ? ' selected' : ''}>4</option></select></div>`;
  html += `<div class="m-label" style="margin-bottom:8px">Cards <span class="m-badge">list</span></div>`;
  html += `<div class="m-list" id="m-items-list">`;
  (d.items || []).forEach((it, i) => {
    html += `<div class="m-list-item">
      <div class="item-num">${i + 1}</div>
      <div class="item-img">${it.imgSrc ? `<img src="${it.imgSrc}">` : '🖼'}</div>
      <div class="item-inputs">
        <input placeholder="Title" value="${it.title || ''}" oninput="updateListItem('gridimgtext',${i},'title',this.value)">
        <input placeholder="Tag (e.g. Design)" value="${it.tag || ''}" oninput="updateListItem('gridimgtext',${i},'tag',this.value)">
        <input placeholder="Description" value="${it.desc || ''}" oninput="updateListItem('gridimgtext',${i},'desc',this.value)" style="grid-column:span 2">
        ${listItemUploadField('gridimgtext', i, 'imgSrc', it.imgSrc, 'Card Image')}
      </div>
      <button style="border:none;background:none;cursor:pointer;color:var(--text3);font-size:14px;padding:2px" onclick="removeListItem(${i})">✕</button>
    </div>`;
  });
  html += `</div><button class="m-add-btn" onclick="addListItem('gridimgtext')">+ Add card</button>`;
  return html;
}

function renderGridImgTextRowForm(d) {
  let html = `<div class="m-field"><div class="m-label">Section heading</div><input class="m-input" id="m-heading" value="${d.heading}" oninput="modalUpdateProp('heading',this.value)"></div>`;
  html += `<div class="m-field"><div class="m-label">Subtext</div><input class="m-input" id="m-subtext" value="${d.subtext}" oninput="modalUpdateProp('subtext',this.value)"></div>`;
  html += `<div class="m-field"><div class="m-label">Columns <span class="m-badge">layout</span></div><select class="m-select" id="m-cols" onchange="modalUpdateProp('cols',this.value)"><option${d.cols === '1' ? ' selected' : ''}>1</option><option${d.cols === '2' ? ' selected' : ''}>2</option><option${d.cols === '3' ? ' selected' : ''}>3</option></select></div>`;
  html += `<div class="m-label" style="margin-bottom:8px">Cards <span class="m-badge">list</span></div>`;
  html += `<div class="m-list" id="m-items-list">`;
  (d.items || []).forEach((it, i) => {
    html += `<div class="m-list-item">
      <div class="item-num">${i + 1}</div>
      <div class="item-img">${it.imgSrc ? `<img src="${it.imgSrc}">` : '&#128444;'}</div>
      <div class="item-inputs">
        <input placeholder="Title" value="${it.title || ''}" oninput="updateListItem('gridimgtextrow',${i},'title',this.value)">
        <input placeholder="Tag" value="${it.tag || ''}" oninput="updateListItem('gridimgtextrow',${i},'tag',this.value)">
        <input placeholder="Description" value="${it.desc || ''}" oninput="updateListItem('gridimgtextrow',${i},'desc',this.value)" style="grid-column:span 2">
        <input placeholder="Button label" value="${it.btnText || 'Learn more'}" oninput="updateListItem('gridimgtextrow',${i},'btnText',this.value)">
        <input placeholder="Button URL (Slug or link)" value="${it.btnLink || '#'}" oninput="updateListItem('gridimgtextrow',${i},'btnLink',this.value)">
        ${listItemUploadField('gridimgtextrow', i, 'imgSrc', it.imgSrc, 'Card Image')}
      </div>
      <button style="border:none;background:none;cursor:pointer;color:var(--text3);font-size:14px;padding:2px" onclick="removeListItem(${i})">&#x2715;</button>
    </div>`;
  });
  html += `</div><button class="m-add-btn" onclick="addListItem('gridimgtextrow')">+ Add card</button>`;
  return html;
}

function renderFeatItemsForm(d) {
  let html = `<div class="m-field"><div class="m-label">Section heading</div><input class="m-input" id="m-heading" value="${d.heading}" oninput="modalUpdateProp('heading',this.value)"></div>`;
  html += `<div class="m-label" style="margin-bottom:8px">Features <span class="m-badge">list</span></div><div class="m-list">`;
  (d.items || []).forEach((it, i) => {
    html += `<div class="m-list-item">
      <div class="item-num">${i + 1}</div>
      <div class="item-inputs">
        <input placeholder="Icon (emoji)" value="${it.icon || ''}" oninput="updateListItem('features',${i},'icon',this.value)" style="max-width:60px">
        <input placeholder="Title" value="${it.title || ''}" oninput="updateListItem('features',${i},'title',this.value)">
        <input placeholder="Description" value="${it.desc || ''}" oninput="updateListItem('features',${i},'desc',this.value)" style="grid-column:span 2">
      </div>
      <button style="border:none;background:none;cursor:pointer;color:var(--text3);font-size:14px" onclick="removeListItem(${i})">✕</button>
    </div>`;
  });
  html += `</div><button class="m-add-btn" onclick="addListItem('features')">+ Add feature</button>`;
  return html;
}

function renderFooterLinksForm(d) {
  let html = `<div class="m-field"><div class="m-label">Brand Name</div><input class="m-input" id="m-brand" value="${d.brand}" oninput="modalUpdateProp('brand',this.value)"></div>`;
  html += modalUploadField('logoImage', d.logoImage || '', 'Logo Image');
  html += `<div class="m-field"><div class="m-label">Copyright Text</div><input class="m-input" id="m-copy" value="${d.copy}" oninput="modalUpdateProp('copy',this.value)"></div>`;

  html += `<div class="m-field"><div class="m-label">Link Position</div>
    <select class="m-select" id="m-linkPosition" onchange="modalUpdateProp('linkPosition',this.value)">
      <option value="center" ${d.linkPosition === 'center' ? 'selected' : ''}>Center (Copyright Right)</option>
      <option value="left" ${d.linkPosition === 'left' ? 'selected' : ''}>Left (Copyright Center)</option>
    </select>
  </div>`;

  html += `<div class="m-field"><div class="m-label">Show Logo</div>
    <select class="m-select" onchange="modalUpdateProp('showLogo', this.value === 'yes')">
      <option value="yes" ${d.showLogo !== false ? 'selected' : ''}>Yes</option>
      <option value="no" ${d.showLogo === false ? 'selected' : ''}>No</option>
    </select>
  </div>`;

  html += `<div class="m-field"><div class="m-label">Show Brand Name</div>
    <select class="m-select" onchange="modalUpdateProp('showBrand', this.value === 'yes')">
      <option value="yes" ${d.showBrand !== false ? 'selected' : ''}>Yes</option>
      <option value="no" ${d.showBrand === false ? 'selected' : ''}>No</option>
    </select>
  </div>`;

  html += `<div class="m-field"><div class="m-label">Show Links</div>
    <select class="m-select" onchange="modalUpdateProp('showItems', this.value === 'yes')">
      <option value="yes" ${d.showItems !== false ? 'selected' : ''}>Yes</option>
      <option value="no" ${d.showItems === false ? 'selected' : ''}>No</option>
    </select>
  </div>`;

  html += `<div class="m-label" style="margin-bottom:8px; margin-top:20px;">Footer Links (Privacy, Terms, etc.) <span class="m-badge">list</span></div>`;
  html += `<div class="m-list" id="m-links-list">`;
  (d.items || []).forEach((it, i) => {
    html += `<div class="m-list-item">
      <div class="item-num">${i + 1}</div>
      <div class="item-inputs">
        <input placeholder="Label (e.g. Privacy)" value="${it.label || ''}" oninput="updateListItem('footer',${i},'label',this.value)">
        <input placeholder="Slug or URL (e.g. privacy)" value="${it.slug || ''}" oninput="updateListItem('footer',${i},'slug',this.value)">
      </div>
      <button style="border:none;background:none;cursor:pointer;color:var(--text3);font-size:14px;padding:2px" onclick="removeListItem(${i})">✕</button>
    </div>`;
  });
  html += `</div><button class="m-add-btn" onclick="addListItem('footer')">+ Add link</button>`;
  return html;
}

function renderFooter2Form(d) {
  let html = '';
  // Brand & copy
  html += `<div class="m-row2">
    <div class="m-field"><div class="m-label">Brand Name</div><input class="m-input" value="${d.brand || ''}" oninput="modalUpdateProp('brand',this.value)"></div>
    ${modalUploadField('logoImage', d.logoImage || '', 'Logo Image')}
  </div>`;
  html += `<div class="m-field"><div class="m-label">Tagline / Description</div><textarea class="m-input" rows="2" oninput="modalUpdateProp('tagline',this.value)" style="resize:vertical">${d.tagline || ''}</textarea></div>`;
  html += `<div class="m-field"><div class="m-label">Copyright Text</div><input class="m-input" value="${d.copy || ''}" oninput="modalUpdateProp('copy',this.value)"></div>`;

  // Column Layout
  html += `<div class="m-field"><div class="m-label">Column Layout</div>
    <div style="display:flex;gap:8px;margin-top:4px">
      <button class="pos-btn${(d.colLayout || '4') === '4' ? ' active' : ''}" onclick="modalUpdateProp('colLayout','4')" style="padding:6px 16px">4 Columns</button>
      <button class="pos-btn${d.colLayout === '3' ? ' active' : ''}" onclick="modalUpdateProp('colLayout','3')" style="padding:6px 16px">3 Columns</button>
    </div>
  </div>`;

  html += `<div class="m-field"><div class="m-label">Show Newsletter</div>
    <select class="m-select" onchange="modalUpdateProp('showNewsletter', this.value === 'yes')">
      <option value="yes" ${d.showNewsletter !== false ? 'selected' : ''}>Yes</option>
      <option value="no" ${d.showNewsletter === false ? 'selected' : ''}>No</option>
    </select>
  </div>`;

  // Contact Sections
  html += `<div class="m-label" style="margin:18px 0 8px">Contact Sections <span class="m-badge">list</span></div>`;
  html += `<div class="m-list" id="m-f2-contacts">`;
  (d.contactLinks || []).forEach((it, i) => {
    html += `<div class="m-list-item">
      <div class="item-num">${i + 1}</div>
      <div class="item-inputs">
        <input placeholder="Title (e.g. Admin Office)" value="${it.label || ''}" oninput="updateFooter2Contact(${i},'label',this.value)" style="grid-column:span 2">
        <input placeholder="Address" value="${it.address || ''}" oninput="updateFooter2Contact(${i},'address',this.value)" style="grid-column:span 2">
        <input placeholder="Email" value="${it.email || ''}" oninput="updateFooter2Contact(${i},'email',this.value)">
        <input placeholder="Phone" value="${it.phone || ''}" oninput="updateFooter2Contact(${i},'phone',this.value)">
      </div>
      <button style="border:none;background:none;cursor:pointer;color:var(--text3);font-size:14px;padding:2px" onclick="removeFooter2Contact(${i})">✕</button>
    </div>`;
  });
  html += `</div><button class="m-add-btn" onclick="addFooter2Contact()">+ Add contact section</button>`;

  // Quick Links list
  html += `<div class="m-label" style="margin:18px 0 8px">Footer Links & Columns <span class="m-badge">list</span></div>`;
  html += `<p style="font-size:11px;color:var(--text3);margin-bottom:10px">Links with the same <b>Column Name</b> will be grouped together visually.</p>`;
  html += `<div class="m-list" id="m-f2-links">`;
  (d.quickLinks || []).forEach((it, i) => {
    html += `<div class="m-list-item">
      <div class="item-num">${i + 1}</div>
      <div class="item-inputs">
        <input placeholder="Link Label" value="${it.label || ''}" oninput="updateFooter2QuickLink(${i},'label',this.value)">
        <input placeholder="Slug or URL" value="${it.slug || ''}" oninput="updateFooter2QuickLink(${i},'slug',this.value)">
        <input placeholder="Column Name (Group)" value="${it.colName || 'QUICK LINKS'}" oninput="updateFooter2QuickLink(${i},'colName',this.value)">
        <input type="number" placeholder="Col Order" value="${it.colOrder || 1}" oninput="updateFooter2QuickLink(${i},'colOrder',parseInt(this.value))">
      </div>
      <button style="border:none;background:none;cursor:pointer;color:var(--text3);font-size:14px;padding:2px" onclick="removeFooter2QuickLink(${i})">✕</button>
    </div>`;
  });
  html += `</div><button class="m-add-btn" onclick="addFooter2QuickLink()">+ Add link</button>`;

  return html;
}

function addFooter2Contact() {
  if (!activeModalBlock) return;
  activeModalBlock.data.contactLinks = activeModalBlock.data.contactLinks || [];
  activeModalBlock.data.contactLinks.push({ label: 'Main Office', address: '', email: '', phone: '' });
  rebuildBlock(activeModalBlock); render();
  renderModalBody();
}
function removeFooter2Contact(i) {
  if (!activeModalBlock) return;
  activeModalBlock.data.contactLinks.splice(i, 1);
  rebuildBlock(activeModalBlock); render();
  renderModalBody();
}
function updateFooter2Contact(i, key, value) {
  if (!activeModalBlock) return;
  activeModalBlock.data.contactLinks[i][key] = value;
  rebuildBlock(activeModalBlock); render();
}

function addFooter2QuickLink() {
  if (!activeModalBlock) return;
  activeModalBlock.data.quickLinks = activeModalBlock.data.quickLinks || [];
  activeModalBlock.data.quickLinks.push({ label: 'New Link', slug: '#', colName: 'QUICK LINKS', colOrder: 1 });
  rebuildBlock(activeModalBlock); render();
  renderModalBody();
}
function removeFooter2QuickLink(i) {
  if (!activeModalBlock) return;
  activeModalBlock.data.quickLinks.splice(i, 1);
  rebuildBlock(activeModalBlock); render();
  renderModalBody();
}
function updateFooter2QuickLink(i, key, value) {
  if (!activeModalBlock) return;
  activeModalBlock.data.quickLinks[i][key] = value;
  rebuildBlock(activeModalBlock); render();
}

function renderAboutHighlightsForm(d) {
  let html = `<div class="m-field"><div class="m-label">Main Heading</div><input class="m-input" id="m-heading" value="${d.heading}" oninput="modalUpdateProp('heading',this.value)"></div>`;
  html += `<div class="m-field"><div class="m-label">Subheading</div><input class="m-input" id="m-subheading" value="${d.subheading}" oninput="modalUpdateProp('subheading',this.value)"></div>`;
  html += `<div class="m-field"><div class="m-label">Description</div><textarea class="m-input" id="m-body" rows="3" oninput="modalUpdateProp('body',this.value)" style="resize:vertical">${d.body}</textarea></div>`;
  html += `<div class="m-row2">
    <div class="m-field"><div class="m-label">Button Text</div><input class="m-input" id="m-btnText" value="${d.btnText}" oninput="modalUpdateProp('btnText',this.value)"></div>
    <div class="m-field"><div class="m-label">Button Link</div><input class="m-input" id="m-btnLink" value="${d.btnLink}" oninput="modalUpdateProp('btnLink',this.value)"></div>
  </div>`;
  html += `<div class="m-label" style="margin-bottom:8px">Highlights <span class="m-badge">list</span></div>`;
  html += `<div class="m-list" id="m-items-list">`;
  (d.items || []).forEach((it, i) => {
    html += `<div class="m-list-item">
      <div class="item-num">${i + 1}</div>
      <div class="item-inputs" style="grid-template-columns: 50px 1fr;">
        <input placeholder="Icon" value="${it.icon || ''}" oninput="updateListItem('abouthighlights',${i},'icon',this.value)">
        <input placeholder="Title" value="${it.title || ''}" oninput="updateListItem('abouthighlights',${i},'title',this.value)">
        <input placeholder="Description" value="${it.desc || ''}" oninput="updateListItem('abouthighlights',${i},'desc',this.value)" style="grid-column:span 2">
      </div>
      <button style="border:none;background:none;cursor:pointer;color:var(--text3);font-size:14px;padding:2px" onclick="removeListItem(${i})">✕</button>
    </div>`;
  });
  html += `</div><button class="m-add-btn" onclick="addListItem('abouthighlights')">+ Add highlight</button>`;
  return html;
}

function renderServiceGridForm(d) {
  let html = `<div class="m-field"><div class="m-label">Section heading</div><input class="m-input" id="m-heading" value="${d.heading}" oninput="modalUpdateProp('heading',this.value)"></div>`;
  html += `<div class="m-row2">
    <div class="m-field"><div class="m-label">Button Text</div><input class="m-input" id="m-btnText" value="${d.btnText}" oninput="modalUpdateProp('btnText',this.value)"></div>
    <div class="m-field"><div class="m-label">Button Link</div><input class="m-input" id="m-btnLink" value="${d.btnLink}" oninput="modalUpdateProp('btnLink',this.value)"></div>
  </div>`;
  html += `<div class="m-label" style="margin-bottom:8px">Service Items <span class="m-badge">list</span></div>`;
  html += `<div class="m-list" id="m-items-list">`;
  (d.items || []).forEach((it, i) => {
    html += `<div class="m-list-item">
      <div class="item-num">${i + 1}</div>
      <div class="item-inputs" style="grid-template-columns: 50px 1fr;">
        <input placeholder="Icon" value="${it.icon || ''}" oninput="updateListItem('servicegrid',${i},'icon',this.value)">
        <input placeholder="Title" value="${it.title || ''}" oninput="updateListItem('servicegrid',${i},'title',this.value)">
      </div>
      <button style="border:none;background:none;cursor:pointer;color:var(--text3);font-size:14px;padding:2px" onclick="removeListItem(${i})">✕</button>
    </div>`;
  });
  html += `</div><button class="m-add-btn" onclick="addListItem('servicegrid')">+ Add service</button>`;
  return html;
}

function renderLogoSliderForm(d) {
  let html = `<div class="m-field"><div class="m-label">Section heading</div><input class="m-input" id="m-heading" value="${d.heading}" oninput="modalUpdateProp('heading',this.value)"></div>`;
  html += `<div class="m-row2">
    <div class="m-field"><div class="m-label">Button Text</div><input class="m-input" id="m-btnText" value="${d.btnText}" oninput="modalUpdateProp('btnText',this.value)"></div>
    <div class="m-field"><div class="m-label">Button Link</div><input class="m-input" id="m-btnLink" value="${d.btnLink}" oninput="modalUpdateProp('btnLink',this.value)"></div>
  </div>`;
  html += `<div class="m-label" style="margin-bottom:8px">Logos <span class="m-badge">list</span></div>`;
  html += `<div class="m-list" id="m-items-list">`;
  (d.items || []).forEach((it, i) => {
    html += `<div class="m-list-item">
      <div class="item-num">${i + 1}</div>
      <div class="item-img">${it.imgSrc ? `<img src="${it.imgSrc}">` : '🖼'}</div>
      <div class="item-inputs">
        <input placeholder="Name" value="${it.name || ''}" oninput="updateListItem('logoslider',${i},'name',this.value)">
        <input placeholder="Link" value="${it.link || '#'}" oninput="updateListItem('logoslider',${i},'link',this.value)">
        ${listItemUploadField('logoslider', i, 'imgSrc', it.imgSrc, 'Logo')}
      </div>
      <button style="border:none;background:none;cursor:pointer;color:var(--text3);font-size:14px;padding:2px" onclick="removeListItem(${i})">✕</button>
    </div>`;
  });
  html += `</div><button class="m-add-btn" onclick="addListItem('logoslider')">+ Add logo</button>`;
  return html;
}

function renderTestimonialSliderForm(d) {
  let html = `<div class="m-field"><div class="m-label">Section heading</div><input class="m-input" id="m-heading" value="${d.heading}" oninput="modalUpdateProp('heading',this.value)"></div>`;
  html += `<div class="m-label" style="margin-bottom:8px">Testimonials <span class="m-badge">list</span></div>`;
  html += `<div class="m-list" id="m-items-list">`;
  (d.items || []).forEach((it, i) => {
    html += `<div class="m-list-item">
      <div class="item-num">${i + 1}</div>
      <div class="item-img">${it.imgSrc ? `<img src="${it.imgSrc}">` : '👤'}</div>
      <div class="item-inputs" style="grid-template-columns:1fr 1fr">
        <div class="m-field" style="margin:0">
          <div class="m-label">Author Name</div>
          <input class="m-input" placeholder="e.g. Pallavi Ganti" value="${it.author || ''}" oninput="updateListItem('testimonial',${i},'author',this.value)">
        </div>
        <div class="m-field" style="margin:0">
          <div class="m-label">Role / Title</div>
          <input class="m-input" placeholder="e.g. President &amp; CEO" value="${it.role || ''}" oninput="updateListItem('testimonial',${i},'role',this.value)">
        </div>
        <div class="m-field" style="margin:0">
          <div class="m-label">Star Rating</div>
          <select class="m-input" onchange="updateListItem('testimonial',${i},'rating',parseInt(this.value))">
            ${[1, 2, 3, 4, 5].map(n => `<option value="${n}" ${(it.rating || 5) === n ? 'selected' : ''}>${'★'.repeat(n)} (${n} star${n > 1 ? 's' : ''})</option>`).join('')}
          </select>
        </div>
        <div class="m-field" style="margin:0">
          <div class="m-label">Author Photo</div>
          ${listItemUploadField('testimonial', i, 'imgSrc', it.imgSrc, 'Photo')}
        </div>
        <div class="m-field" style="margin:0;grid-column:span 2">
          <div class="m-label">Quote / Message</div>
          <textarea class="m-input" placeholder="What the client said..." oninput="updateListItem('testimonial',${i},'quote',this.value)" style="height:70px;resize:vertical">${it.quote || ''}</textarea>
        </div>
      </div>
      <button style="border:none;background:none;cursor:pointer;color:var(--text3);font-size:14px;padding:2px" onclick="removeListItem(${i})">✕</button>
    </div>`;
  });
  html += `</div><button class="m-add-btn" onclick="addListItem('testimonial')">+ Add testimonial</button>`;
  return html;
}

function renderClientSliderForm(d) {
  let html = `<div class="m-row">
    <div class="m-field"><div class="m-label">Section heading</div><input class="m-input" id="m-heading" value="${d.heading}" oninput="modalUpdateProp('heading',this.value)"></div>
    <div class="m-field"><div class="m-label">Text Color</div><input type="color" class="m-color-input" value="${d.textColor || '#1a1a2e'}" oninput="modalUpdateProp('textColor',this.value)"></div>
  </div>`;
  html += `<div class="m-row">
    <div class="m-field"><div class="m-label">Background</div><input type="color" class="m-color-input" value="${d.bg || '#f8f9fa'}" oninput="modalUpdateProp('bg',this.value)"></div>
    <div class="m-field"><div class="m-label">Vertical Padding</div><input type="range" min="0" max="200" step="10" value="${d.paddingV || 100}" oninput="modalUpdateProp('paddingV',parseInt(this.value));this.nextElementSibling.innerText=this.value+'px'"><span>${d.paddingV || 100}px</span></div>
  </div>`;
  html += `<div class="m-field"><div class="m-label">Columns <span class="m-badge">layout</span></div>
    <select class="m-select" id="m-cols" onchange="modalUpdateProp('cols',this.value)">
      <option value="2" ${d.cols === '2' ? 'selected' : ''}>2 Columns</option>
      <option value="3" ${d.cols === '3' ? 'selected' : ''}>3 Columns</option>
      <option value="4" ${d.cols === '4' ? 'selected' : ''}>4 Columns</option>
      <option value="5" ${d.cols === '5' ? 'selected' : ''}>5 Columns</option>
      <option value="6" ${d.cols === '6' ? 'selected' : ''}>6 Columns</option>
    </select>
  </div>`;
  html += `<div class="m-label" style="margin-bottom:8px">Client Logos <span class="m-badge">list</span></div>`;
  html += `<div class="m-list" id="m-items-list">`;
  (d.items || []).forEach((it, i) => {
    html += `<div class="m-list-item">
      <div class="item-num">${i + 1}</div>
      <div class="item-img">${it.imgSrc ? `<img src="${it.imgSrc}">` : '🖼'}</div>
      <div class="item-inputs">
        ${listItemUploadField('clientslider', i, 'imgSrc', it.imgSrc, 'Client Logo')}
      </div>
      <button style="border:none;background:none;cursor:pointer;color:var(--text3);font-size:14px;padding:2px" onclick="removeListItem(${i})">✕</button>
    </div>`;
  });
  html += `</div><button class="m-add-btn" onclick="addListItem('clientslider')">+ Add client</button>`;
  return html;
}

function renderHeroSliderForm(d) {
  let html = `<div class="m-row">
    <div class="m-field"><div class="m-label">Overlay Color</div><input type="text" class="m-input" value="${d.overlayColor || 'rgba(26, 43, 85, 0.7)'}" oninput="modalUpdateProp('overlayColor',this.value)"></div>
    <div class="m-field"><div class="m-label">Vertical Padding</div><input type="range" min="0" max="200" step="10" value="${d.paddingV || 0}" oninput="modalUpdateProp('paddingV',parseInt(this.value));this.nextElementSibling.innerText=this.value+'px'"><span>${d.paddingV || 0}px</span></div>
  </div>`;
  html += `<div class="m-label" style="margin-bottom:8px">Slides <span class="m-badge">list</span></div>`;
  html += `<div class="m-list" id="m-items-list">`;
  (d.items || []).forEach((it, i) => {
    html += `<div class="m-list-item">
      <div class="item-num">${i + 1}</div>
      <div class="item-img">${it.bgImage ? `<img src="${it.bgImage}">` : '🖼'}</div>
      <div class="item-inputs">
        <input placeholder="Tag (e.g. MISSION)" value="${it.tag || ''}" oninput="updateListItem('heroslider',${i},'tag',this.value)">
        <input placeholder="Slide Heading" value="${it.heading || ''}" oninput="updateListItem('heroslider',${i},'heading',this.value)" style="grid-column:span 2">
        ${listItemUploadField('heroslider', i, 'bgImage', it.bgImage, 'Background')}
      </div>
      <button style="border:none;background:none;cursor:pointer;color:var(--text3);font-size:14px;padding:2px" onclick="removeListItem(${i})">✕</button>
    </div>`;
  });
  html += `</div><button class="m-add-btn" onclick="addListItem('heroslider')">+ Add slide</button>`;
  return html;
}

// ──────────────────────────────────────────────────
//  SLIDER LOGIC
// ──────────────────────────────────────────────────
let sliderStates = {};

function initSliders() {
  document.querySelectorAll('.b-logoslider, .b-testimonial-slider, .b-client-slider, .b-hero-slider, .b-heropro').forEach(slider => {
    const id = slider.id.replace('slider-', '');
    if (!sliderStates[id]) {
      sliderStates[id] = { current: 0, interval: null, count: 0 };
    }
    updateSliderView(id);

    const autoScrollStr = slider.getAttribute('data-autoscroll');
    if (autoScrollStr !== 'false') {
      startSliderAuto(id);
      slider.onmouseenter = () => stopSliderAuto(id);
      slider.onmouseleave = () => startSliderAuto(id);
    } else {
      stopSliderAuto(id);
      slider.onmouseenter = null;
      slider.onmouseleave = null;
    }
  });
}

function jumpSlider(id, index) {
  if (!sliderStates[id]) return;
  sliderStates[id].current = index;
  updateSliderView(id);
  startSliderAuto(id); // reset interval
}

function moveSlider(id, dir) {
  const block = get_blocks().find(b => b.id == id);
  if (!block) return;
  const items = block.data.items || [];
  const visibleCount = getVisibleCount(block.type);
  const max = Math.max(0, items.length - visibleCount);

  if (!sliderStates[id]) sliderStates[id] = { current: 0, interval: null };

  sliderStates[id].current += dir;
  if (sliderStates[id].current > max) sliderStates[id].current = 0;
  if (sliderStates[id].current < 0) sliderStates[id].current = max;

  updateSliderView(id);
}

function updateSliderView(id) {
  const slider = document.getElementById(`slider-${id}`);
  if (!slider) return;
  const isTestimonial = slider.classList.contains('b-testimonial-slider');
  const isClient = slider.classList.contains('b-client-slider');
  const isHero = slider.classList.contains('b-hero-slider');
  const isHeroPro = slider.classList.contains('b-heropro');

  const prefix = isHeroPro ? 'hp' : (isHero ? 'h' : (isClient ? 'cs' : (isTestimonial ? 'ts' : 'ls')));

  const track = slider.querySelector(`.${prefix}-track`);
  const dots = slider.querySelectorAll(`.${prefix}-dot`);
  const state = sliderStates[id];

  const item = track.querySelector(`.${prefix}-item, .${prefix}-slide`);
  if (!item) return;

  const gap = (isHero || isHeroPro) ? 0 : 30;
  const itemWidth = item.offsetWidth;
  const moveX = state.current * (itemWidth + gap);

  track.style.transform = `translateX(-${moveX}px)`;

  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === state.current);
  });
}

function startSliderAuto(id) {
  stopSliderAuto(id);
  sliderStates[id].interval = setInterval(() => moveSlider(id, 1), 5000);
}

function stopSliderAuto(id) {
  if (sliderStates[id] && sliderStates[id].interval) {
    clearInterval(sliderStates[id].interval);
  }
}

function getVisibleCount(type) {
  if (type === 'heroslider' || type === 'heropro') return 1;
  const w = window.innerWidth;
  if (type === 'testimonial') {
    if (w > 992) return 2;
    return 1;
  }
  if (type === 'clientslider') {
    const slider = document.querySelector(`.b-client-slider`);
    let dCols = 4;
    if (slider) dCols = parseInt(slider.getAttribute('data-cols')) || 4;

    if (w > 992) return dCols;
    if (w > 768) return Math.min(3, dCols);
    if (w > 480) return Math.min(2, dCols);
    return 1;
  }
  // Default (logoslider)
  if (w > 992) return 4;
  if (w > 768) return 3;
  if (w > 480) return 2;
  return 1;
}

window.addEventListener('resize', () => {
  Object.keys(sliderStates).forEach(id => updateSliderView(id));
});

function renderNavbarForm(d) {
  let html = `<div class="m-field"><div class="m-label">Text Logo</div><input class="m-input" id="m-logo" value="${d.logo}" oninput="modalUpdateProp('logo',this.value)"></div>`;
  html += modalUploadField('logoImage', d.logoImage || '', 'Logo Image (replaces text if set)');
  html += `<div class="m-field"><div class="m-label">Links Position</div>
    <select class="m-select" id="m-linksPos" onchange="modalUpdateProp('linksPos',this.value)">
      <option value="left"${d.linksPos === 'left' ? ' selected' : ''}>Left (Next to Logo)</option>
      <option value="center"${d.linksPos === 'center' ? ' selected' : ''}>Center</option>
      <option value="right"${d.linksPos === 'right' ? ' selected' : ''}>Right (Default)</option>
    </select>
  </div>`;
  return html;
}

function renderStyleTab(d, type) {
  let html = '';
  if (d.bg !== undefined) {
    html += `<div class="m-field"><div class="m-label">Background color</div><div class="bg-grid" style="grid-template-columns:repeat(10,1fr);gap:6px;margin-top:6px">
      ${BG_COLORS.map(c => `<div class="bg-swatch${d.bg === c ? ' active' : ''}" style="background:${c}" onclick="modalUpdateProp('bg','${c}')"></div>`).join('')}
      <div class="bg-swatch" style="background:#fff;border:1px solid #ddd" onclick="modalUpdateProp('bg','#ffffff')"></div>
    </div></div>`;
  }
  if (d.logoColor !== undefined) {
    const logoColors = ['#111111', '#333333', '#5b4fff', '#0F6E56', '#cc3333', '#d97706', '#1e3a5f', '#ffffff'];
    html += `<div class="m-field"><div class="m-label">Logo text color</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">
      ${logoColors.map(c => `<div class="bg-swatch" style="background:${c};border:2px solid ${d.logoColor === c ? 'var(--accent)' : '#ddd'}" title="${c}" onclick="modalUpdateProp('logoColor','${c}')"></div>`).join('')}
      <label style="display:flex;align-items:center;gap:4px;font-size:11px;color:var(--text2);cursor:pointer">
        <input type="color" value="${d.logoColor}" style="width:22px;height:22px;border:none;padding:0;cursor:pointer;border-radius:4px" onchange="modalUpdateProp('logoColor',this.value)">custom
      </label>
    </div></div>`;
  }
  if (d.layout !== undefined) {
    html += `<div class="m-field"><div class="m-label">Image placement</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">
      ${['left', 'right', 'top', 'bottom'].map(v => `<button class="pos-btn${d.layout === v ? ' active' : ''}" onclick="modalUpdateProp('layout','${v}')" style="padding:6px 14px">${v}</button>`).join('')}
    </div></div>`;
  }
  if (d.textAlign !== undefined) {
    html += `<div class="m-field"><div class="m-label">Text align</div><div style="display:flex;gap:6px;margin-top:4px">
      ${['left', 'center', 'right'].map(v => `<button class="pos-btn${d.textAlign === v ? ' active' : ''}" onclick="modalUpdateProp('textAlign','${v}')" style="padding:6px 14px">${v.charAt(0).toUpperCase() + v.slice(1)}</button>`).join('')}
    </div></div>`;
  }
  if (d.cardBg !== undefined) {
    html += `<div class="m-field"><div class="m-label">Card background</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">
      ${['#ffffff', '#f9f9f7', '#f0ede8', '#eef4ff', '#f0fff4'].map(c => `<div class="bg-swatch" style="background:${c};border:2px solid ${d.cardBg === c ? '#111' : '#ddd'}" onclick="modalUpdateProp('cardBg','${c}')"></div>`).join('')}
    </div></div>`;
  }
  if (d.headerBg !== undefined) {
    html += `<div class="m-field"><div class="m-label">Image area background</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">
      ${['#f0ede8', '#e8ecf0', '#e8f0e8', '#f0e8f0', '#e8e8e8', '#1a1a2e', '#5b4fff', '#0F6E56'].map(c => `<div class="bg-swatch" style="background:${c};border:2px solid ${d.headerBg === c ? '#111' : '#ddd'}" onclick="modalUpdateProp('headerBg','${c}')"></div>`).join('')}
    </div></div>`;
  }
  if (d.imgLayout !== undefined) {
    html += `<div class="m-field"><div class="m-label">Image side (per card)</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">
      ${[['left', 'Image Left'], ['right', 'Image Right'], ['top', 'Image Top'], ['bottom', 'Image Bottom']].map(([v, l]) => `<button class="pos-btn${d.imgLayout === v ? ' active' : ''}" onclick="modalUpdateProp('imgLayout','${v}')" style="padding:6px 14px">${l}</button>`).join('')}
    </div></div>`;
  }
  if (d.imgBg !== undefined) {
    html += `<div class="m-field"><div class="m-label">Image area background</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">
      ${['#f0ede8', '#e8ecf0', '#e8f0e8', '#f0e8f0', '#e8e8e8', '#1a1a2e', '#5b4fff', '#0F6E56'].map(c => `<div class="bg-swatch" style="background:${c};border:2px solid ${d.imgBg === c ? '#111' : '#ddd'}" onclick="modalUpdateProp('imgBg','${c}')"></div>`).join('')}
    </div></div>`;
  }
  if (d.btnColor !== undefined) {
    const btnColors = ['#111111', '#5b4fff', '#0F6E56', '#cc3333', '#d97706', '#1e3a5f', '#3d34cc', '#ffffff'];
    html += `<div class="m-field"><div class="m-label">Button color</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">
      ${btnColors.map(c => `<div class="bg-swatch" style="background:${c};border:2px solid ${d.btnColor === c ? 'var(--accent)' : '#ddd'}" title="${c}" onclick="modalUpdateProp('btnColor','${c}')"></div>`).join('')}
      <label style="display:flex;align-items:center;gap:4px;font-size:11px;color:var(--text2);cursor:pointer">
        <input type="color" value="${d.btnColor}" style="width:22px;height:22px;border:none;padding:0;cursor:pointer;border-radius:4px" onchange="modalUpdateProp('btnColor',this.value)">custom
      </label>
    </div></div>`;
  }
  if (d.imgPosition !== undefined) {
    html += `<div class="m-field"><div class="m-label">Image focal point</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">
      ${[['top', 'Top'], ['center', 'Center'], ['bottom', 'Bottom'], ['left', 'Left'], ['right', 'Right']].map(([v, l]) => `<button class="pos-btn${d.imgPosition === v ? ' active' : ''}" onclick="modalUpdateProp('imgPosition','${v}')" style="padding:6px 14px">${l}</button>`).join('')}
    </div></div>`;
  }
  if (d.titleColor !== undefined) {
    const titleColors = ['#111111', '#333333', '#5b4fff', '#0F6E56', '#cc3333', '#d97706', '#1e3a5f', '#ffffff'];
    html += `<div class="m-field"><div class="m-label">Title color</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">
      ${titleColors.map(c => `<div class="bg-swatch" style="background:${c};border:2px solid ${d.titleColor === c ? 'var(--accent)' : '#ddd'}" title="${c}" onclick="modalUpdateProp('titleColor','${c}')"></div>`).join('')}
      <label style="display:flex;align-items:center;gap:4px;font-size:11px;color:var(--text2);cursor:pointer">
        <input type="color" value="${d.titleColor}" style="width:22px;height:22px;border:none;padding:0;cursor:pointer;border-radius:4px" onchange="modalUpdateProp('titleColor',this.value)">custom
      </label>
    </div></div>`;
  }
  if (d.descColor !== undefined) {
    const descColors = ['#666666', '#888888', '#444444', '#5b4fff', '#0F6E56', '#cc3333', '#111111', '#ffffff'];
    html += `<div class="m-field"><div class="m-label">Description color</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">
      ${descColors.map(c => `<div class="bg-swatch" style="background:${c};border:2px solid ${d.descColor === c ? 'var(--accent)' : '#ddd'}" title="${c}" onclick="modalUpdateProp('descColor','${c}')"></div>`).join('')}
      <label style="display:flex;align-items:center;gap:4px;font-size:11px;color:var(--text2);cursor:pointer">
        <input type="color" value="${d.descColor}" style="width:22px;height:22px;border:none;padding:0;cursor:pointer;border-radius:4px" onchange="modalUpdateProp('descColor',this.value)">custom
      </label>
    </div></div>`;
  }
  if (d.tagColor !== undefined) {
    const tagColors = ['#888888', '#5b4fff', '#0F6E56', '#cc3333', '#d97706', '#1e3a5f', '#111111', '#3d34cc'];
    html += `<div class="m-field"><div class="m-label">Tag color</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">
      ${tagColors.map(c => `<div class="bg-swatch" style="background:${c};border:2px solid ${d.tagColor === c ? 'var(--accent)' : '#ddd'}" title="${c}" onclick="modalUpdateProp('tagColor','${c}')"></div>`).join('')}
      <label style="display:flex;align-items:center;gap:4px;font-size:11px;color:var(--text2);cursor:pointer">
        <input type="color" value="${d.tagColor}" style="width:22px;height:22px;border:none;padding:0;cursor:pointer;border-radius:4px" onchange="modalUpdateProp('tagColor',this.value)">custom
      </label>
    </div></div>`;
  }
  if (type === 'navbar') {
    html += `<div class="prop-section">Links Styling</div>`;
    html += `<div class="m-field"><div class="m-label">Link color</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">
      <label style="display:flex;align-items:center;gap:8px;font-size:12px;color:var(--text2);cursor:pointer">
        <input type="color" value="${d.linksColor}" style="width:32px;height:32px;border:none;padding:0;cursor:pointer;border-radius:6px;background:none" onchange="modalUpdateProp('linksColor',this.value)">
        <span>Choose custom color</span>
      </label>
    </div></div>`;
    html += `<div class="m-row2"><div class="m-field"><div class="m-label">Font size (px)</div><input type="number" class="m-input" value="${d.linksSize}" oninput="modalUpdateProp('linksSize',parseInt(this.value))"></div>
    <div class="m-field"><div class="m-label">Formatting</div><div style="display:flex;gap:8px;margin-top:4px">
      <label style="display:flex;align-items:center;gap:4px;font-size:12px;cursor:pointer">
        <input type="checkbox" ${d.linksBold ? 'checked' : ''} onchange="modalUpdateProp('linksBold',this.checked)"> Bold
      </label>
      <label style="display:flex;align-items:center;gap:4px;font-size:12px;cursor:pointer">
        <input type="checkbox" ${d.linksItalic ? 'checked' : ''} onchange="modalUpdateProp('linksItalic',this.checked)"> Italic
      </label>
    </div></div></div>`;
  }
  if (type === 'abouthighlights') {
    html += `<div class="prop-section">Layout & Columns</div>`;
    html += `<div class="m-field"><div class="m-label">Column Ratio</div><div style="display:flex;gap:6px;margin-top:4px">
      ${['50-50', '60-40', '40-60', '70-30', '30-70'].map(v => `<button class="pos-btn${d.colWidth === v ? ' active' : ''}" onclick="modalUpdateProp('colWidth','${v}')" style="padding:6px 14px">${v}</button>`).join('')}
    </div></div>`;
    html += `<div class="m-field"><div class="m-label">Vertical Alignment</div><div style="display:flex;gap:6px;margin-top:4px">
      ${['top', 'center'].map(v => `<button class="pos-btn${d.alignItems === v ? ' active' : ''}" onclick="modalUpdateProp('alignItems','${v}')" style="padding:6px 14px">${v.charAt(0).toUpperCase() + v.slice(1)}</button>`).join('')}
    </div></div>`;

    html += `<div class="prop-section">Colors (Left Column)</div>`;
    html += `<div class="m-row2">
      <div class="m-field"><div class="m-label">Background</div><input type="color" value="${d.leftBg}" onchange="modalUpdateProp('leftBg',this.value)" style="width:100%;height:35px;border:none;padding:0;background:none;cursor:pointer"></div>
      <div class="m-field"><div class="m-label">Text Color</div><input type="color" value="${d.textColorLeft}" onchange="modalUpdateProp('textColorLeft',this.value)" style="width:100%;height:35px;border:none;padding:0;background:none;cursor:pointer"></div>
    </div>`;

    html += `<div class="prop-section">Colors (Right Column)</div>`;
    html += `<div class="m-row2">
      <div class="m-field"><div class="m-label">Background</div><input type="color" value="${d.rightBg}" onchange="modalUpdateProp('rightBg',this.value)" style="width:100%;height:35px;border:none;padding:0;background:none;cursor:pointer"></div>
      <div class="m-field"><div class="m-label">Text Color</div><input type="color" value="${d.textColorRight}" onchange="modalUpdateProp('textColorRight',this.value)" style="width:100%;height:35px;border:none;padding:0;background:none;cursor:pointer"></div>
    </div>`;

    html += `<div class="prop-section">Button & Icons</div>`;
    html += `<div class="m-row3" style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
      <div class="m-field"><div class="m-label">Btn Bg</div><input type="color" value="${d.btnBg}" onchange="modalUpdateProp('btnBg',this.value)" style="width:100%;height:35px;border:none;padding:0;background:none;cursor:pointer"></div>
      <div class="m-field"><div class="m-label">Btn Text</div><input type="color" value="${d.btnTextColor}" onchange="modalUpdateProp('btnTextColor',this.value)" style="width:100%;height:35px;border:none;padding:0;background:none;cursor:pointer"></div>
      <div class="m-field"><div class="m-label">Icon</div><input type="color" value="${d.iconColor}" onchange="modalUpdateProp('iconColor',this.value)" style="width:100%;height:35px;border:none;padding:0;background:none;cursor:pointer"></div>
    </div>`;
  }
  if (type === 'testimonial' || type === 'clientslider') {
    if (type === 'testimonial') {
      html += `<div class="prop-section">Display Options</div>`;
      html += `<div class="m-row2">
        <div class="m-field">
          <div class="m-label">Show Role</div>
          <select class="m-input" onchange="modalUpdateProp('showRole', this.value === 'true')">
            <option value="true" ${d.showRole !== false ? 'selected' : ''}>Yes (Show)</option>
            <option value="false" ${d.showRole === false ? 'selected' : ''}>No (Hide)</option>
          </select>
        </div>
        <div class="m-field">
          <div class="m-label">Italic Quotes</div>
          <select class="m-input" onchange="modalUpdateProp('italicQuote', this.value === 'true')">
            <option value="true" ${d.italicQuote !== false ? 'selected' : ''}>Yes (Italic)</option>
            <option value="false" ${d.italicQuote === false ? 'selected' : ''}>No (Normal)</option>
          </select>
        </div>
      </div>`;
    }
    html += `<div class="prop-section">Navigation Settings</div>`;
    html += `<div class="m-row2">
      <div class="m-field"><div class="m-label">Navigation Controls</div>
        <select class="m-input" onchange="modalUpdateProp('navType', this.value)">
          <option value="both" ${(d.navType || 'both') === 'both' ? 'selected' : ''}>Arrows & Dots</option>
          <option value="dots" ${d.navType === 'dots' ? 'selected' : ''}>Dots Only</option>
          <option value="arrows" ${d.navType === 'arrows' ? 'selected' : ''}>Arrows Only</option>
        </select>
      </div>
      <div class="m-field"><div class="m-label">Auto Scroll</div>
        <select class="m-input" onchange="modalUpdateProp('autoScroll', this.value === 'true')">
          <option value="true" ${d.autoScroll !== false ? 'selected' : ''}>Enabled</option>
          <option value="false" ${d.autoScroll === false ? 'selected' : ''}>Disabled</option>
        </select>
      </div>
    </div>`;
  }
  if (!html) html = '<p style="color:var(--text2);font-size:13px">No style options for this component.</p>';
  return html;
}

function renderSchemaTab(type) {
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

function getSchemaForType(type) {
  const schemas = {
    gridimgtext: `<span class="scm">-- Table: GridImageText (one row per section)</span>
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
    imgtext: `<span class="scm">-- Table: ImageText</span>
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
    hero: `<span class="scm">-- Table: Hero</span>
<span class="sk">CREATE TABLE</span> <span class="sc">Hero</span> (
  id              <span class="sv">INT PRIMARY KEY</span>,
  pageId          <span class="sv">INT NOT NULL</span>,
  componentOrder  <span class="sv">INT NOT NULL</span>,
  heading         <span class="sv">VARCHAR(255)</span>,
  subtext         <span class="sv">TEXT</span>,
  btnText         <span class="sv">VARCHAR(80)</span>,
  bg              <span class="sv">VARCHAR(20)</span>
);`,
    gridimgtextrow: `<span class="scm">-- Table: GridImgTextRow (one row per section)</span>
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
    features: `<span class="scm">-- Table: FeaturesSection + FeatureItem</span>
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
);`,
    testimonial: `<span class="scm">-- Table: TestimonialSection + TestimonialItem</span>
<span class="sk">CREATE TABLE</span> <span class="sc">TestimonialSection</span> (
  id              <span class="sv">INT PRIMARY KEY</span>,
  pageId          <span class="sv">INT NOT NULL</span>,
  componentOrder  <span class="sv">INT NOT NULL</span>,
  heading         <span class="sv">VARCHAR(255)</span>,
  paddingV        <span class="sv">INT DEFAULT 80</span>,
  bg              <span class="sv">VARCHAR(20)</span>
);
<span class="sk">CREATE TABLE</span> <span class="sc">TestimonialItem</span> (
  id              <span class="sv">INT PRIMARY KEY</span>,
  sectionId       <span class="sv">INT NOT NULL</span>,
  itemOrder       <span class="sv">INT NOT NULL</span>,
  author          <span class="sv">VARCHAR(100)</span>,
  role            <span class="sv">VARCHAR(100)</span>,
  quote           <span class="sv">TEXT</span>,
  rating          <span class="sv">INT DEFAULT 5</span>,
  imgSrc          <span class="sv">VARCHAR(512)</span>
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

function modalUpdateProp(key, value, skipModalRender = true) {
  if (!activeModalBlock) return;
  activeModalBlock.data[key] = value;
  rebuildBlock(activeModalBlock); render();
  if (!skipModalRender) renderModalBody();
}

function updateImgPreview(input, idx) {
  const itemImg = input.closest('.m-list-item').querySelector('.item-img');
  if (!itemImg) return;
  const val = input.value.trim();
  if (val) {
    itemImg.innerHTML = `<img src="${val}">`;
  } else {
    // Determine placeholder based on context
    const isRow = input.closest('.m-list-item').innerHTML.includes('gr-btn') || activeModalBlock.type === 'gridimgtextrow';
    itemImg.innerHTML = isRow ? '&#128444;' : '🖼';
  }
}

function updateListItem(type, idx, key, value) {
  if (!activeModalBlock) return;
  activeModalBlock.data.items[idx][key] = value;
  rebuildBlock(activeModalBlock); render();
}

function removeListItem(idx) {
  if (!activeModalBlock) return;
  activeModalBlock.data.items.splice(idx, 1);
  rebuildBlock(activeModalBlock); render(); renderModalBody();
}

function addListItem(type) {
  if (!activeModalBlock) return;
  if (type === 'gridimgtext') activeModalBlock.data.items.push({ title: 'New card', desc: 'Description here.', tag: 'Tag', imgSrc: '' });
  else if (type === 'gridimgtextrow') activeModalBlock.data.items.push({ title: 'New card', desc: 'Description here.', tag: 'Tag', btnText: 'Learn more', imgSrc: '' });
  else if (type === 'footer') activeModalBlock.data.items.push({ label: 'New link', slug: '#' });
  else if (type === 'abouthighlights') { if (!activeModalBlock.data.items) activeModalBlock.data.items = []; activeModalBlock.data.items.push({ icon: '★', title: 'New highlight', desc: 'Description text.' }); }
  else if (type === 'servicegrid') { if (!activeModalBlock.data.items) activeModalBlock.data.items = []; activeModalBlock.data.items.push({ icon: '★', title: 'New service' }); }
  else if (type === 'logoslider') { if (!activeModalBlock.data.items) activeModalBlock.data.items = []; activeModalBlock.data.items.push({ name: 'New Partner', imgSrc: 'https://via.placeholder.com/150x80?text=Logo', link: '#' }); }
  else if (type === 'testimonial') { if (!activeModalBlock.data.items) activeModalBlock.data.items = []; activeModalBlock.data.items.push({ author: 'New Author', role: 'Customer', quote: 'Great service!', rating: 5, imgSrc: '' }); }
  else if (type === 'clientslider') { if (!activeModalBlock.data.items) activeModalBlock.data.items = []; activeModalBlock.data.items.push({ imgSrc: '' }); }
  else if (type === 'locations') { if (!activeModalBlock.data.items) activeModalBlock.data.items = []; activeModalBlock.data.items.push({ title: 'New Location', address: '', mapEmbed: '', phone: '', email: '' }); }
  else if (type === 'heroslider') { if (!activeModalBlock.data.items) activeModalBlock.data.items = []; activeModalBlock.data.items.push({ tagTop: 'NEW TAG', tag: 'NEW', heading: 'New Hero Heading', subtext: 'Description goes here.', bgImage: 'https://alkuwaiti.com/wp-content/uploads/2020/05/Hero-Banner-Placeholder-Dark-1024x480.png' }); }
  rebuildBlock(activeModalBlock); render(); renderModalBody();
}

function saveModal() {
  // sync heading/subtext from modal inputs if present
  if (!activeModalBlock) return;
  const headingEl = document.getElementById('m-heading');
  const subtextEl = document.getElementById('m-subtext');
  const colsEl = document.getElementById('m-cols');
  const logoEl = document.getElementById('m-logo');
  const logoImageEl = document.getElementById('m-logoImage');
  const linksPosEl = document.getElementById('m-linksPos');
  const brandEl = document.getElementById('m-brand');
  const copyEl = document.getElementById('m-copy');

  if (headingEl) activeModalBlock.data.heading = headingEl.value;
  if (subtextEl) activeModalBlock.data.subtext = subtextEl.value;
  if (colsEl) activeModalBlock.data.cols = colsEl.value;
  if (logoEl) activeModalBlock.data.logo = logoEl.value;
  if (logoImageEl) activeModalBlock.data.logoImage = logoImageEl.value;
  if (linksPosEl) activeModalBlock.data.linksPos = linksPosEl.value;
  if (brandEl) activeModalBlock.data.brand = brandEl.value;
  if (copyEl) activeModalBlock.data.copy = copyEl.value;

  const ahSubheading = document.getElementById('m-subheading');
  const ahBody = document.getElementById('m-body');
  const ahBtnText = document.getElementById('m-btnText');
  const ahBtnLink = document.getElementById('m-btnLink');
  if (ahSubheading) activeModalBlock.data.subheading = ahSubheading.value;
  if (ahBody) activeModalBlock.data.body = ahBody.value;
  if (ahBtnText) activeModalBlock.data.btnText = ahBtnText.value;
  if (ahBtnLink) activeModalBlock.data.btnLink = ahBtnLink.value;

  rebuildBlock(activeModalBlock); render();
  if (selectedId === activeModalBlock.id) renderProps(activeModalBlock);
  closeModal();
}

// ──────────────────────────────────────────────────
//  EXPORT / SAVE
// ──────────────────────────────────────────────────
async function savePageData() {
  if (!currentPageId) return;
  const page = currentPage();
  const saveBtn = document.querySelector('.tb-btn.primary');
  const originalText = saveBtn.textContent;

  saveBtn.textContent = 'Saving...';
  saveBtn.disabled = true;

  const outputBlocks = page.blocks.map((b, i) => ({
    type: b.type,
    data: b.data
  }));

  try {
    const res = await fetch(`/api/pages/${page.id}/blocks`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(outputBlocks)
    });
    if (res.ok) {
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
  } catch (e) {
    console.error(e);
    alert('Failed to save: ' + e);
    saveBtn.textContent = originalText;
    saveBtn.disabled = false;
  }
}

function previewPage() {
  const p = currentPage();
  if (!p) return;
  window.open(`/page/${p.slug}`, '_blank');
}

function exportHTML() {
  alert("Export HTML is now handled by the server rendering. Please see Preview.");
}

// ──────────────────────────────────────────────────
//  INIT
// ──────────────────────────────────────────────────
loadPages();
document.getElementById('pm-name-input').addEventListener('keydown', e => { if (e.key === 'Enter') createPage(); });
document.getElementById('modal-overlay').addEventListener('click', e => { if (e.target === document.getElementById('modal-overlay')) closeModal(); });
document.getElementById('page-modal').addEventListener('click', e => { if (e.target === document.getElementById('page-modal')) document.getElementById('page-modal').classList.remove('open'); });

function renderLocationsForm(d) {
  let html = `<div class="m-field"><div class="m-label">Section Heading</div><input class="m-input" id="m-heading" value="${d.heading}" oninput="modalUpdateProp('heading',this.value)"></div>`;
  html += `<div class="m-label" style="margin-bottom:8px">Locations <span class="m-badge">list</span></div>`;
  html += `<div class="m-list" id="m-locations-list">`;
  (d.items || []).forEach((it, i) => {
    html += `<div class="m-list-item">
      <div class="item-num">${i + 1}</div>
      <div class="item-inputs">
        <input placeholder="Location Title" value="${it.title || ''}" oninput="updateListItem('locations',${i},'title',this.value)" style="grid-column:span 2">
        <input placeholder="Full Address" value="${it.address || ''}" oninput="updateListItem('locations',${i},'address',this.value)" style="grid-column:span 2">
        <input placeholder="Google Maps Embed URL (iframe src)" value="${it.mapEmbed || ''}" oninput="updateListItem('locations',${i},'mapEmbed',this.value)" style="grid-column:span 2">
        <input placeholder="Phone" value="${it.phone || ''}" oninput="updateListItem('locations',${i},'phone',this.value)">
        <input placeholder="Email" value="${it.email || ''}" oninput="updateListItem('locations',${i},'email',this.value)">
        <input placeholder="Fax" value="${it.fax || ''}" oninput="updateListItem('locations',${i},'fax',this.value)">
        <input placeholder="Toll Free" value="${it.tollFree || ''}" oninput="updateListItem('locations',${i},'tollFree',this.value)">
      </div>
      <button style="border:none;background:none;cursor:pointer;color:var(--text3);font-size:14px;padding:2px" onclick="removeListItem(${i})">✕</button>
    </div>`;
  });
  html += `</div><button class="m-add-btn" onclick="addListItem('locations')">+ Add location</button>`;
  return html;
}

// ──────────────────────────────────────────────────
//  NAV MENU MANAGER
// ──────────────────────────────────────────────────
function renderNavMenuManager() {
  const container = document.getElementById('nav-items-list');
  if (!container) return;

  container.innerHTML = pages.map(p => `
    <div style="display:flex; align-items:center; justify-content:space-between; padding:4px 0; border-bottom:1px solid #f1f5f9;">
      <span style="font-size:12px; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:140px;">${p.name}</span>
      <input type="checkbox" ${p.showInMenu !== false ? 'checked' : ''} 
             onchange="togglePageInMenu(${p.id}, this.checked)"
             style="cursor:pointer;">
    </div>
  `).join('');
}

async function togglePageInMenu(pageId, show) {
  try {
    const res = await fetch(`/api/pages/${pageId}/toggle-nav`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(show)
    });

    if (res.ok) {
      const page = pages.find(p => p.id === pageId);
      if (page) page.showInMenu = show;
      render(); // Refresh navbar in canvas
    } else {
      alert("Failed to update navigation menu.");
    }
  } catch (e) {
    console.error(e);
  }
}

function renderHeroSliderForm(d) {
  let html = '<div class="m-items-list">';
  (d.items || []).forEach((it, i) => {
    html += `<div class="m-list-item" style="background:var(--surface); border:1px solid var(--border); border-radius:8px; padding:15px; margin-bottom:15px; position:relative;">
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div style="grid-column: span 2">
            <label style="font-size:11px; color:var(--text3); display:block; margin-bottom:4px;">Background Image URL</label>
            <div style="display:flex; gap:8px;">
                <input class="m-input" placeholder="Background Image URL" value="${it.bgImage || ''}" oninput="updateListItem('heroslider',${i},'bgImage',this.value)" style="flex:1">
            </div>
        </div>
        <div style="grid-column: span 2">
            <label style="font-size:11px; color:var(--text3); display:block; margin-bottom:4px;">Main Heading</label>
            <input class="m-input" placeholder="Main Heading" value="${(it.heading || '').replace(/"/g, '&quot;')}" oninput="updateListItem('heroslider',${i},'heading',this.value)">
        </div>
        <div>
            <label style="font-size:11px; color:var(--text3); display:block; margin-bottom:4px;">Top Tag (Above Title)</label>
            <input class="m-input" placeholder="Top Tag" value="${it.tagTop || ''}" oninput="updateListItem('heroslider',${i},'tagTop',this.value)">
        </div>
        <div>
            <label style="font-size:11px; color:var(--text3); display:block; margin-bottom:4px;">Small Tag (Below Title)</label>
            <input class="m-input" placeholder="Small Tag" value="${it.tag || ''}" oninput="updateListItem('heroslider',${i},'tag',this.value)">
        </div>
        <div style="grid-column: span 2">
            <label style="font-size:11px; color:var(--text3); display:block; margin-bottom:4px;">Description / Subtext</label>
            <textarea class="m-input" placeholder="Description / Subtext" oninput="updateListItem('heroslider',${i},'subtext',this.value)" style="height:60px; font-size:13px">${it.subtext || ''}</textarea>
        </div>
      </div>
      <button style="position:absolute; top:10px; right:10px; border:none; background:rgba(255,0,0,0.1); color:var(--red); cursor:pointer; width:22px; height:22px; border-radius:4px; font-size:12px;" onclick="removeListItem(${i})">✕</button>
    </div>`;
  });
  html += `</div><button class="m-add-btn" onclick="addListItem('heroslider')">+ Add new slide</button>`;
  return html;
}
