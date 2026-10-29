# Palm Beauty Centre — installation

L'application repose sur trois éléments :

- **Node.js + Express** : le serveur et l'API.
- **PostgreSQL** : la base de données.
- **Web Push** : les notifications, envoyées directement par le serveur (aucun compte externe).

```
palm/
├── app/        → l'application (pages client + admin), servie par le serveur
└── server/     → API Node.js
    ├── src/schema.sql      tables PostgreSQL (créées automatiquement au démarrage)
    ├── src/routes/         auth, catalogue, réservations, notifications
    ├── src/notify.js       envoi des notifications Web Push
    └── .env.example        modèle de configuration
```

---

## 1. Installer les outils (une seule fois)

- **Node.js 18 ou plus récent** : https://nodejs.org (version LTS).
- **PostgreSQL** : https://www.postgresql.org/download/windows/.
  - Pendant l'installation, choisissez un mot de passe pour l'utilisateur `postgres` et gardez-le.
  - Ouvrez ensuite **pgAdmin** (installé avec PostgreSQL) : *Databases* → clic droit → *Create* → *Database*, avec le nom **`palm`**.

## 2. Configurer le serveur

1. Dans le dossier `server`, copiez `.env.example` et renommez la copie en **`.env`**.
2. Remplissez `.env` :

```
DATABASE_URL=postgres://postgres:VOTRE_MOT_DE_PASSE@localhost:5432/palm
JWT_SECRET=une-longue-phrase-aleatoire-que-personne-ne-connait
```

## 3. Clés des notifications

Les notifications utilisent deux clés **VAPID**, à générer une seule fois. Dans le dossier `server`, tapez :

```
npx web-push generate-vapid-keys
```

Collez ensuite les deux clés dans `server/.env` :

```
VAPID_PUBLIC_KEY=BK1_...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:votre-email@gmail.com
```

> ⚠️ `.env` est **secret** : ne l'envoyez à personne. **Ne changez plus ces clés** une fois l'app utilisée, sinon tous les téléphones devront réactiver les notifications.

Sans ces clés, l'app fonctionne quand même (réservations, mises à jour en direct) : il n'y a simplement pas de notifications.

## 4. Lancer l'application

Dans un terminal, ouvert dans le dossier `server` :

```
npm install
npm start
```

Le terminal affiche :

```
🔔 Notifications Web Push prêtes
🌴 Palm Beauty Centre : http://localhost:3000
```

Ouvrez **http://localhost:3000** pour l'espace client et **http://localhost:3000/admin.html** pour l'espace admin.

Les tables PostgreSQL sont créées automatiquement au premier démarrage.

## 5. Créer le compte admin

1. Sur http://localhost:3000, cliquez sur 👤 → **Créer un compte**, avec le numéro du centre et un mot de passe solide.
2. Arrêtez le serveur (Ctrl+C) puis tapez, avec le numéro utilisé :

```
npm run make-admin -- 22807207
npm start
```

3. Connectez-vous sur `/admin.html` avec ce numéro et ce mot de passe.

## 6. Activer les notifications

- **Admin** : bouton **🔔 Activer** en haut de l'admin, puis **Autoriser**. Chaque nouvelle réservation ou annulation fait arriver une notification.
- **Cliente** : 👤 Mon espace → **🔔 Activer les notifications**. Elle est notifiée quand le centre confirme, annule ou termine son rendez-vous.

Les notifications s'affichent **même quand l'app est fermée**. Quand l'app est ouverte, un bandeau apparaît et la liste se met à jour toute seule.

> **Téléphone** : les notifications exigent une adresse **https**, donc il faut mettre l'app en ligne (étape 7). Sur **iPhone**, il faut en plus l'ajouter à l'écran d'accueil (Partager ⬆️ → *Sur l'écran d'accueil*) et l'ouvrir depuis l'icône (iOS 16.4 minimum).

## 7. Mettre en ligne (pour les téléphones des clientes)

