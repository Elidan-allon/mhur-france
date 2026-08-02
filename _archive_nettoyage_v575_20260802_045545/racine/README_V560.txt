MHUR FRANCE — CORRECTIF V560

PROBLÈME CORRIGÉ
Le rôle apparaissait une deuxième fois tout en bas des cartes « Réductions de points personnage ».

INSTALLATION
1. Décompresser ce ZIP à la racine du dépôt mhur-france.
2. Vérifier que APPLIQUER_CORRECTIF_V560.bat est au même niveau que le dossier public.
3. Lancer APPLIQUER_CORRECTIF_V560.bat.
4. Commit/push sur GitHub.
5. Après le déploiement Cloudflare, faire Ctrl + F5.

Le correctif ne change pas les portraits, les points, les rôles corrects ni Factor Fusion.
Il supprime seulement les éléments ajoutés après la ligne des points.

ANNULATION
Lancer ANNULER_CORRECTIF_V560.bat.
