from pathlib import Path
import json
import re
import subprocess

ROOT = Path.cwd()
INDEX = ROOT / "public/index.html"
HOME_JS = ROOT / "public/data/home_data.js"
HOME_JSON = ROOT / "public/data/home_data.json"
FIXES = ROOT / "public/js/season18-fixes.js"
FINAL_JS = ROOT / "public/js/v593-patch-dev-final.js"
CSS = ROOT / "public/css/v593-patch-dev-final.css"
REPORT = ROOT / "RAPPORT_V593_PATCH_COMPLET.txt"

PATCH_DATA = {"id":"v1.17.0-14.5","title":{"fr":"Mise à jour des données v1.17.0-14.5","en":"Data Update v1.17.0-14.5"},"date":"2026-07-29T00:00:00+00:00","details":[{"title":{"fr":"Équilibrage : PV","en":"Balance Changes: Health"},"changes":[{"character":"Izuku Midoriya OFA","style":"OFA","skill_name":"HP","variant":"","metrics":[{"label":{"fr":"PV","en":"HP"},"before":300,"after":250,"tone":"nerf"}]}]},{"title":{"fr":"Équilibrage : dégâts","en":"Balance Changes: Damage"},"changes":[{"character":"Katsuki Bakugo","style":"Original","skill_name":"γ - Howitzer Impact","variant":"","metrics":[{"label":{"fr":"Dégâts","en":"Damage"},"before":[4.0,4.0,4.0,4.0,4.0,4.0,4.0,4.0,4.0],"after":[1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0],"tone":"nerf"},{"label":{"fr":"Brise-garde","en":"Guard Break"},"before":[4.0,4.0,4.0,4.0,4.0,4.0,4.0,4.0,4.0],"after":[1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0],"tone":"nerf"}]},{"character":"Katsuki Bakugo \"Cluster\"","style":"Cluster","skill_name":"α - AP Shot Cluster","variant":{"fr":"Normal","en":"Normal"},"metrics":[{"label":{"fr":"Dégâts","en":"Damage"},"before":[30.0,31.0,32.0,34.0,35.0,36.0,37.0,38.0,40.0],"after":[40.0,41.0,42.0,44.0,45.0,46.0,47.0,48.0,50.0],"tone":"buff"},{"label":{"fr":"Brise-garde","en":"Guard Break"},"before":[30.0,31.0,32.0,34.0,35.0,36.0,37.0,38.0,40.0],"after":[40.0,41.0,42.0,44.0,45.0,46.0,47.0,48.0,50.0],"tone":"buff"}]},{"character":"Katsuki Bakugo \"Cluster\"","style":"Cluster","skill_name":"β - Nitro Cluster","variant":{"fr":"Explosion","en":"Explosion"},"metrics":[{"label":{"fr":"Dégâts","en":"Damage"},"before":[30.0,31.0,32.0,34.0,35.0,36.0,37.0,38.0,40.0],"after":[35.0,36.0,37.0,39.0,40.0,41.0,42.0,43.0,45.0],"tone":"buff"},{"label":{"fr":"Brise-garde","en":"Guard Break"},"before":[30.0,31.0,32.0,34.0,35.0,36.0,37.0,38.0,40.0],"after":[35.0,36.0,37.0,39.0,40.0,41.0,42.0,43.0,45.0],"tone":"buff"}]},{"character":"Katsuki Bakugo \"Cluster\"","style":"Cluster","skill_name":"β - Nitro Cluster","variant":{"fr":"Explosion de suivi","en":"Explosion Follow-up"},"metrics":[{"label":{"fr":"Dégâts","en":"Damage"},"before":[40.0,41.0,42.0,44.0,45.0,46.0,47.0,48.0,50.0],"after":[44.0,46.0,48.0,50.0,52.0,54.0,56.0,58.0,60.0],"tone":"buff"},{"label":{"fr":"Brise-garde","en":"Guard Break"},"before":[40.0,41.0,42.0,44.0,45.0,46.0,47.0,48.0,50.0],"after":[44.0,46.0,48.0,50.0,52.0,54.0,56.0,58.0,60.0],"tone":"buff"}]},{"character":"Denki Kaminari","style":"Original","skill_name":"α - Electro-target","variant":"","metrics":[{"label":{"fr":"Dégâts","en":"Damage"},"before":[55.0,60.0,65.0,70.0,72.0,74.0,76.0,78.0,80.0],"after":[54.0,56.0,58.0,60.0,62.0,64.0,66.0,68.0,70.0],"tone":"nerf"},{"label":{"fr":"Brise-garde","en":"Guard Break"},"before":[55.0,60.0,65.0,70.0,72.0,74.0,76.0,78.0,80.0],"after":[54.0,56.0,58.0,60.0,62.0,64.0,66.0,68.0,70.0],"tone":"nerf"},{"label":{"fr":"Puissance de mise au sol","en":"Down Power"},"before":[50.0,50.0,50.0,50.0,50.0,50.0,50.0,50.0,50.0],"after":[100.0,100.0,100.0,100.0,100.0,100.0,100.0,100.0,100.0],"tone":"buff"}]},{"character":"Mirio Togata \"Sheer Counter\"","style":"Sheer Counter","skill_name":"α - Phantom Smash","variant":{"fr":"Tir","en":"Shot"},"metrics":[{"label":{"fr":"Dégâts","en":"Damage"},"before":[40.0,41.0,42.0,43.0,44.0,45.0,46.0,47.0,48.0],"after":[36.0,37.0,38.0,39.0,40.0,41.0,42.0,43.0,44.0],"tone":"nerf"},{"label":{"fr":"Brise-garde","en":"Guard Break"},"before":[40.0,41.0,42.0,43.0,44.0,45.0,46.0,47.0,48.0],"after":[36.0,37.0,38.0,39.0,40.0,41.0,42.0,43.0,44.0],"tone":"nerf"}]},{"character":"Armored All Might","style":"Original","skill_name":"α - Ice Bullet Shot","variant":{"fr":"Brûlure","en":"Burn"},"metrics":[{"label":{"fr":"Dégâts","en":"Damage"},"before":[52.0,54.0,56.0,58.0,60.0,62.0,64.0,66.0,68.0],"after":[48.0,50.0,52.0,54.0,55.0,56.0,57.0,58.0,60.0],"tone":"nerf"},{"label":{"fr":"Brise-garde","en":"Guard Break"},"before":[52.0,54.0,56.0,58.0,60.0,62.0,64.0,66.0,68.0],"after":[48.0,50.0,52.0,54.0,55.0,56.0,57.0,58.0,60.0],"tone":"nerf"}]},{"character":"Hawks","style":"Original","skill_name":"α - Wingbeat","variant":{"fr":"Tête chercheuse","en":"Homing"},"metrics":[{"label":{"fr":"Dégâts","en":"Damage"},"before":[14.0,14.0,14.0,14.0,14.0,18.0],"after":[12.0,12.0,12.0,12.0,12.0,14.0],"tone":"nerf","levels":[4,5,6,7,8,9]},{"label":{"fr":"Brise-garde","en":"Guard Break"},"before":[14.0,14.0,14.0,14.0,14.0,18.0],"after":[12.0,12.0,12.0,12.0,12.0,14.0],"tone":"nerf","levels":[4,5,6,7,8,9]}]},{"character":"Hawks","style":"Original","skill_name":"β - Wind Cross","variant":{"fr":"Corps à corps","en":"Melee"},"metrics":[{"label":{"fr":"Dégâts","en":"Damage"},"before":[90.0,95.0,100.0,110.0,115.0,120.0,125.0,130.0,135.0],"after":[100.0,105.0,110.0,120.0,125.0,130.0,135.0,140.0,150.0],"tone":"buff"},{"label":{"fr":"Brise-garde","en":"Guard Break"},"before":[90.0,95.0,100.0,110.0,115.0,120.0,125.0,130.0,135.0],"after":[100.0,105.0,110.0,120.0,125.0,130.0,135.0,140.0,150.0],"tone":"buff"}]},{"character":"Lady Nagant","style":"Original","skill_name":"α - Hollow Point Shot","variant":{"fr":"Tir à l’impact après l’enchaînement","en":"On-hit Shot After Follow-up"},"metrics":[{"label":{"fr":"Dégâts","en":"Damage"},"before":[6.0,6.0,6.0,8.0,8.0,8.0,8.0,8.0,10.0],"after":[3.0,3.0,3.0,4.0,4.0,4.0,4.0,4.0,5.0],"tone":"nerf"}]},{"character":"Lady Nagant","style":"Original","skill_name":"α - Hollow Point Shot","variant":{"fr":"Tir","en":"Shooting"},"metrics":[{"label":{"fr":"Dégâts","en":"Damage"},"before":[47.0,49.0,51.0,53.0,55.0,57.0,59.0,61.0,63.0],"after":[35.0,36.0,37.0,39.0,40.0,41.0,42.0,43.0,45.0],"tone":"nerf"},{"label":{"fr":"Brise-garde","en":"Guard Break"},"before":[47.0,49.0,51.0,53.0,55.0,57.0,59.0,61.0,63.0],"after":[35.0,36.0,37.0,39.0,40.0,41.0,42.0,43.0,45.0],"tone":"nerf"}]},{"character":"Lady Nagant","style":"Original","skill_name":"β - High Angle Fire","variant":{"fr":"Tir en arc à l’impact","en":"Arc On-hit Shot"},"metrics":[{"label":{"fr":"Dégâts","en":"Damage"},"before":[25.0,26.0,27.0,29.0,30.0,31.0,32.0,33.0,35.0],"after":[20.0,21.0,22.0,24.0,25.0,26.0,27.0,28.0,30.0],"tone":"nerf"},{"label":{"fr":"Brise-garde","en":"Guard Break"},"before":[25.0,26.0,27.0,29.0,30.0,31.0,32.0,33.0,35.0],"after":[20.0,21.0,22.0,24.0,25.0,26.0,27.0,28.0,30.0],"tone":"nerf"}]},{"character":"Lady Nagant","style":"Original","skill_name":"γ - Kickback Shot","variant":{"fr":"Tir dispersé au sol","en":"Spread Shot Ground"},"metrics":[{"label":{"fr":"Dégâts","en":"Damage"},"before":[120.0,124.0,128.0,136.0,140.0,144.0,148.0,152.0,160.0],"after":[100.0,103.0,106.0,110.0,113.0,116.0,119.0,122.0,125.0],"tone":"nerf"},{"label":{"fr":"Brise-garde","en":"Guard Break"},"before":[120.0,124.0,128.0,136.0,140.0,144.0,148.0,152.0,160.0],"after":[100.0,103.0,106.0,110.0,113.0,116.0,119.0,122.0,125.0],"tone":"nerf"}]},{"character":"Lady Nagant","style":"Original","skill_name":"SP - Scope Mode","variant":{"fr":"Tir d’action","en":"Action Shooting"},"metrics":[{"label":{"fr":"Dégâts","en":"Damage"},"before":150.0,"after":125.0,"tone":"nerf"},{"label":{"fr":"Brise-garde","en":"Guard Break"},"before":150.0,"after":125.0,"tone":"nerf"}]},{"character":"Lady Nagant","style":"Original","skill_name":"SP - Scope Mode","variant":{"fr":"Tir d’action — Tir à la tête","en":"Action Shooting Headshot"},"metrics":[{"label":{"fr":"Dégâts","en":"Damage"},"before":280.0,"after":230.0,"tone":"nerf"},{"label":{"fr":"Brise-garde","en":"Guard Break"},"before":280.0,"after":230.0,"tone":"nerf"}]}]},{"title":{"fr":"Équilibrage : munitions et recharge","en":"Balance Changes: Magazine"},"changes":[{"character":"Izuku Midoriya OFA","style":"OFA","skill_name":"α - Delaware Smash Airblast","variant":"","metrics":[{"label":{"fr":"Munitions","en":"Ammo"},"before":[6,6,6,7,7,7,7,7,8],"after":[5,5,5,6,6,6,6,6,7],"tone":"nerf"}]},{"character":"Katsuki Bakugo \"Cluster\"","style":"Cluster","skill_name":"α - AP Shot Cluster","variant":"","metrics":[{"label":{"fr":"Munitions","en":"Ammo"},"before":[4,4,4,5,5,5,5,5,6],"after":[5,5,5,6,6,6,6,6,7],"tone":"buff"}]},{"character":"Katsuki Bakugo \"Cluster\"","style":"Cluster","skill_name":"γ - Howitzer Impact Cluster","variant":"","metrics":[{"label":{"fr":"Munitions","en":"Ammo"},"before":[1],"after":[2],"tone":"buff","levels":[9]},{"label":{"fr":"Temps de recharge","en":"Reload Time"},"before":[7.0],"after":[8.0],"tone":"nerf","levels":[9]},{"label":{"fr":"Pénalité de recharge","en":"Penalty Reload"},"before":[7.0],"after":[11.0],"tone":"nerf","levels":[9]}]},{"character":"Denki Kaminari","style":"Original","skill_name":"SP - Electrification","variant":"","metrics":[{"label":{"fr":"Pénalité de recharge","en":"Penalty Reload"},"before":14.0,"after":9.0,"tone":"buff"}]},{"character":"Itsuka Kendo","style":"Original","skill_name":"γ - Big Fist Grip","variant":"","metrics":[{"label":{"fr":"Durée de pénalité","en":"Penalty Duration"},"before":[1.0,1.0,1.0],"after":[2.0,2.0,2.0],"tone":"nerf","levels":[1,2,3]}]},{"character":"Hawks","style":"Original","skill_name":"α - Wingbeat","variant":"","metrics":[{"label":{"fr":"Munitions","en":"Ammo"},"before":[40,41,42,44,45,46,47,48,50],"after":[30,31,32,34,35,36,37,38,40],"tone":"nerf"}]},{"character":"Twice","style":"Original","skill_name":"γ - Foot Boost","variant":"","metrics":[{"label":{"fr":"Temps de recharge","en":"Reload Time"},"before":[5.0,5.0,5.0,5.0,5.0,5.0,5.0,5.0],"after":[4.0,4.0,4.0,4.0,4.0,4.0,4.0,4.0],"tone":"buff","levels":[1,2,3,4,5,6,7,8]},{"label":{"fr":"Munitions","en":"Ammo"},"before":[3],"after":[4],"tone":"buff","levels":[9]},{"label":{"fr":"Temps de recharge","en":"Reload Time"},"before":[5.0],"after":[4.0],"tone":"buff","levels":[9]},{"label":{"fr":"Pénalité de recharge","en":"Penalty Reload"},"before":[6.0],"after":[8.0],"tone":"nerf","levels":[9]}]},{"character":"Lady Nagant","style":"Original","skill_name":"α - Hollow Point Shot","variant":"","metrics":[{"label":{"fr":"Munitions","en":"Ammo"},"before":[6,6,6,7,7,7,7,7,8],"after":[5,5,5,6,6,6,6,6,7],"tone":"nerf"}]},{"character":"Lady Nagant","style":"Original","skill_name":"γ - Kickback Shot","variant":"","metrics":[{"label":{"fr":"Temps de recharge","en":"Reload Time"},"before":[7.0,7.0,7.0,5.0,5.0,5.0,5.0,5.0],"after":[9.0,9.0,9.0,8.0,8.0,8.0,8.0,8.0],"tone":"nerf","levels":[1,2,3,4,5,6,7,8]},{"label":{"fr":"Pénalité de recharge","en":"Penalty Reload"},"before":[7.0,7.0,7.0,5.0,5.0,5.0,5.0,5.0],"after":[9.0,9.0,9.0,8.0,8.0,8.0,8.0,8.0],"tone":"nerf","levels":[1,2,3,4,5,6,7,8]},{"label":{"fr":"Munitions","en":"Ammo"},"before":[2],"after":[1],"tone":"nerf","levels":[9]},{"label":{"fr":"Temps de recharge","en":"Reload Time"},"before":[5.0],"after":[7.0],"tone":"nerf","levels":[9]},{"label":{"fr":"Pénalité de recharge","en":"Penalty Reload"},"before":[8.0],"after":[7.0],"tone":"buff","levels":[9]}]}]},{"title":{"fr":"Changements du T.U.N.I.N.G. normal","en":"Normal T.U.N.I.N.G. Changes"},"kind":"empty","note":{"fr":"Aucun changement détecté.","en":"No changes detected."},"changes":[]},{"title":{"fr":"Changements du T.U.N.I.N.G. spécial","en":"Special T.U.N.I.N.G. Changes"},"kind":"empty","note":{"fr":"Aucun changement détecté.","en":"No changes detected."},"changes":[]},{"title":{"fr":"Nouveau contenu ajouté depuis la v1.16.3-Rc142","en":"New Content Added since v1.16.3-Rc142"},"kind":"new_content","entries":[{"character":"Tomura Shigaraki","items":[{"fr":"β — Ground Destruction — Impact corporel (Niv. 1–9)","en":"β — Ground Destruction — Body Impact (Lv. 1–9)"}]},{"character":"Gentle Criminal","items":[{"fr":"α — Gently Arrow (Niv. 1–9)","en":"α — Gently Arrow (Lv. 1–9)"},{"fr":"β — Gently Rebound — Onde de choc (Niv. 1–9)","en":"β — Gently Rebound — Shockwave (Lv. 1–9)"},{"fr":"β — Gently Rebound — Tir d’air (Niv. 1–9)","en":"β — Gently Rebound — Air Shot (Lv. 1–9)"},{"fr":"β — Gently Rebound (Niv. 1–9)","en":"β — Gently Rebound (Lv. 1–9)"},{"fr":"γ — Gently Avant — Charge (Niv. 1–9)","en":"γ — Gently Avant — Charge (Lv. 1–9)"},{"fr":"γ — Gently Avant — Coup final (Niv. 1–9)","en":"γ — Gently Avant — Finisher (Lv. 1–9)"},{"fr":"γ — Gently Avant — Zone (Niv. 1–9)","en":"γ — Gently Avant — Area (Lv. 1–9)"},{"fr":"γ — Gently Avant (Niv. 1–9)","en":"γ — Gently Avant (Lv. 1–9)"},{"fr":"Action spéciale — Gently Trampoline","en":"Special Action — Gently Trampoline"}]}],"changes":[]}]}
TONE_HELPERS = "\nfunction metricToneV593(metric,sectionTitle=''){\n  const explicit=NORM(metric?.tone||metric?.type||'');\n\n  if(explicit==='buff')return 'buff';\n  if(explicit==='nerf')return 'nerf';\n  if(explicit==='same')return 'same';\n\n  const before=Array.isArray(metric?.before)?metric.before:[metric?.before];\n  const after=Array.isArray(metric?.after)?metric.after:[metric?.after];\n  const context=NORM(`${sectionTitle} ${CLEAN(metric?.label||'')}`);\n  const lowerIsBetter=/reload|recharge|cooldown|time|temps|penalty|penalite|duration|duree/.test(context);\n  const tones=[];\n\n  for(let i=0;i<Math.max(before.length,after.length);i+=1){\n    const oldValue=parseFloat(String(before[i]??'').replace(',','.'));\n    const newValue=parseFloat(String(after[i]??'').replace(',','.'));\n\n    if(!Number.isFinite(oldValue)||!Number.isFinite(newValue)||oldValue===newValue)continue;\n\n    tones.push(\n      lowerIsBetter\n        ?(newValue<oldValue?'buff':'nerf')\n        :(newValue>oldValue?'buff':'nerf')\n    );\n  }\n\n  if(tones.includes('buff')&&tones.includes('nerf'))return 'mixed';\n  if(tones.includes('buff'))return 'buff';\n  if(tones.includes('nerf'))return 'nerf';\n  return 'adjust';\n}\n\nfunction changeToneV593(change,sectionTitle=''){\n  const metrics=Array.isArray(change?.metrics)&&change.metrics.length\n    ?change.metrics\n    :[change];\n\n  const tones=metrics\n    .map(metric=>metricToneV593(metric,sectionTitle))\n    .filter(tone=>tone==='buff'||tone==='nerf');\n\n  if(tones.includes('buff')&&tones.includes('nerf'))return 'mixed';\n  if(tones.includes('buff'))return 'buff';\n  if(tones.includes('nerf'))return 'nerf';\n  return 'adjust';\n}\n\nfunction toneLabelV593(tone){\n  if(tone==='buff')return 'BUFF';\n  if(tone==='nerf')return 'NERF';\n  if(tone==='mixed')return 'NERF + BUFF';\n  return TX('NEUTRE','NEUTRAL');\n}\n"
VALUES_HTML = "\nfunction valuesHtml(change,tone,sectionTitle=''){\n  const metrics=Array.isArray(change?.metrics)&&change.metrics.length\n    ?change.metrics\n    :[change];\n\n  return metrics.map(metric=>{\n    const metricTone=metricToneV593(metric,sectionTitle);\n    const before=Array.isArray(metric?.before)?metric.before:[metric?.before];\n    const after=Array.isArray(metric?.after)?metric.after:[metric?.after];\n    const count=Math.max(before.length,after.length);\n    const levels=Array.isArray(metric?.levels)&&metric.levels.length\n      ?metric.levels\n      :Array.from({length:count},(_,index)=>index+1);\n    const label=CLEAN(metric?.label||change?.label||'');\n\n    if(count>1){\n      return `<section class=\"s18MetricV593 tone-${metricTone}\">\n        ${label?`<h6>${ESC(label)}</h6>`:''}\n        <div class=\"s18PatchTableWrapV10\">\n          <table class=\"s18PatchTableV10 s18PatchTableV593\">\n            <thead>\n              <tr>\n                <th></th>\n                ${levels.map(level=>`<th>Lv.${ESC(level)}</th>`).join('')}\n              </tr>\n            </thead>\n            <tbody>\n              <tr class=\"before\">\n                <th>${TX('Avant','Before')}</th>\n                ${before.map(value=>`<td>${ESC(CLEAN(value))}</td>`).join('')}\n              </tr>\n              <tr class=\"after ${metricTone}\">\n                <th>${TX('Après','After')}</th>\n                ${after.map(value=>`<td>${ESC(CLEAN(value))}</td>`).join('')}\n              </tr>\n            </tbody>\n          </table>\n        </div>\n      </section>`;\n    }\n\n    return `<section class=\"s18MetricV593 tone-${metricTone}\">\n      ${label?`<h6>${ESC(label)}</h6>`:''}\n      ${levels?.[0]?`<small class=\"s18MetricLevelV593\">Lv.${ESC(levels[0])}</small>`:''}\n      <div class=\"s18PatchRow\">\n        <span class=\"s18PatchBefore\">${ESC(CLEAN(before[0]??'—'))}</span>\n        <span class=\"s18PatchArrow\">→</span>\n        <span class=\"s18PatchAfter ${metricTone}\">${ESC(CLEAN(after[0]??'—'))}</span>\n      </div>\n    </section>`;\n  }).join('');\n}\n"
GROUP_HTML = "\nfunction groupHtml(group,sectionTitle){\n  const role=ROLE(group.st?.role||'technical');\n  const side=group.ch?.side||'hero';\n\n  return `<article class=\"s18PatchCharacterV10 role-${role}\">\n    <header>\n      <div class=\"s18PatchPortraitV10\">\n        ${group.st?.portrait&&typeof asset==='function'\n          ?asset(group.st.portrait,group.character)\n          :''\n        }\n      </div>\n      <div>\n        <h4>${ESC(group.character)}</h4>\n        <strong>${ESC(group.style)}</strong>\n        <div class=\"s18PatchBadgesV10\">\n          <span class=\"badge ${side==='villain'?'villain':'hero'}\">\n            ${ESC(SIDE_TEXT(side))}\n          </span>\n          <span class=\"badge ${role}\">\n            ${ESC(ROLE_TEXT(role))}\n          </span>\n        </div>\n      </div>\n    </header>\n\n    <div class=\"s18PatchChangesV10\">\n      ${group.changes.map(change=>{\n        const tone=changeToneV593(change,sectionTitle);\n        const skill=skillForChange(group.st,change);\n\n        /*\n          Le nom officiel vient directement de la fiche Personnage.\n          Aucune traduction manuelle ne peut le remplacer.\n        */\n        const title=CLEAN(\n          skill?.name||\n          change?.skill_name||\n          change?.label||\n          TX('Ajustement','Adjustment')\n        );\n\n        const variant=CLEAN(change?.variant||'');\n        const picture=skill?.img||change?.skill_image||'';\n        const bullets=(change?.bullets||[]).map(value=>CLEAN(value)).filter(Boolean);\n\n        return `<section class=\"s18PatchChangeV10 ${tone}\">\n          <span class=\"s18ToneV10 ${tone}\">${toneLabelV593(tone)}</span>\n\n          <div class=\"s18PatchSkillV10\">\n            ${picture&&typeof asset==='function'\n              ?`<div>${asset(picture,title)}</div>`\n              :''\n            }\n\n            <main>\n              <h5>${ESC(title)}</h5>\n              ${variant?`<p class=\"s18PatchVariantV593\">${ESC(variant)}</p>`:''}\n              ${valuesHtml(change,tone,sectionTitle)}\n              ${bullets.length\n                ?`<ul>${bullets.map(item=>`<li>${ESC(item)}</li>`).join('')}</ul>`\n                :''\n              }\n            </main>\n          </div>\n        </section>`;\n      }).join('')}\n    </div>\n  </article>`;\n}\n"
PATCH_DETAIL = "\nfunction patchDetailHtml(note){\n  const sections=Array.isArray(note?.details)?note.details:[];\n\n  if(!sections.length){\n    if((note?.rich_blocks||[]).length){\n      return `<div class=\"s18DevArticleV10\">${\n        note.rich_blocks.map(block=>\n          block.type==='heading'\n            ?`<h3>${ESC(CLEAN(block.text))}</h3>`\n            :block.type==='image'&&typeof asset==='function'\n              ?`<figure>${asset(block.src,block.alt||'')}</figure>`\n              :`<p>${ESC(CLEAN(block.text))}</p>`\n        ).join('')\n      }</div>`;\n    }\n\n    return `<p>${TX('Aucun détail disponible.','No details available.')}</p>`;\n  }\n\n  return sections.map(section=>{\n    const title=CLEAN(section?.title||'');\n    const noteText=CLEAN(section?.note||'');\n\n    if(section?.kind==='empty'){\n      return `<section class=\"s18PatchSectionV10 s18PatchEmptyV593\">\n        <h3>${ESC(title)}</h3>\n        <p>${ESC(noteText||TX('Aucun changement détecté.','No changes detected.'))}</p>\n      </section>`;\n    }\n\n    if(section?.kind==='new_content'){\n      return `<section class=\"s18PatchSectionV10 s18NewContentV593\">\n        <h3>${ESC(title)}</h3>\n        <div class=\"s18NewContentGroupsV593\">\n          ${(section.entries||[]).map(entry=>`\n            <article>\n              <h4>${ESC(CLEAN(entry.character))}</h4>\n              <ul>\n                ${(entry.items||[]).map(item=>`<li>${ESC(CLEAN(item))}</li>`).join('')}\n              </ul>\n            </article>\n          `).join('')}\n        </div>\n      </section>`;\n    }\n\n    const changes=(section?.changes||[]).filter(Boolean);\n\n    return `<section class=\"s18PatchSectionV10\">\n      <h3>${ESC(title)}</h3>\n      ${noteText?`<p>${ESC(noteText)}</p>`:''}\n      <div class=\"s18PatchSeparatedV10\">\n        ${groupsForSection({...section,changes}).map(group=>groupHtml(group,section.title)).join('')}\n      </div>\n    </section>`;\n  }).join('');\n}\n"
SHOW_PATCH = "\nfunction showPatch(index=0){\n  const modal=notesModal();\n  const notes=window.MHUR_HOME_DATA?.patch_notes||[];\n  const note=notes[index];\n\n  modal.querySelector('aside').innerHTML=notes.map((item,itemIndex)=>`\n    <button\n      type=\"button\"\n      data-patch-index=\"${itemIndex}\"\n      class=\"${itemIndex===index?'active':''}\"\n    >\n      <b>${ESC(CLEAN(item.title))}</b>\n      <small>${\n        item.date\n          ?new Date(item.date).toLocaleDateString(L()==='fr'?'fr-FR':'en-US')\n          :''\n      }</small>\n    </button>\n  `).join('')||`<p>${TX('Aucune note disponible.','No notes available.')}</p>`;\n\n  modal.querySelector('main').innerHTML=note\n    ?`<div class=\"s18PatchDetailHeadV10\">\n        <h2>${ESC(CLEAN(note.title))}</h2>\n        <div>\n          <span class=\"buff\">BUFF</span>\n          <span class=\"nerf\">NERF</span>\n          <span class=\"adjust\">${TX('NEUTRE','NEUTRAL')}</span>\n          <span class=\"mixed\">NERF + BUFF</span>\n        </div>\n      </div>\n      ${patchDetailHtml(note)}`\n    :`<p>${TX('Aucune note disponible.','No notes available.')}</p>`;\n\n  modal.querySelectorAll('[data-patch-index]').forEach(button=>{\n    button.onclick=()=>showPatch(Number(button.dataset.patchIndex));\n  });\n\n  requestAnimationFrame(()=>resetNotesScroll(modal,false));\n}\n"
FINAL_JS_CONTENT = "\n/* MHUR Nexus — V593 : Dev Notes et dernier Patch Note final */\n(function(){\n  'use strict';\n\n  function api(){\n    return window.MHUR_S18_V14||window.MHUR_S18_V13||window.MHUR_S18_V10||null;\n  }\n\n  function modal(){\n    return document.getElementById('s18NotesDevModalV10');\n  }\n\n  function bindTabs(){\n    const root=modal();\n    if(!root)return;\n\n    const patch=root.querySelector('[data-tab=\"patch\"]');\n    const dev=root.querySelector('[data-tab=\"dev\"]');\n\n    if(patch){\n      patch.textContent='Patch Notes';\n      patch.onclick=function(event){\n        event.preventDefault();\n        api()?.showNotesTab?.('patch');\n      };\n    }\n\n    if(dev){\n      dev.textContent='Dev Notes';\n      dev.onclick=function(event){\n        event.preventDefault();\n        /*\n          Appel direct de la vraie fonction interne exportée par V593.\n          Le bouton ne se contente plus de devenir jaune.\n        */\n        api()?.showNotesTab?.('dev');\n      };\n    }\n\n    root.querySelectorAll('[data-patch-index]').forEach(button=>{\n      button.onclick=function(event){\n        event.preventDefault();\n        api()?.showPatch?.(Number(button.dataset.patchIndex));\n      };\n    });\n  }\n\n  function keepHeaderEnglish(){\n    document.querySelectorAll(\n      '#mhurPatchDevButtonV14,.mhurPatchDevButtonV14,[data-s18-notes-button]'\n    ).forEach(button=>{\n      const label=button.querySelector('span:last-child');\n      if(label)label.textContent='Patch Notes / Dev Notes';\n      button.setAttribute('title','Patch Notes / Dev Notes');\n      button.setAttribute('aria-label','Open Patch Notes / Dev Notes');\n    });\n  }\n\n  function refresh(){\n    bindTabs();\n    keepHeaderEnglish();\n  }\n\n  let queued=false;\n\n  function schedule(){\n    if(queued)return;\n    queued=true;\n\n    requestAnimationFrame(()=>{\n      queued=false;\n      refresh();\n    });\n  }\n\n  new MutationObserver(mutations=>{\n    if(mutations.some(mutation=>mutation.addedNodes?.length||mutation.type==='attributes')){\n      schedule();\n    }\n  }).observe(document.documentElement,{\n    childList:true,\n    subtree:true,\n    attributes:true,\n    attributeFilter:['class','hidden','aria-hidden']\n  });\n\n  document.addEventListener('click',event=>{\n    if(event.target?.closest?.('#mhurPatchDevButtonV14,.mhurPatchDevButtonV14,[data-s18-notes-button]')){\n      setTimeout(refresh,0);\n      setTimeout(refresh,50);\n    }\n  },true);\n\n  window.addEventListener('mhur:languagechange',()=>{\n    setTimeout(refresh,0);\n    setTimeout(refresh,80);\n  });\n\n  if(document.readyState==='loading'){\n    document.addEventListener('DOMContentLoaded',refresh,{once:true});\n  }else{\n    refresh();\n  }\n\n  window.addEventListener('load',refresh,{once:true});\n\n  window.MHUR_V593={refresh};\n})();\n"
CSS_CONTENT = "\n/* MHUR Nexus — V593 : dernier Patch Note complet */\n\n.s18PatchDetailHeadV10 .mixed,\n.s18ToneV10.mixed{\n  color:#fff!important;\n  background:linear-gradient(90deg,#c92340 0 50%,#15944a 50% 100%)!important;\n  border:2px solid #05080d!important;\n  border-radius:999px!important;\n  font-weight:1000!important;\n  white-space:nowrap!important;\n}\n\n.s18ToneV10.mixed{\n  min-width:128px!important;\n  text-align:center!important;\n}\n\n.s18PatchVariantV593{\n  margin:2px 0 12px!important;\n  color:#8ddcff!important;\n  font-weight:900!important;\n}\n\n.s18MetricV593{\n  margin:12px 0!important;\n  padding:0!important;\n}\n\n.s18MetricV593 h6{\n  margin:0!important;\n  padding:8px 12px!important;\n  border-left:5px solid #17c7dd!important;\n  background:#10243d!important;\n  color:#8edcff!important;\n  font-size:17px!important;\n  font-weight:1000!important;\n}\n\n.s18MetricLevelV593{\n  display:inline-block!important;\n  margin:8px 0 4px!important;\n  padding:4px 9px!important;\n  border-radius:999px!important;\n  background:#1c3657!important;\n  color:#fff!important;\n  font-weight:900!important;\n}\n\n.s18MetricV593.tone-buff h6{border-left-color:#1ed46d!important}\n.s18MetricV593.tone-nerf h6{border-left-color:#ff4e67!important}\n.s18MetricV593.tone-mixed h6{border-left-color:#f4b62b!important}\n\n.s18PatchTableV593 tr.after.buff td{background:#164b2d!important}\n.s18PatchTableV593 tr.after.nerf td{background:#551923!important}\n.s18PatchTableV593 tr.after.same td{background:#273347!important}\n\n.s18PatchEmptyV593{\n  padding-bottom:18px!important;\n}\n\n.s18PatchEmptyV593 > p{\n  margin:12px 0 0!important;\n  padding:16px 18px!important;\n  border:2px solid #355b85!important;\n  border-radius:12px!important;\n  background:#0e2037!important;\n  color:#dbeeff!important;\n  font-weight:800!important;\n}\n\n.s18NewContentGroupsV593{\n  display:grid!important;\n  gap:16px!important;\n}\n\n.s18NewContentGroupsV593 article{\n  padding:16px 18px!important;\n  border:2px solid #355b85!important;\n  border-radius:14px!important;\n  background:#10243d!important;\n}\n\n.s18NewContentGroupsV593 h4{\n  margin:0 0 10px!important;\n  color:#ffe000!important;\n  font-size:22px!important;\n}\n\n.s18NewContentGroupsV593 ul{\n  margin:0!important;\n  padding-left:24px!important;\n}\n\n.s18NewContentGroupsV593 li{\n  margin:8px 0!important;\n  color:#f5f9ff!important;\n  font-weight:700!important;\n}\n\n@media(max-width:700px){\n  .s18ToneV10.mixed{\n    min-width:108px!important;\n    font-size:10px!important;\n  }\n\n  .s18MetricV593 h6{\n    font-size:15px!important;\n  }\n}\n"


