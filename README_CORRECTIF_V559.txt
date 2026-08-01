CORRECTIF V559 — MHUR FRANCE
============================

INSTALLATION
1. Décompresse ce ZIP.
2. Copie TOUT son contenu à la racine du projet mhur-france.
   Le dossier doit contenir public/index.html.
3. Double-clique sur APPLIQUER_CORRECTIF_V559.bat.
4. Ouvre GitHub Desktop : Commit to main, puis Push origin.
5. Attends le déploiement et recharge le site avec Ctrl+F5 une seule fois.

CE QUI EST CORRIGÉ
- Les lignes « Effets de montée », « Valeurs », etc. s'ouvrent au clic.
- Les objets localisés ne deviennent plus « [object Object] ».
- Les réductions utilisent les portraits officiels exacts :
  D.J. Board, Flow Runner, Gentle Criminal, Factor Fusion, Cluster et Mirko.
- La zone derrière le portrait prend la couleur du rôle.
- Les badges NEW sont synchronisés avec active_new_content ; les anciens badges
  de « Loisirs d'été » sont retirés.
- Tous les badges NEW s'agrandissent puis rétrécissent en boucle.
- Les patch notes récupèrent l'image de compétence du bon Alter.
- Le rechargement automatique V36 et les boucles V556/V557/V558 sont désactivés.
- La flèche du tutoriel des mods et les textes FR/EN ciblés sont réparés.

ANNULATION
Double-clique sur ANNULER_CORRECTIF_V559.bat, puis Commit + Push.

IMPORTANT
Le correctif ne supprime aucun ancien fichier. Il retire seulement leurs balises
CSS/JS de public/index.html et conserve une sauvegarde :
public/index.html.avant-v559-stable.bak
