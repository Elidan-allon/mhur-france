MHUR FRANCE — CORRECTIF V559
============================

CE CORRECTIF RÈGLE :
- le texte de conflit Git « <<<<<<< HEAD ... » visible en haut du site ;
- les portraits cassés de D.J. Board, Flow Runner, Cluster et Mirko ;
- la mauvaise association de Factor Fusion avec Overhaul ;
- la mise en page trop haute/cassée des cartes ;
- le texte « Mise à jour automatique chaque mardi... » sous les cartes ;
- les prochaines mises à jour qui remplaçaient les images validées.

FACTOR FUSION :
- personnage : All For One ;
- style : Strike / Attaque ;
- identifiant : all_for_one_strike.

INSTALLATION :
1. Décompresse tout à la RACINE du dépôt mhur-france.
   Les fichiers .bat doivent être au même niveau que les dossiers public et mise_a_jour.
2. Double-clique sur APPLIQUER_CORRECTIF_V559.bat.
3. Vérifie que la fenêtre affiche [OK].
4. Fais le commit et le push vers GitHub.
5. Attends le redéploiement Cloudflare, puis fais Ctrl + F5 sur le site.

SAUVEGARDES :
Le programme crée des fichiers .avant-v559.bak sans écraser une ancienne sauvegarde.
Pour revenir en arrière, lance ANNULER_CORRECTIF_V559.bat.

IMPORTANT :
Les six images V559 ont des noms versionnés dans
public/assets/home/discounts/v559/.
Le programme de mise à jour peut donc continuer à fonctionner sans les écraser.