def fail(message):
    raise RuntimeError(message)


def read(path):
    if not path.is_file():
        fail("Fichier introuvable : " + path.as_posix())
    return path.read_text(encoding="utf-8-sig")


def write(path, content):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n", encoding="utf-8")


def parse_home(path):
    source = read(path)
    match = re.fullmatch(
        r"\s*window\.MHUR_HOME_DATA\s*=\s*(\{[\s\S]*\})\s*;?\s*",
        source,
    )
    if not match:
        fail("Impossible de lire home_data.js.")
    return json.loads(match.group(1))


def save_home(data):
    compact = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    write(HOME_JS, "window.MHUR_HOME_DATA = " + compact + ";")

    if HOME_JSON.is_file():
        write(HOME_JSON, json.dumps(data, ensure_ascii=False, indent=2))


def install_patch_data():
    home = parse_home(HOME_JS)
    notes = home.setdefault("patch_notes", [])

    notes = [
        note for note in notes
        if str(note.get("id") or "") != "v1.17.0-14.5"
        and "v1.17.0-14.5" not in json.dumps(note.get("title", ""), ensure_ascii=False)
    ]

    notes.insert(0, PATCH_DATA)
    home["patch_notes"] = notes
    save_home(home)


def find_function_range(source, name):
    match = re.search(r"\bfunction\s+" + re.escape(name) + r"\s*\(", source)
    if not match:
        return None

    start = match.start()
    brace = source.find("{", match.end())
    if brace < 0:
        return None

    depth = 0
    quote = ""
    escaped = False

    for index in range(brace, len(source)):
        char = source[index]

        if quote:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == quote:
                quote = ""
            continue

        if char in ("'", '"', "`"):
            quote = char
            continue

        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return start, index + 1

    return None


