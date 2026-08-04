#!/usr/bin/env python3
"""Correctif V652 pour les Patch Notes et les dégâts de Bakugo Cluster.

Le script est volontairement idempotent : il peut être exécuté après chaque
synchronisation UltraRumble sans empiler plusieurs fois le même correctif.
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path

INDEX_PATH = Path("public/index.html")
PATCH_JS_PATH = Path("public/js/season18-fixes.js")


NEW_GROUP_FUNCTIONS = r'''  function remoteAdditionalGroups(remoteSkill){
    const tbl=remoteSkill && remoteSkill.additional_values;
    const rows=getRows(tbl);
    const groups={};
    const buckets={};

    rows.forEach(r=>{
      const li=levelOfRow(r); if(!li) return;
      const type=r.slice(0, li.i).join(' ').trim() || 'main';
      const baseKey=norm(type) || 'main';
      const vals=r.slice(li.i+1);

      if(!buckets[baseKey]) buckets[baseKey]=[];

      /*
       * Certains Alters possèdent plusieurs séries portant exactement le
       * même Type. C'est notamment le cas de Bakugo Cluster :
       * "Explosion Deploy" existe en version 50 et 120 Down Power, et
       * "Explosion" existe en version 200 et 250 Down Power.
       *
       * L'ancien code rangeait tout sous une seule clé et la seconde série
       * écrasait la première. On conserve maintenant chaque cycle Lv.1-Lv.9.
       */
      let group=buckets[baseKey].find(item=>!item.rows[li.lv]);
      if(!group){
        const order=buckets[baseKey].length;
        const key=`${baseKey}__${order+1}`;
        group={key,type,order,rows:{}};
        buckets[baseKey].push(group);
        groups[key]=group;
      }

      group.rows[li.lv]={
        damage:vals[0],
        down:vals[1],
        values:vals,
        row:r
      };
    });

    return groups;
  }
  function pickAdditionalGroup(groups, title){
    const arr=Object.values(groups||{});
    if(!arr.length) return null;

    const rawTitle=String(title||'');
    const t=norm(rawTitle);
    const hasTitle=(...words)=>words.every(word=>t.includes(norm(word)));
    const groupNorm=g=>norm(g?.type||'');
    const matching=(required=[],forbidden=[])=>arr.filter(g=>{
      const gn=groupNorm(g);
      return required.every(word=>gn.includes(norm(word))) &&
        forbidden.every(word=>!gn.includes(norm(word)));
    });
    const metric=(g,key)=>{
      const values=Object.values(g?.rows||{})
        .map(row=>Number.parseFloat(String(row?.[key]??'').replace(',','.')))
        .filter(Number.isFinite);
      return values.length
        ?values.reduce((sum,value)=>sum+value,0)/values.length
        :Number.NaN;
    };
    const choose=(list,mode='first')=>{
      if(!list.length) return null;
      if(mode==='highestDown'){
        return [...list].sort((a,b)=>(metric(b,'down')||0)-(metric(a,'down')||0))[0];
      }
      if(mode==='lowestDown'){
        return [...list].sort((a,b)=>{
          const av=metric(a,'down');
          const bv=metric(b,'down');
          return (Number.isFinite(av)?av:Number.MAX_SAFE_INTEGER)-
            (Number.isFinite(bv)?bv:Number.MAX_SAFE_INTEGER);
        })[0];
      }
      return list[0];
    };

    /* Bakugo Cluster et autres tables composées. */
    if(hasTitle('normal')){
      const m=choose(matching(['normal']));
      if(m) return m;
    }

    if(
      (hasTitle('balle','sueur')||hasTitle('bullet','sweat')) &&
      !hasTitle('explosion')
    ){
      const m=choose(matching(['bullet','sweat'],['explosion','deploy']));
      if(m) return m;
    }

    if(
      (hasTitle('sueur','deployee')||hasTitle('deploy','sweat')) &&
      !hasTitle('explosion')
    ){
      const m=choose(matching(['deploy','sweat'],['explosion','bullet']));
      if(m) return m;
    }

    if(
      (hasTitle('explosion','deployee')||hasTitle('explosion','deploy'))
    ){
      const m=choose(matching(['explosion','deploy'],['bullet','sweat']),'lowestDown');
      if(m) return m;
    }

    if(
      hasTitle('balle','explosive')||
      hasTitle('explosion','bullet')||
      hasTitle('bullet','explosion')
    ){
      const m=choose(matching(['explosion','bullet'],['sweat']));
      if(m) return m;
    }

    if(
      hasTitle('explosion','sueur')||
      hasTitle('sweat','explosion')
    ){
      const m=choose(matching(['explosion','sweat']));
      if(m) return m;
    }

    if(
      (hasTitle('sueur')||hasTitle('sweat')) &&
      !hasTitle('explosion') &&
      !hasTitle('balle') &&
      !hasTitle('bullet') &&
      !hasTitle('deploy') &&
      !hasTitle('deployee')
    ){
      const m=choose(matching(['sweat'],['explosion','bullet','deploy']));
      if(m) return m;
    }

    if(hasTitle('finish')||hasTitle('finisher')||hasTitle('final')){
      const m=choose(matching(['finish']));
      if(m) return m;
    }

    if(hasTitle('explosion')){
      const candidates=matching(['explosion'],['bullet','sweat']);
      const reinforced=/\+|follow[ -]?up|renforc|strong/i.test(rawTitle);

      if(reinforced){
        const m=choose(candidates,'highestDown');
        if(m) return m;
      }

      /* Une série exactement nommée Explosion est la version normale. */
      const exact=candidates.filter(g=>groupNorm(g)==='explosion');
      if(exact.length){
        const m=choose(exact,'lowestDown');
        if(m) return m;
      }

      /*
       * Pour AP Shot Cluster, la table locale "Explosion" correspond à la
       * seconde série Explosion Deploy (Down Power 120), tandis que
       * "Explosion déployée" correspond à la première (Down Power 50).
       */
      const m=choose(candidates,'highestDown');
      if(m) return m;
    }

    /* Règles historiques conservées. */
    function match(words){
      for(const g of arr){
        const gn=groupNorm(g);
        for(const word of words){
          const nw=norm(word);
          if(gn.includes(nw)||nw.includes(gn)) return g;
        }
      }
      return null;
    }

    let m=null;
    if((m=match(['charge','チャージ'])) && (t.includes('charge')||t.includes('chargee'))) return m;
    if((m=match(['pull','attraction','grab','引き寄せ'])) && (t.includes('pull')||t.includes('grab')||t.includes('attraction'))) return m;
    if((m=match(['rush','突進'])) && t.includes('rush')) return m;
    if((m=match(['max range','strike','先端'])) && (t.includes('range')||t.includes('portee')||t.includes('strike'))) return m;

    /* Dernier recours : groupe partageant le plus de mots avec le titre. */
    const aliases={
      balle:'bullet',
      projectile:'bullet',
      sueur:'sweat',
      deployee:'deploy',
      deploye:'deploy',
      deploiement:'deploy',
      finale:'finish',
      final:'finish',
      finisher:'finish'
    };
    const titleWords=t.split('_').filter(Boolean).map(word=>aliases[word]||word);
    const scored=arr.map((g,index)=>{
      const gn=groupNorm(g);
      const score=titleWords.reduce(
        (total,word)=>total+(word.length>2&&gn.includes(word)?1:0),
        0
      );
      return {g,index,score};
    }).sort((a,b)=>b.score-a.score||a.index-b.index);

    return scored[0]?.g||arr[0];
  }
'''


OLD_TITLE_PRIORITY = """            skill?.name||\n            change?.skill_name||"""
NEW_TITLE_PRIORITY = """            change?.skill_name||\n            skill?.name||"""

OLD_TRANSLATION_ROW = (
    "    [/Foot Boost/gi,'Boost du pied'],[/Hollow Point Shot/gi,'Tir à pointe "
    "creuse'],[/Airblast/gi,\"Rafale d'air\"],"
)
NEW_TRANSLATION_ROW = (
    "    [/Foot Boost/gi,'Boost du pied'],[/Hollow Point Shot/gi,'Tir à pointe "
    "creuse'],[/AP Shot Cluster/gi,'Tir AP : Cluster'],"
    "[/ExplosionFollow-up/gi,'Explosion renforcée'],"
    "[/Airblast/gi,\"Rafale d'air\"],"
)


def replace_once(text: str, old: str, new: str, label: str) -> tuple[str, bool]:
    if new in text:
        return text, False
    count = text.count(old)
    if count != 1:
        raise SystemExit(
            f"[ERREUR] {label}: motif attendu exactement une fois, trouvé {count}."
        )
    return text.replace(old, new, 1), True


def patch_index(text: str) -> tuple[str, bool]:
    marker = "Certains Alters possèdent plusieurs séries portant exactement le"
    if marker in text:
        return text, False

    pattern = re.compile(
        r"  function remoteAdditionalGroups\(remoteSkill\)\{.*?"
        r"\n  function patchLocalTable\(tb, remoteSkill\)\{",
        flags=re.S,
    )
    replacement = NEW_GROUP_FUNCTIONS + "  function patchLocalTable(tb, remoteSkill){"
    updated, count = pattern.subn(lambda _: replacement, text, count=1)
    if count != 1:
        raise SystemExit(
            "[ERREUR] Impossible de remplacer remoteAdditionalGroups/"
            "pickAdditionalGroup dans public/index.html."
        )
    return updated, True


def patch_patch_notes_js(text: str) -> tuple[str, bool]:
    changed = False

    text, did_change = replace_once(
        text,
        OLD_TITLE_PRIORITY,
        NEW_TITLE_PRIORITY,
        "priorité du titre détaillé des Patch Notes",
    )
    changed |= did_change

    text, did_change = replace_once(
        text,
        OLD_TRANSLATION_ROW,
        NEW_TRANSLATION_ROW,
        "traductions AP Shot Cluster / Explosion renforcée",
    )
    changed |= did_change

    return text, changed


def verify(index: str, patch_js: str) -> None:
    required_index = [
        "const buckets={};",
        "!item.rows[li.lv]",
        "hasTitle('explosion','deployee')",
        "matching(['bullet','sweat']",
        "matching(['deploy','sweat']",
        "choose(candidates,'highestDown')",
    ]
    required_patch = [
        NEW_TITLE_PRIORITY,
        "[/AP Shot Cluster/gi,'Tir AP : Cluster']",
        "[/ExplosionFollow-up/gi,'Explosion renforcée']",
    ]

    missing = [token for token in required_index if token not in index]
    missing += [token for token in required_patch if token not in patch_js]
    if missing:
        raise SystemExit(
            "[ERREUR] Vérification V652 incomplète: " + ", ".join(missing)
        )

    if OLD_TITLE_PRIORITY in patch_js:
        raise SystemExit(
            "[ERREUR] L'ancien ordre skill.name > change.skill_name est encore présent."
        )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--check",
        action="store_true",
        help="Vérifie le correctif sans modifier les fichiers.",
    )
    args = parser.parse_args()

    if not INDEX_PATH.is_file():
        raise SystemExit(f"[ERREUR] Fichier introuvable: {INDEX_PATH}")
    if not PATCH_JS_PATH.is_file():
        raise SystemExit(f"[ERREUR] Fichier introuvable: {PATCH_JS_PATH}")

    index = INDEX_PATH.read_text(encoding="utf-8")
    patch_js = PATCH_JS_PATH.read_text(encoding="utf-8")

    if args.check:
        verify(index, patch_js)
        print("[OK] Correctif V652 présent et valide.")
        return

    index, index_changed = patch_index(index)
    patch_js, patch_changed = patch_patch_notes_js(patch_js)
    verify(index, patch_js)

    if index_changed:
        INDEX_PATH.write_text(index, encoding="utf-8")
    if patch_changed:
        PATCH_JS_PATH.write_text(patch_js, encoding="utf-8")

    if index_changed or patch_changed:
        print("[OK] Correctif V652 appliqué.")
    else:
        print("[OK] Correctif V652 déjà appliqué; aucun doublon ajouté.")


if __name__ == "__main__":
    main()
