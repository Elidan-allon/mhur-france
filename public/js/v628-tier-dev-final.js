/* MHUR Nexus — V628
   - NEW de Gentle en haut à droite.
   - Dev Blog Vol. 27 complet avec liens officiels.
*/
(function(){
  'use strict';

  if(window.MHUR_V628_LOADED)return;
  window.MHUR_V628_LOADED=true;

  let tierQueued=false;
  let devQueued=false;

  function language(){
    return String(
      document.documentElement.lang||
      (typeof lang!=='undefined'?lang:'fr')||
      'fr'
    ).toLowerCase().startsWith('en')
      ?'en'
      :'fr';
  }

  function t(fr,en){
    return language()==='en'?en:fr;
  }

  function normalize(value){
    return String(value||'')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'')
      .toLowerCase();
  }

  /* ===================== TIER LIST ===================== */

  function isGentleCard(card){
    if(!card)return false;

    const text=normalize(card.textContent);
    const image=card.querySelector(':scope > img');
    const alt=normalize(image?.alt);
    const src=normalize(
      image?.currentSrc||
      image?.getAttribute('src')||
      image?.src
    );

    return (
      text.includes('gentle criminal')||
      alt.includes('gentle criminal')||
      src.includes('gentle')
    );
  }

  function removeOldNewBadges(card){
    const selectors=[
      '.mhurNewV582',
      '.s18NewBadge',
      '[class*="s18NewBadge"]',
      '[class*="mhurTierNew"]:not(.mhurTierNewV628)',
      '[aria-label="NEW"]:not(.mhurTierNewV628)',
      'img[src*="new_badge"]:not(.mhurTierNewV628)'
    ].join(',');

    card.querySelectorAll(selectors).forEach(badge=>{
      const parent=badge.parentElement;
      badge.remove();

      if(
        parent&&
        parent!==card&&
        parent.childElementCount===0&&
        !String(parent.textContent||'').trim()
      ){
        parent.remove();
      }
    });
  }

  function repairTier(){
    const tier=document.getElementById('mhurTierList');

    if(!tier)return;

    tier.querySelectorAll('.mhurTierItem').forEach(card=>{
      if(!isGentleCard(card)){
        card.classList.remove('mhurTierGentleV628');
        card.querySelectorAll(
          ':scope > .mhurTierNewV628'
        ).forEach(node=>node.remove());
        return;
      }

      card.classList.add('mhurTierGentleV628');
      removeOldNewBadges(card);

      if(!card.querySelector(':scope > .mhurTierNewV628')){
        const badge=document.createElement('span');
        badge.className='mhurTierNewV628';
        badge.setAttribute('aria-label','NEW');
        badge.textContent='NEW';
        card.appendChild(badge);
      }
    });
  }

  function scheduleTier(){
    if(tierQueued)return;

    tierQueued=true;

    requestAnimationFrame(()=>{
      tierQueued=false;
      repairTier();
    });
  }

  /* ===================== DEV NOTES ===================== */

  function fullDevHtml(){
    const officialDev=
      'https://en.bandainamcoent.eu/my-hero-academia/news/my-hero-ultra-rumble-development-blog-vol-27';

    const officialPatch=
      'https://en.bandainamcoent.eu/my-hero-academia/news/my-hero-ultra-rumble-patch-notes-11700';

    const officialSeason=
      'https://en.bandainamcoent.eu/my-hero-academia/news/my-hero-ultra-rumble-season-18';

    return `<article
      class="mhurV628DevArticle"
      data-v628-full-dev="1"
    >
      <div class="mhurV628DevHero">
        <span>DEV BLOG VOL. 27</span>
        <h2>${t(
          'Notes des développeurs — Saison 18',
          'Developer Notes — Season 18'
        )}</h2>
        <p>
          29/07/2026 · Bandai Namco Entertainment / Byking
        </p>
      </div>

      <section class="mhurV628DevSection">
        <h3>${t(
          'Lancement de la Saison 18 et 20 millions de téléchargements',
          'Season 18 launch and 20 million downloads'
        )}</h3>
        <p>${t(
          "La Saison 18 marque le dépassement des 20 millions de téléchargements de MY HERO ULTRA RUMBLE dans le monde. L'équipe remercie les joueurs qui continuent de soutenir le jeu.",
          'Season 18 begins as MY HERO ULTRA RUMBLE surpasses 20 million downloads worldwide. The development team thanks everyone who continues to play and support the game.'
        )}</p>
        <p>${t(
          'Pour célébrer ce cap, un bonus de connexion spécial de 28 jours est organisé. Quatre costumes commémoratifs reviennent et la campagne permet notamment de récupérer 6 000 Cristaux Héros et 100 Tickets de tirage.',
          'A special 28-day login campaign celebrates the milestone. Four commemorative costumes return, and the campaign includes 6,000 Hero Crystals and 100 Roll Tickets.'
        )}</p>
      </section>

      <section class="mhurV628DevSection">
        <h3>Gentle Criminal & La Brava</h3>
        <p>${t(
          "Gentle Criminal rejoint le jeu comme personnage Technique. Son concept repose sur une grande mobilité et sur l'utilisation de son Alter Élasticité pour bondir à travers la carte et déjouer ses adversaires.",
          'Gentle Criminal joins as a Technical character built around mobility and the use of Elasticity to leap around the stage and outmaneuver opponents.'
        )}</p>
        <p>${t(
          "Sa compétence β rend l'air élastique et forme une barrière capable de dévier les attaques ennemies. Sa compétence γ devient plus puissante lorsqu'elle profite des attaques déviées et peut également créer un trampoline d'air utilisable par Gentle et ses alliés.",
          'His β skill makes the air elastic and forms a barrier that can deflect enemy attacks. His γ skill grows stronger through deflected attacks and can create an air trampoline usable by Gentle and his allies.'
        )}</p>
        <p>${t(
          "La compétence α peut traverser la barrière créée avec β. L'équipe recommande donc de combiner la défense par déviation avec les propres attaques de Gentle.",
          'His α skill can pass through the barrier created by β, encouraging players to combine defensive deflections with Gentle’s own attacks.'
        )}</p>
        <p>${t(
          "La Brava accompagne Gentle grâce à un drone spécial. De nombreuses interactions et lignes de dialogue ont été ajoutées pour mettre en valeur leur relation pendant les combats.",
          'La Brava supports Gentle through a special drone. Numerous interactions and battle lines were added to highlight their relationship.'
        )}</p>
        <p>${t(
          "La deuxième action spéciale, Lover Mode, a reçu un soin particulier. Lorsque la jauge Plus Chaos est pleine, le pouvoir Love de La Brava peut l'activer automatiquement avant que les PV de Gentle n'atteignent zéro. Pendant Plus Chaos, sa puissance d'attaque et sa vitesse de rechargement augmentent davantage et les dialogues du duo changent.",
          'Special attention was given to the second Special Action, Lover Mode. When the Plus Chaos gauge is full, La Brava’s Love can activate it automatically before Gentle reaches zero HP. During Plus Chaos, his attack power and reload speed increase further and the pair receive special dialogue.'
        )}</p>
      </section>

      <section class="mhurV628DevSection">
        <h3>Chaos City Ver. 02</h3>
        <p>${t(
          "Chaos City est rénovée avec une transformation importante du quartier commercial. La surface a été détruite par les attaques des vilains et une nouvelle zone souterraine appelée Tentoin Alley a été ajoutée.",
          'Chaos City is renovated with major changes to the shopping district. The surface has been damaged by Villain attacks, and a new underground area called Tentoin Alley has been added.'
        )}</p>
        <p>${t(
          "Les passages souterrains permettent de rejoindre d'autres zones. Cette nouvelle structure favorise davantage les personnages efficaces au sol et au corps à corps, tout en ouvrant de nouvelles tactiques de déplacement.",
          'Underground passages connect to other areas. The new layout favors ground-based and close-range characters while opening new movement tactics.'
        )}</p>
      </section>

      <section class="mhurV628DevSection">
        <h3>Research Notebook — Mission n° 3</h3>
        <p>${t(
          "Une Mission n° 3 plus difficile est ajoutée pour augmenter la rejouabilité. Les nouveaux objectifs annoncés sont :",
          'A more challenging Mission No. 3 is added to improve replayability. The announced objectives are:'
        )}</p>
        <ul>
          <li>${t(
            'Infliger plus de 10 000 dégâts avec chaque style de combat.',
            'Deal more than 10,000 damage with each Battle Style.'
          )}</li>
          <li>${t(
            'Réaliser plus de 12 K.O. avec chaque style de combat.',
            'Achieve more than 12 K.O.s with each Battle Style.'
          )}</li>
          <li>${t(
            'Infliger plus de 15 000 dégâts au cours d’une seule partie, quel que soit le style.',
            'Deal more than 15,000 damage in one battle, regardless of Battle Style.'
          )}</li>
          <li>${t(
            'Réaliser 16 K.O. au cours d’une seule partie, quel que soit le style.',
            'Achieve 16 K.O.s in one battle, regardless of Battle Style.'
          )}</li>
        </ul>
        <p>${t(
          "Les missions accordent des points permettant d'augmenter le niveau du Research Notebook et d'obtenir notamment des plaques de nom. Le niveau maximum passe de 30 à 200 avec l'ajout des niveaux 31 à 200.",
          'The missions grant points used to raise the Research Notebook level and obtain rewards such as Name Plates. The level cap rises from 30 to 200 with levels 31 through 200 added.'
        )}</p>
        <p>${t(
          'Les nouvelles récompenses comprennent des Tickets de tirage, des objets liés au système T.U.N.I.N.G et des boîtes cadeaux spéciales.',
          'New rewards include Roll Tickets, T.U.N.I.N.G System items, and special Present Boxes.'
        )}</p>
      </section>

      <section class="mhurV628DevSection">
        <h3>3-Pick Battle</h3>
        <p>${t(
          "Un nouveau mode 3-Pick Battle est prévu à partir de la fin du mois d'août. Chaque joueur sélectionne trois styles de combat et la victoire revient au joueur qui inflige le plus de dégâts.",
          'A new 3-Pick Battle mode is planned from late August. Each player selects three Battle Styles, and the player who deals the most damage wins.'
        )}</p>
        <p>${t(
          "Le mode est conçu pour être rapide à comprendre et facile à lancer. Des informations supplémentaires seront publiées sur les réseaux sociaux officiels à l'approche de sa sortie.",
          'The mode is designed to be easy to understand and quick to play. More details will be shared through official social channels closer to release.'
        )}</p>
      </section>

      <div class="mhurV628DevSignature">
        ${t(
          'Merci encore pour votre soutien continu à MY HERO ULTRA RUMBLE. — Yokoyama, producteur de MY HERO ULTRA RUMBLE',
          'Thank you again for your continued support of MY HERO ULTRA RUMBLE. — Yokoyama, Producer of MY HERO ULTRA RUMBLE'
        )}
      </div>

      <div class="mhurV628OfficialLinks">
        <a
          class="mhurV628OfficialLink"
          href="${officialDev}"
          target="_blank"
          rel="noopener noreferrer"
        >
          ${t(
            'Lire la Dev Note officielle complète ↗',
            'Read the full official Dev Note ↗'
          )}
        </a>

        <a
          class="mhurV628OfficialLink"
          href="${officialPatch}"
          target="_blank"
          rel="noopener noreferrer"
        >
          ${t(
            'Voir les Patch Notes officielles 1.17 ↗',
            'View the official 1.17 Patch Notes ↗'
          )}
        </a>

        <a
          class="mhurV628OfficialLink"
          href="${officialSeason}"
          target="_blank"
          rel="noopener noreferrer"
        >
          ${t(
            'Voir la page officielle de la Saison 18 ↗',
            'View the official Season 18 page ↗'
          )}
        </a>
      </div>
    </article>`;
  }

  function devTabIsActive(modal){
    const button=modal?.querySelector('[data-tab="dev"]');

    return Boolean(
      button&&(
        button.classList.contains('active')||
        button.getAttribute('aria-selected')==='true'
      )
    );
  }

  function renderFullDev(){
    const modal=document.getElementById(
      's18NotesDevModalV10'
    );

    if(!modal||!devTabIsActive(modal)){
      modal?.classList.remove('mhurV628DevActive');
      return;
    }

    const main=modal.querySelector(
      '.s18NotesBodyV10 > main'
    );

    const aside=modal.querySelector(
      '.s18NotesBodyV10 > aside'
    );

    if(!main)return;

    modal.classList.add('mhurV628DevActive');

    if(aside){
      aside.innerHTML=`<div class="s18DevSideV10">
        <b>DEV BLOG VOL. 27</b>
        <small>${t('Saison 18','Season 18')}</small>
      </div>`;
    }

    if(!main.querySelector('[data-v628-full-dev="1"]')){
      main.innerHTML=fullDevHtml();
      main.scrollTop=0;
    }
  }

  function scheduleDev(){
    if(devQueued)return;

    devQueued=true;

    requestAnimationFrame(()=>{
      devQueued=false;
      renderFullDev();
    });
  }

  function repairAll(){
    scheduleTier();
    scheduleDev();
  }

  document.addEventListener(
    'click',
    event=>{
      const tab=event.target?.closest?.(
        '#s18NotesDevModalV10 [data-tab]'
      );

      if(tab){
        setTimeout(scheduleDev,0);
        setTimeout(scheduleDev,40);
        setTimeout(scheduleDev,120);
      }

      if(
        event.target?.closest?.(
          '#mhurPatchDevButtonV14,'+
          '.mhurPatchDevButtonV14,'+
          '[data-s18-notes-button]'
        )
      ){
        setTimeout(scheduleDev,80);
      }
    },
    true
  );

  new MutationObserver(mutations=>{
    if(
      mutations.some(mutation=>
        mutation.addedNodes?.length||
        mutation.removedNodes?.length||
        mutation.type==='attributes'
      )
    ){
      repairAll();
    }
  }).observe(document.documentElement,{
    childList:true,
    subtree:true,
    attributes:true,
    attributeFilter:['class','lang']
  });

  if(document.readyState==='loading'){
    document.addEventListener(
      'DOMContentLoaded',
      repairAll,
      {once:true}
    );
  }else{
    repairAll();
  }

  window.addEventListener('load',repairAll,{once:true});
  window.addEventListener('mhur:languagechange',()=>{
    const article=document.querySelector(
      '#s18NotesDevModalV10 [data-v628-full-dev="1"]'
    );

    article?.remove();
    repairAll();
  });

  let attempts=0;
  const retry=setInterval(()=>{
    attempts++;
    repairAll();

    if(attempts>=30){
      clearInterval(retry);
    }
  },200);

  window.MHUR_V628={
    refresh:repairAll,
    refreshTier:scheduleTier,
    refreshDev:scheduleDev
  };
})();
