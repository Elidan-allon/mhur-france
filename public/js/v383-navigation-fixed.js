(function(){
'use strict';

const state = {
  characterListY: 0,
  styleListY: Object.create(null),
  restoring: false
};

function instantScroll(y){
  const top = Math.max(0, Number(y) || 0);
  state.restoring = true;
  window.__keepScroll = true;
  // Plusieurs passes : le contenu et les images peuvent modifier la hauteur juste après render().
  window.scrollTo(0, top);
  requestAnimationFrame(()=>{
    window.scrollTo(0, top);
    requestAnimationFrame(()=>{
      window.scrollTo(0, top);
      state.restoring = false;
      window.__keepScroll = false;
    });
  });
}

function openAtTop(){
  state.restoring = true;
  window.__keepScroll = true;
  window.scrollTo(0, 0);
  requestAnimationFrame(()=>{
    window.scrollTo(0, 0);
    requestAnimationFrame(()=>{
      window.scrollTo(0, 0);
      state.restoring = false;
      window.__keepScroll = false;
    });
  });
}

function installNavigationWrappers(){
  const originalChar = window.selectChar;
  if(typeof originalChar === 'function' && !originalChar.__v383){
    const wrapped = function(id){
      // On mémorise la position uniquement depuis la liste générale.
      if(typeof selectedChar !== 'undefined' && !selectedChar){
        state.characterListY = window.scrollY;
      }
      const result = originalChar.apply(this, arguments);
      openAtTop();
      return result;
    };
    wrapped.__v383 = true;
    window.selectChar = wrapped;
  }

  const originalStyle = window.selectStyle;
  if(typeof originalStyle === 'function' && !originalStyle.__v383){
    const wrapped = function(style){
      const charId = typeof selectedChar !== 'undefined' ? selectedChar : '';
      if(charId) state.styleListY[charId] = window.scrollY;
      const result = originalStyle.apply(this, arguments);
      openAtTop();
      return result;
    };
    wrapped.__v383 = true;
    window.selectStyle = wrapped;
  }
}

function characterBack(){
  if(typeof page === 'undefined' || page !== 'characters') return false;

  if(typeof selectedStyle !== 'undefined' && selectedStyle){
    const charId = selectedChar;
    selectedStyle = null;
    window.__keepScroll = true;
    render();
    instantScroll(state.styleListY[charId] || 0);
    return true;
  }

  if(typeof selectedChar !== 'undefined' && selectedChar){
    selectedChar = null;
    selectedStyle = null;
    window.__keepScroll = true;
    render();
    instantScroll(state.characterListY || 0);
    return true;
  }
  return false;
}

// Capture avant les anciens onclick inline : un seul système gère le retour.
document.addEventListener('click', function(event){
  const back = event.target.closest('.back');
  if(!back) return;
  if(characterBack()){
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  }
}, true);

// Le menu est épinglé sur ordinateur et ne doit jamais être refermé par go().
function pinDesktopDrawer(){
  const drawer = document.getElementById('drawer');
  if(!drawer) return;
  if(window.matchMedia('(min-width:1000px)').matches) drawer.classList.add('open');
}

const oldLayout = window.layout;
if(typeof oldLayout === 'function' && !oldLayout.__v383){
  const wrappedLayout = function(){
    const result = oldLayout.apply(this, arguments);
    pinDesktopDrawer();
    installNavigationWrappers();
    return result;
  };
  wrappedLayout.__v383 = true;
  window.layout = wrappedLayout;
}

const oldGo = window.go;
if(typeof oldGo === 'function' && !oldGo.__v383){
  const wrappedGo = function(){
    const result = oldGo.apply(this, arguments);
    pinDesktopDrawer();
    return result;
  };
  wrappedGo.__v383 = true;
  window.go = wrappedGo;
}

installNavigationWrappers();
pinDesktopDrawer();
window.addEventListener('resize', pinDesktopDrawer, {passive:true});

// Empêche un ancien script de remettre une position de fiche après le rendu.
const observer = new MutationObserver(()=>{
  pinDesktopDrawer();
  installNavigationWrappers();
});
const app = document.getElementById('app');
if(app) observer.observe(app, {childList:true});
})();
