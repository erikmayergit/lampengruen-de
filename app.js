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

  /* ---- waitlist forms -> beehiiv embed (lazy-loaded on interaction, DSGVO-clean) ----
     Each native .wl-form / .js-wl is swapped for a styled placeholder. beehiiv's
     loader script is injected ONLY when the visitor actually interacts, so no data
     is sent to beehiiv (US) on page load. ---- */
  var BH_FORM='4a433496-2e24-47be-8909-2b1e87341aa7';
  var BH_SRC='https://subscribe-forms.beehiiv.com/v3/loader.js';
  document.querySelectorAll('form.wl-form,form.js-wl').forEach(function(form){
    var wrap=document.createElement('div');
    wrap.className='wl-embed';
    wrap.setAttribute('role','button');
    wrap.setAttribute('tabindex','0');
    wrap.setAttribute('aria-label','Warteliste-Anmeldung öffnen');
    wrap.innerHTML='<div class="wl-embed-fake"><span class="wl-embed-input">deine@email.de</span><span class="btn btn-sun">SAG MIR BESCHEID<span class="arr">→</span></span></div>';
    var loaded=false;
    function load(){
      if(loaded)return;loaded=true;
      wrap.classList.add('loaded');
      wrap.innerHTML='';
      var s=document.createElement('script');
      s.async=true;s.src=BH_SRC;s.setAttribute('data-beehiiv-form',BH_FORM);
      wrap.appendChild(s);
    }
    wrap.addEventListener('click',load);
    wrap.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();load();}});
    if(form.parentNode)form.parentNode.replaceChild(wrap,form);
  });

  /* ============================================================
     EXIT-INTENT POPUP
     Mechanic: problem-select -> reward reveal (beehiiv embed auto-loads).
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

    /* problem-select -> reveal reward + auto-load the embed (user has engaged) */
    overlay.querySelectorAll('.opt').forEach(function(opt){
      opt.addEventListener('click',function(){
        var pick=opt.getAttribute('data-pick')||'';
        var line=overlay.querySelector('.reward .picked');
        if(line&&pick)line.textContent=pick;
        modal.classList.add('revealed');
        var emb=overlay.querySelector('.reward .wl-embed');
        if(emb)setTimeout(function(){if(emb.click)emb.click();},420);
      });
    });
    var decline=overlay.querySelector('.decline');
    if(decline)decline.addEventListener('click',closePopup);
  }
})();
