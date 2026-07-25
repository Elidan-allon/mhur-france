# MHUR Nexus v5.1

Correctif principal : modération sans gel, recours fiable pour avertissement/ban temporaire/ban définitif, et en-tête anti-chevauchement.

Après le déploiement, exécuter obligatoirement `configuration/A_EXECUTER_DANS_SUPABASE_V51.sql` dans Supabase SQL Editor.

Voir `LISEZ_MOI_VERSION_5_1.txt` pour les étapes et les tests.

# MHUR Nexus

Site communautaire français consacré à My Hero Ultra Rumble.

## Structure

- `public/` : site publié en production
- `configuration/` : outils locaux de configuration
- `mise_a_jour/` : outils locaux de synchronisation et de mise à jour
- `wrangler.jsonc` : configuration du déploiement Cloudflare Workers

## Déploiement Cloudflare

- Commande de build : aucune
- Commande de déploiement : `npx wrangler deploy`
- Dossier du projet : `/`

## Sécurité

Les fichiers `.env`, `.dev.vars`, `node_modules/` et `.wrangler/` sont exclus par `.gitignore`.
Ne jamais publier de clé Supabase `service_role`, de token Cloudflare ou d'autre secret.

## Base de données

Les anciens scripts SQL d'installation et de migration ont été retirés de cette archive destinée à GitHub. Ils doivent être conservés séparément dans une sauvegarde privée si nécessaire.


## SEO et URLs propres

Le domaine canonique est `https://mhurfrance.com`. Les routes publiques utilisent désormais des URL sans `#`, par exemple `/characters`, `/characters/mirio`, `/costumes/mirio` et `/builds/mirio`. Le sitemap et le fichier robots.txt sont configurés pour ce domaine.


## Version 5.6
Header mobile reconstruit en trois lignes, hauteur automatique, aucun chevauchement et aucun bouton supprimé. Aucun SQL supplémentaire.
