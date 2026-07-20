(function(){
  'use strict';

  const state = {
    roster: Object.create(null),
    styles: Object.create(null),
    restoring: false
  };

  function currentPage(){
    try { return typeof page === 'string' ? page : 'characters'; }
    catch (_) { return 'characters'; }
  }
  function currentChar(){
    try { return typeof selectedChar !== 'undefined' ? selectedChar : null; }
    catch (_) { return null; }
  }
  function currentStyle(){
    try { return typeof selectedStyle !== 'undefined' ? selectedStyle : null; }
    catch (_) { return null; }
  }
  function keyForRoster(){ return currentPage(); }
  function keyForStyles(charId){ return currentPage() + ':' + (charId || ''); }
  function y(){ return Math.max(0, window.scrollY || document.documentElement.scrollTop || 0); }

  function jumpTo(top){
    const target = Math.max(0, Number(top) || 0);
    state.restoring = true;
    const apply = function(){
      window.scrollTo({top:target,left:0,behavior:'auto'});
      document.documentElement.scrollTop = target;
      document.body.scrollTop = target;
    };
    apply();
    requestAnimationFrame(function(){
      apply();
      requestAnimationFrame(function(){
        apply();
        setTimeout(function(){ apply(); state.restoring=false; }, 40);
      });
    });
  }

  function renderAndRestore(top){
    try { window.__keepScroll = true; } catch (_) {}
    if(typeof render === 'function') render();
    jumpTo(top);
  }

  function wrapNavigationFunctions(){
    if(typeof window.selectChar === 'function' && !window.selectChar.__v385){
      const original = window.selectChar;
      const wrapped = function(id){
        state.roster[keyForRoster()] = y();
        const result = original.apply(this, arguments);
        jumpTo(0);
        return result;
      };
      wrapped.__v385 = true;
      window.selectChar = wrapped;
      try { selectChar = wrapped; } catch (_) {}
    }
    if(typeof window.selectStyle === 'function' && !window.selectStyle.__v385){
      const original = window.selectStyle;
      const wrapped = function(styleId){
        state.styles[keyForStyles(currentChar())] = y();
        const result = original.apply(this, arguments);
        jumpTo(0);
        return result;
      };
      wrapped.__v385 = true;
      window.selectStyle = wrapped;
      try { selectStyle = wrapped; } catch (_) {}
    }
  }

  function handleBack(ev){
    const button = ev.target.closest('.back');
    if(!button) return;
    /* Les builds communautaires gèrent eux-mêmes leur retour vers la liste des personnages. */
    if(button.hasAttribute('data-cb-builds-back')) return;

    const charId = currentChar();
    const styleId = currentStyle();
    if(!charId) return; // Let non-character back buttons keep their normal behavior.

    ev.preventDefault();
    ev.stopImmediatePropagation();
    ev.stopPropagation();

    let styleCount = 0;
    try {
      const c = Array.isArray(characters) ? characters.find(function(x){return x.id===charId;}) : null;
      styleCount = c && Array.isArray(c.styles) ? c.styles.length : 0;
    } catch (_) {}

    if(styleId && styleCount > 1){
      try { selectedStyle = null; } catch (_) {}
      renderAndRestore(state.styles[keyForStyles(charId)] || 0);
      return;
    }

    try { selectedStyle = null; } catch (_) {}
    try { selectedChar = null; } catch (_) {}
    try { selectedCostume = null; } catch (_) {}
    try { if(typeof selectedCostumeSlot !== 'undefined') selectedCostumeSlot = null; } catch (_) {}
    renderAndRestore(state.roster[keyForRoster()] || 0);
  }

  /* Window capture runs before the older document capture handler and the inline onclick. */
  window.addEventListener('click', handleBack, true);

  /* Rebind after scripts that rebuild or replace navigation functions. */
  function refresh(){ wrapNavigationFunctions(); }
  refresh();
  window.addEventListener('load', refresh, {once:true});
  const observer = new MutationObserver(function(){ requestAnimationFrame(refresh); });
  observer.observe(document.documentElement, {childList:true,subtree:true});
})();
