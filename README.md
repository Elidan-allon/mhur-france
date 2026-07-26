# MHUR Nexus v5.12

Le header est maintenant construit complètement avant le premier affichage : les boutons ne se déplacent plus pendant la restauration du compte ou du rôle. Aucun nouveau script SQL n’est requis.

# MHUR Nexus v5.11

Correctifs principaux : header mobile stable dès le premier rendu, panneaux Réseaux sociaux/Créateurs non coupés, fermeture par clic extérieur, profil public traduit en anglais et suppression du refresh provoqué par la reconnexion automatique.

Aucun nouveau script SQL n’est nécessaire pour cette version.

Voir `LISEZ_MOI_VERSION_5_11.txt` pour les détails.

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


## Version 5.8
Le nom MY HERO ULTRA RUMBLE NEXUS est placé au-dessus de la ligne de boutons sur mobile. L’espace fantôme sous le header et l’espace réservé autour du bouton Retour sont supprimés. Le profil public, ses statistiques et les sections Builds/Mods restent dans l’ordre et ne se recouvrent plus. Aucun SQL supplémentaire.

## Version 5.9

Correction du header mobile : icônes agrandies et menu latéral toujours positionné sous la hauteur réelle du header. Aucun SQL supplémentaire n'est requis.


## Version 5.11

Header mobile stabilisé dès le premier rendu, panneaux du header repositionnés sous la barre, fermeture au clic extérieur, profil public bilingue et correction du rechargement à la reconnexion. Aucun SQL supplémentaire.
