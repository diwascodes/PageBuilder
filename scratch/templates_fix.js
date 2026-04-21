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