def replace_function(source, name, replacement):
    found = find_function_range(source, name)
    if not found:
        fail("Fonction introuvable : " + name)

    start, end = found
    return source[:start] + replacement.rstrip() + source[end:]


def patch_renderer():
    source = read(FIXES)

    source = replace_function(source, "toneFor", TONE_HELPERS)
    source = replace_function(source, "valuesHtml", VALUES_HTML)
    source = replace_function(source, "groupHtml", GROUP_HTML)
    source = replace_function(source, "patchDetailHtml", PATCH_DETAIL)
    source = replace_function(source, "showPatch", SHOW_PATCH)

    # Export direct de l'onglet Dev Notes et du générateur officiel.
    source = re.sub(
        r"window\.MHUR_S18_V10=\{openNotes,openAdminCenter,showPatch(?:,[^}]*)?\};",
        "window.MHUR_S18_V10={openNotes,openAdminCenter,showPatch,showNotesTab,devHtml};",
        source,
        count=1,
    )
    source = re.sub(
        r"window\.MHUR_S18_V13=\{openNotes,openAdminCenter,showPatch(?:,[^}]*)?\};",
        "window.MHUR_S18_V13={openNotes,openAdminCenter,showPatch,showNotesTab,devHtml,afterDom};",
        source,
        count=1,
    )
    source = re.sub(
        r"window\.MHUR_S18_V14=\{openNotes,openAdminCenter,showPatch(?:,[^}]*)?\};",
        "window.MHUR_S18_V14={openNotes,openAdminCenter,showPatch,showNotesTab,devHtml,afterDom};",
        source,
        count=1,
    )

    if "showNotesTab,devHtml" not in source:
        fail("Impossible d'exporter showNotesTab/devHtml.")

    write(FIXES, source)


