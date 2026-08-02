MHUR FRANCE — CORRECTIF V558
============================

BUT
---
- Restaure les 6 cartes « Réductions de points personnage ».
- Empêche les mises à jour automatiques de remplacer leurs portraits.
- Corrige Factor Fusion : il s'agit de All For One Strike, pas Overhaul.

INSTALLATION
------------
1. Copie tout le contenu de ce dossier à la racine du dépôt mhur-france,
   au même niveau que les dossiers « public » et « mise_a_jour ».
2. Double-clique sur APPLIQUER_CORRECTIF_V558.bat.
3. Teste le site localement.
4. Fais commit puis push sur GitHub.

FICHIERS MODIFIÉS
-----------------
- public/data/home_data.json
- public/data/home_data.js
- public/js/season18-fixes.js
- public/index.html
- mise_a_jour/outils/season18_postprocess.py

FICHIER AJOUTÉ
--------------
- public/js/v558-discount-lock.js

SÉCURITÉ
--------
Les fichiers originaux sont sauvegardés automatiquement avec le suffixe :
.avant-v558.bak

Pour revenir en arrière, lance ANNULER_CORRECTIF_V558.bat.
