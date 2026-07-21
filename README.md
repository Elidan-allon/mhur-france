# MHUR France

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
