/* ============================================================
   LAMPENGRÜN — shared behaviour (all pages)
   ============================================================ */
(function(){
  'use strict';

  /* ---- nav scroll state ---- */
  var nav=document.getElementById('nav');
  if(nav){
    var onScroll=function(){nav.classList.toggle('scrolled',window.scrollY>24);};
    onScroll();addEventListener('scroll',onScroll,{passive:true});
  }

  /* ---- reveal on view ---- */
  var io=new IntersectionObserver(function(es){
    es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});
  },{threshold:.14,rootMargin:'0px 0px -8% 0px'});
  document.querySelectorAll('.reveal').forEach(function(el){io.observe(el);});

  /* ---- magnetic buttons ---- */
  document.querySelectorAll('.js-magnetic').forEach(function(btn){
    var s=14;
    btn.addEventListener('pointermove',function(e){
      var r=btn.getBoundingClientRect();
      var x=(e.clientX-r.left-r.width/2)/r.width;
      var y=(e.clientY-r.top-r.height/2)/r.height;
      btn.style.transform='translate('+(x*s)+'px,'+(y*s)+'px)';
    });
    btn.addEventListener('pointerleave',function(){btn.style.transform='';});
  });

  /* ---- mobile menu ---- */
  var mm=document.getElementById('mobileMenu');
  var openBtn=document.getElementById('menuOpen');
  var closeBtn=document.getElementById('menuClose');
  function setMenu(o){if(!mm)return;mm.classList.toggle('open',o);document.body.style.overflow=o?'hidden':'';}
  if(openBtn)openBtn.addEventListener('click',function(){setMenu(true);});
  if(closeBtn)closeBtn.addEventListener('click',function(){setMenu(false);});
  if(mm)mm.querySelectorAll('a').forEach(function(a){a.addEventListener('click',function(){setMenu(false);});});

  /* ---- sticky mobile CTA (show after hero) ---- */
  var sticky=document.getElementById('stickyCta');
  if(sticky){
    addEventListener('scroll',function(){
      sticky.classList.toggle('show',window.scrollY>620);
    },{passive:true});
  }

  /* ---- pre-order -> Stripe Payment Links (LIVE, wired 2026-06-12) ----
     3 Stripe products Solo/Duo/Familie at LIST price (119/149/179 EUR),
     promotion codes ON, Farbe as custom field. The discount happens at
     checkout via codes the customer applies: public Vorbesteller code
     VORFREUDE20 (−20%, Erik decision 2026-06-12) + Botschafter founder
     code (−50% of list, max_redemptions 10). ⚠️ The codes must exist in
     Stripe (Product catalog -> Coupons -> promotion code) with EXACTLY the
     string shown on the site. Renaming = find-replace VORFREUDE20 in
     index.html, produkt/index.html, shop/index.html.
     If a value here is ever not a real https link, pre-order buttons keep
     their waitlist fallback href, so a click never dead-ends. ---- */
  var STRIPE_LINKS={
    solo:'https://buy.stripe.com/9B6fZhc2J1VidpkdYc3ks04',
    duo:'https://buy.stripe.com/5kQbJ12s98jG0Cy5rG3ks05',
    familie:'https://buy.stripe.com/6oU8wPc2JfM8fxs5rG3ks06'
  };
  window.LG_STRIPE=STRIPE_LINKS;
  document.querySelectorAll('[data-preorder-size]').forEach(function(a){
    var url=STRIPE_LINKS[a.getAttribute('data-preorder-size')];
    if(url&&/^https:/.test(url))a.href=url;
  });

  /* ---- waitlist forms -> native submit to Supabase Edge Function (beehiiv) ----
     The site's own styled form posts the email to our EU edge function, which
     subscribes via the beehiiv API server-side. No beehiiv iframe, no Turnstile;
     data only leaves the browser when the visitor actually submits. ---- */
  var SUBSCRIBE_URL='https://ugjlbeekpbaaylavwgai.supabase.co/functions/v1/subscribe';
  var SUCCESS='Fast geschafft 🌱 Bestätige kurz die E-Mail in deinem Postfach — dann sagen wir dir als Erstes Bescheid, sobald wir produzieren :)';
  var valid=function(v){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);};
  document.querySelectorAll('form.wl-form,form.js-wl').forEach(function(form){
    var input=form.querySelector('input[type="email"]');
    var btn=form.querySelector('button[type="submit"]')||form.querySelector('button');
    if(btn)btn.innerHTML='SAG MIR BESCHEID<span class="arr">→</span>';
    var note=form.parentNode.querySelector('.wl-note')||form.querySelector('.wl-note');
    /* honeypot: hidden field; bots fill it, humans never see it */
    var hp=document.createElement('input');
    hp.type='text';hp.name='company';hp.tabIndex=-1;hp.setAttribute('autocomplete','off');hp.setAttribute('aria-hidden','true');
    hp.style.cssText='position:absolute;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none';
    form.appendChild(hp);
    form.addEventListener('submit',function(e){
      e.preventDefault();
      if(!input)return;
      var email=input.value.trim();
      if(note){note.className=note.className.replace(/\b(ok|err)\b/g,'').trim();}
      if(hp.value)return; /* bot filled honeypot -> silently drop */
      if(!valid(email)){
        input.classList.add('err');
        if(note){note.textContent='Bitte gib eine gültige E-Mail ein.';note.classList.add('err');}
        return;
      }
      input.classList.remove('err');
      if(btn)btn.disabled=true;
      if(note){note.textContent='Einen Moment …';}
      fetch(SUBSCRIBE_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:email})})
        .then(function(r){return r.ok?r.json():Promise.reject(r);})
        .then(function(){form.innerHTML='<p class="wl-success">'+SUCCESS+'</p>';})
        .catch(function(){
          if(btn)btn.disabled=false;
          if(note){note.textContent='Hoppla — das hat nicht geklappt. Bitte versuch es gleich noch einmal.';note.classList.add('err');}
        });
    });
  });

  /* ============================================================
     EXIT-INTENT POPUP
     Mechanic: problem-select -> reward reveal (native waitlist form).
     ============================================================ */
  var overlay=document.getElementById('exitPopup');
  if(overlay){
    var modal=overlay.querySelector('.modal');
    var KEY='lg_exit_seen_v2';
    var seen=false;
    try{seen=sessionStorage.getItem(KEY)==='1';}catch(e){}

    function openPopup(){
      if(seen||overlay.classList.contains('open'))return;
      overlay.classList.add('open');
      seen=true;try{sessionStorage.setItem(KEY,'1');}catch(e){}
    }
    function closePopup(){overlay.classList.remove('open');}

    /* desktop: real exit-intent (mouse leaves toward the tab bar) */
    document.addEventListener('mouseout',function(e){
      if(e.clientY<=0 && !e.relatedTarget)openPopup();
    });
    /* mobile/fallback: fire after meaningful scroll depth + dwell */
    var armed=false;
    addEventListener('scroll',function(){
      if(armed)return;
      var d=(window.scrollY+window.innerHeight)/document.body.scrollHeight;
      if(d>0.45){armed=true;setTimeout(openPopup,1200);}
    },{passive:true});

    overlay.addEventListener('click',function(e){if(e.target===overlay)closePopup();});
    var x=overlay.querySelector('.close');if(x)x.addEventListener('click',closePopup);
    document.addEventListener('keydown',function(e){if(e.key==='Escape')closePopup();});

    /* problem-select -> reveal reward, focus the email field */
    overlay.querySelectorAll('.opt').forEach(function(opt){
      opt.addEventListener('click',function(){
        var pick=opt.getAttribute('data-pick')||'';
        var line=overlay.querySelector('.reward .picked');
        if(line&&pick)line.textContent=pick;
        modal.classList.add('revealed');
        var ri=overlay.querySelector('.reward input[type="email"]');
        if(ri)setTimeout(function(){ri.focus();},420);
      });
    });
    var decline=overlay.querySelector('.decline');
    if(decline)decline.addEventListener('click',closePopup);
  }
})();