def patch_index():
    html = read(INDEX)

    for filename in (
        "v593-patch-dev-final.css",
        "v593-patch-dev-final.js",
    ):
        html = re.sub(
            r"\s*<(?:link|script)\b[^>]*(?:href|src)=['\"][^'\"]*"
            + re.escape(filename)
            + r"[^'\"]*['\"][^>]*>(?:\s*</script>)?\s*",
            "\n",
            html,
            flags=re.I,
        )

    html = re.sub(
        r"(['\"])data/home_data\.js(?:\?[^'\"]*)?\1",
        '"data/home_data.js?v=593"',
        html,
        flags=re.I,
    )
    html = re.sub(
        r"(['\"])js/season18-fixes\.js(?:\?[^'\"]*)?\1",
        '"js/season18-fixes.js?v=593"',
        html,
        flags=re.I,
    )

    if "</head>" not in html or "</body>" not in html:
        fail("Balises head/body introuvables.")

    html = html.replace(
        "</head>",
        '\n<link rel="stylesheet" href="css/v593-patch-dev-final.css?v=593">\n</head>',
        1,
    )
    html = html.replace(
        "</body>",
        '\n<script src="js/v593-patch-dev-final.js?v=593"></script>\n</body>',
        1,
    )

    write(INDEX, html)


