# MHUR Nexus v5.7

Correctif principal : header mobile sur une seule ligne de commandes, icônes compactes et logo centré dessous, sans aucun chevauchement.

Aucun nouveau script SQL n’est nécessaire pour cette version.

Voir `LISEZ_MOI_VERSION_5_7.txt` pour les détails.

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


## Version 5.7
Toutes les commandes du header mobile sont sur une seule ligne. Le logo reste centré dessous. Les icônes se compactent automatiquement et aucun bouton n’est supprimé. Aucun SQL supplémentaire.