/* Cookie-Consent + GA4 — loads Google Analytics ONLY after explicit opt-in
   (prior-consent model, DSGVO). No Google request fires before "Akzeptieren". */
(function(){
  var GA_ID='G-HG7CW0QYRL', KEY='lg-consent';
  function loadGA(){
    if(window.__lgGA)return; window.__lgGA=true;
    var s=document.createElement('script'); s.async=true;
    s.src='https://www.googletagmanager.com/gtag/js?id='+GA_ID;
    document.head.appendChild(s);
    window.dataLayer=window.dataLayer||[];
    function gtag(){dataLayer.push(arguments);}
    window.gtag=gtag; gtag('js',new Date()); gtag('config',GA_ID,{anonymize_ip:true});
  }
  var choice=null; try{choice=localStorage.getItem(KEY);}catch(e){}
  if(choice==='granted'){loadGA();return;}
  if(choice==='denied'){return;}
  var b=document.createElement('div');
  b.className='cc-banner'; b.setAttribute('role','dialog'); b.setAttribute('aria-label','Cookie-Einwilligung');
  b.innerHTML='<div class="cc-copy">🍪 Cookie-Hinweis — der einzig ungesunde Teil unserer Seite. Wir züchten frisches Grün, keine Naschereien, aber ein paar anonyme Statistik-Cookies (Google Analytics) helfen uns besser zu werden. Null Kalorien, versprochen. Mehr in der <a href="/datenschutz/">Datenschutzerklärung</a>.</div>'+
    '<div class="cc-actions"><button type="button" class="btn btn-ghost on-dark cc-no">Ablehnen</button><button type="button" class="btn btn-sun cc-yes">Akzeptieren</button></div>';
  function done(v){ try{localStorage.setItem(KEY,v);}catch(e){} if(b&&b.parentNode)b.parentNode.removeChild(b); }
  function mount(){
    document.body.appendChild(b);
    b.querySelector('.cc-yes').addEventListener('click',function(){done('granted');loadGA();});
    b.querySelector('.cc-no').addEventListener('click',function(){done('denied');});
  }
  if(document.body)mount(); else document.addEventListener('DOMContentLoaded',mount);
})();
