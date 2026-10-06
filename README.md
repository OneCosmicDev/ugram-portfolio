# Ugram — Partage d’images

J’ai contribué à Ugram au sein de l’équipe 24 du cours GLO-3112 à l’Université Laval. Ce projet m’a permis de travailler sur une application web complète, depuis son environnement de développement jusqu’à son déploiement sur AWS.

**Université Laval · GLO-3112 · Hiver 2026**

**Début documenté : 21 janvier 2026** — [repères chronologiques](PROVENANCE.md#repères-chronologiques)

**Technologies : Next.js · TypeScript · Express · PostgreSQL · Prisma · Docker · AWS**

## Ce que fait le projet

Ugram est une application de partage d’images. Les utilisateurs peuvent créer un compte, publier des images, consulter un fil de publications et rechercher du contenu par description ou par mot-clic. L’application comprend des profils, des réactions, des commentaires, des abonnements et des notifications. Elle associe une interface Next.js, une API Express et une base PostgreSQL gérée avec Prisma.

## Ma contribution

J’ai concentré ma contribution sur les fondations techniques, le backend et le déploiement.

- J’ai préparé l’environnement Docker Compose, la structure initiale des applications et le premier schéma Prisma avec ses données de développement.
- J’ai travaillé sur l’intégration continue et le déploiement AWS, notamment le packaging du backend pour Elastic Beanstalk et la compatibilité des binaires Prisma avec Amazon Linux.
- J’ai ajouté des contrôles d’authentification et de propriété pour les comptes et les images, ainsi que le hachage des mots de passe.
- J’ai intégré les uploads vers S3 et fait évoluer le modèle des mots-clics vers une relation plusieurs-à-plusieurs.
- J’ai ajouté la journalisation, la validation des requêtes avec Zod, des limites de fréquence et une documentation OpenAPI/Swagger.

Je détaille les fichiers et les références de mon travail dans [CONTRIBUTIONS.md](CONTRIBUTIONS.md).

## Ce que j’ai appris

J’ai appris à traiter le déploiement comme une partie du développement. Une application qui fonctionne localement peut rencontrer d’autres contraintes sur un serveur : dépendances de production, binaires propres à la plateforme, migrations et configuration d’environnement. Le travail avec Docker, Prisma et AWS m’a donné une expérience concrète de ces différences.

J’ai également approfondi la distinction entre authentification et autorisation. Reconnaître un utilisateur ne suffit pas : chaque opération doit vérifier qu’il peut agir sur la ressource concernée. La normalisation des mots-clics m’a aussi appris à faire évoluer ensemble le schéma de données, les requêtes et les types utilisés par le frontend.

## Mon équipe et le cadre du cours

J’ai travaillé avec [JeremyBeaurivage1](https://github.com/JeremyBeaurivage1), [SADIN4](https://github.com/SADIN4), [ErnestOo0](https://github.com/ErnestOo0) et [oussamatouadjni](https://github.com/oussamatouadjni). Mes contributions s’inscrivent dans le travail collectif de l’équipe 24.

Les consignes et les ressources pédagogiques proviennent du cours GLO-3112.

## Lancer le projet

Prérequis : Docker et Docker Compose pour le démarrage complet.

```sh
docker compose up --build
```

Frontend : `http://localhost:3000`. API : `http://localhost:4000`. Documentation API : `http://localhost:4000/api/docs`.

Les valeurs PostgreSQL de Compose sont des valeurs de démonstration locale. L’authentification Google, les images Unsplash et les uploads S3 demandent vos propres identifiants. Le fichier `backend/.env.example` contient uniquement des champs de configuration à remplir. Sans S3, le backend utilise le stockage local.

Pour compiler séparément les deux applications, j’installe les dépendances dans `backend/` puis `frontend/` avec `npm ci`, et je lance `npm run build` dans chacun. Le postinstall du backend génère le client Prisma ; aucune migration distante n’est requise pour compiler.

## État du projet

Le frontend Next.js et le backend TypeScript compilent, et le client Prisma est généré. Les parcours complets avec PostgreSQL, OAuth et S3 restent à vérifier.