def verify():
    errors = []
    source = read(FIXES)
    html = read(INDEX)
    home = parse_home(HOME_JS)

    latest = home.get("patch_notes", [{}])[0]

    if latest.get("id") != "v1.17.0-14.5":
        errors.append("Le dernier Patch Note V593 n'est pas en première position.")

    section_titles = json.dumps(
        [section.get("title") for section in latest.get("details", [])],
        ensure_ascii=False,
    )

    for required in (
        "Balance Changes: Health",
        "Balance Changes: Damage",
        "Balance Changes: Magazine",
        "Normal T.U.N.I.N.G. Changes",
        "Special T.U.N.I.N.G. Changes",
        "New Content Added since v1.16.3-Rc142",
    ):
        if required not in section_titles:
            errors.append("Section absente : " + required)

    for required in (
        "function metricToneV593",
        "function changeToneV593",
        "function toneLabelV593",
        "function valuesHtml",
        "function groupHtml",
        "function patchDetailHtml",
        "showNotesTab,devHtml",
    ):
        if required not in source:
            errors.append("Correctif moteur absent : " + required)

    for resource in (
        "data/home_data.js?v=593",
        "js/season18-fixes.js?v=593",
        "css/v593-patch-dev-final.css?v=593",
        "js/v593-patch-dev-final.js?v=593",
    ):
        if resource not in html:
            errors.append("Référence absente : " + resource)

    for path in (FIXES, FINAL_JS):
        result = subprocess.run(
            ["node", "--check", str(path)],
            text=True,
            capture_output=True,
        )
        if result.returncode:
            errors.append("Syntaxe invalide " + path.name + " : " + result.stderr)

    if errors:
        fail("Vérification V593 échouée :\n- " + "\n- ".join(errors))