Hébergement gratuit : **Neon** (PostgreSQL, https://neon.tech) + **Render** (serveur, https://render.com). Le fichier `render.yaml` du dépôt contient déjà toute la configuration.

1. **Neon** : créez un projet, puis copiez la *connection string* (`postgresql://…neon.tech/neondb?sslmode=require…`). Les tables se créent toutes seules au premier démarrage du serveur.
2. **Render** : connectez-vous avec GitHub → **New** → **Blueprint** → choisissez le dépôt `palm` → **Apply**. Render demande 3 valeurs :
   - `DATABASE_URL` = la connection string Neon
   - `VAPID_PUBLIC_KEY` et `VAPID_PRIVATE_KEY` = les valeurs de votre `server/.env`
   (`JWT_SECRET` est généré automatiquement par Render.)
3. Attendez le déploiement (2 à 4 min) : Render donne une adresse en https, par exemple `palm-beauty-centre.onrender.com`. C'est le lien à partager aux clientes.
4. Chaque `git push` sur `main` redéploie automatiquement le site.

Pour donner le rôle admin à un compte en ligne : Render → service → **Shell** → `npm run make-admin -- NUMERO`.

> Offre gratuite Render : le serveur se met en veille après 15 minutes sans visite (le premier chargement prend alors environ 50 secondes). Les données restent en sécurité sur Neon. Pour le vrai centre, l'offre Render « Starter » supprime cette veille.

---

## Fonctionnement au quotidien

1. La cliente choisit ses soins, crée son compte et envoie sa réservation.
2. Le centre reçoit une notification : 📅 *Nouvelle réservation*.
3. Dans l'admin, le centre clique sur **Confirmer**.
4. La cliente reçoit une notification : ✅ *Rendez-vous confirmé*. Son écran se met aussi à jour en direct.
5. Après la visite, le centre clique sur **Terminé**. Le chiffre d'affaires se met à jour.

## Ce que l'admin peut gérer

| Onglet | Ajouter | Modifier | Supprimer |
|---|---|---|---|
| 📅 Réservations | ✅ (rendez-vous pris par téléphone) | ✅ date, heure, soins, nom, note, statut | ✅ |
| ✨ Services | ✅ | ✅ **photo**, prix, promo, description, contenu du pack, visibilité | ✅ |
| 🗂️ Catégories | ✅ | ✅ nom, icône, ordre (▲ ▼) | ✅ (avec ses services) |
| 👥 Clientes | ✅ comptes clientes ou admins | ✅ nom, téléphone, rôle, nouveau mot de passe | ✅ (l'historique des RDV est gardé) |
| 🖼️ Site | — | ✅ **tous les textes de l'accueil (FR + AR)**, photo d'accueil, chiffres | — (bouton « Rétablir » pour revenir à l'origine) |
| ⚙️ Paramètres | — | ✅ contact, horaires, **mon mot de passe** | — |

Quand l'admin modifie la date ou l'heure d'un rendez-vous, la cliente reçoit une notification « Rendez-vous modifié ».

**Photos** : dans ✨ Services → Modifier → 📷 *Choisir une photo* (depuis le téléphone ou le PC). La photo est réduite automatiquement et enregistrée dans PostgreSQL. Un service sans photo affiche un visuel aux couleurs du centre avec l'icône de sa catégorie. Sur le site, chaque photo s'affiche en entier et s'ouvre en grand au clic.

Photos fournies avec l'app (`app/img/`) : les visuels du centre (stories Instagram nettoyées) et, pour les services sans visuel, des photos [Unsplash](https://unsplash.com/license) (utilisation commerciale gratuite, sans attribution obligatoire). Remplacez-les par vos propres photos quand vous voulez, depuis l'admin.

## API (pour information)

| Méthode | Route | Accès |
|---|---|---|
| POST | `/api/auth/signup`, `/api/auth/login` | public (limité à 20 essais / 15 min) |
| GET | `/api/auth/me` | connecté |
| GET | `/api/catalog` | public |
| PUT | `/api/catalog` | admin |
| GET / POST | `/api/bookings` | cliente : ses réservations · admin : toutes |
| PATCH | `/api/bookings/:id` | cliente : annuler la sienne · admin : tout statut |
| PUT | `/api/bookings/:id` | admin (modification complète) |
| GET / POST | `/api/users` | admin |
| PATCH / DELETE | `/api/users/:id` | admin (pas sur son propre compte) |
| POST | `/api/auth/password` | connecté (ancien mot de passe exigé) |
| DELETE | `/api/bookings/:id` | admin |
| GET | `/api/push/key` | public (clé publique VAPID) |
| POST / DELETE | `/api/push` | connecté (abonnement push de l'appareil) |
| GET | `/api/events` | connecté (mises à jour en direct) |

Les prix d'une réservation sont toujours recalculés par le serveur à partir du catalogue : une cliente ne peut pas les modifier.

## Problèmes fréquents

| Problème | Solution |
|---|---|
| `Variable DATABASE_URL manquante` | Le fichier `server/.env` n'existe pas ou est vide (étape 2). |
| `password authentication failed` | Mauvais mot de passe PostgreSQL dans `DATABASE_URL`. |
| `database "palm" does not exist` | Créez la base `palm` dans pgAdmin (étape 1). |
| `Clés VAPID absentes` au démarrage | Ajoutez les clés dans `server/.env` (étape 3). |
| Le bouton « Activer les notifications » ne fait rien puis affiche une erreur | Navigation privée (incognito) : les notifications y sont interdites. Sur téléphone : il faut le lien https (étape 7). |
| Bandeau « Ouvrez l'application via le serveur » | La page a été ouverte en double-cliquant sur le fichier. Passez par http://localhost:3000. |
| Une cliente a oublié son mot de passe | Admin → 👥 Clientes → **Modifier** → saisir un nouveau mot de passe et le lui communiquer. |
