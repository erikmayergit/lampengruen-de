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