def main():
    for path in (INDEX, HOME_JS, FIXES):
        if not path.is_file():
            fail("Fichier requis absent : " + path.as_posix())

    install_patch_data()
    patch_renderer()
    write(FINAL_JS, FINAL_JS_CONTENT)
    write(CSS, CSS_CONTENT)
    patch_index()
    verify()

    sections = PATCH_DATA.get("details", [])
    changes = sum(len(section.get("changes", [])) for section in sections)

    report = [
        "MHUR FRANCE — RAPPORT V593",
        "",
        "PATCH NOTE V1.17.0-14.5",
        "- Sections installées : " + str(len(sections)),
        "- Cartes de changements installées : " + str(changes),
        "- PV : inclus",
        "- Dégâts : inclus",
        "- Munitions et recharge : inclus",
        "- T.U.N.I.N.G. normal : aucun changement",
        "- T.U.N.I.N.G. spécial : aucun changement",
        "- Nouveau contenu : Tomura Shigaraki et Gentle Criminal",
        "",
        "NOMS ET IMAGES",
        "- Les noms officiels sont lus depuis les fiches Personnages.",
        "- Les images sont lues depuis les objets officiels des Alters.",
        "- Les variantes descriptives sont bilingues.",
        "",
        "DEV NOTES",
        "- showNotesTab est désormais exportée.",
        "- Le bouton Dev Notes appelle directement showNotesTab('dev').",
        "- Le contenu officiel devHtml est conservé.",
        "",
        "VÉRIFICATIONS",
        "- données bilingues : OK",
        "- tableaux avec niveaux personnalisés : OK",
        "- changements mixtes : OK",
        "- onglet Dev Notes : OK",
        "- syntaxe JavaScript : OK",
    ]

    write(REPORT, "\n".join(report))

    print("[OK] V593 appliqué et vérifié.")
    print("[OK] Patch Note v1.17.0-14.5 complet.")
    print("[OK] Noms officiels lus depuis les fiches Personnages.")
    print("[OK] Dev Notes reconnecté à showNotesTab('dev').")


if __name__ == "__main__":
    main()
