# Ugram — contribution et crédits

Ugram est une application de partage d'images réalisée par l'équipe 24 du cours GLO-3112 à l'Université Laval, à l'hiver 2026. Elle associe un frontend Next.js, une API Express et une base PostgreSQL gérée avec Prisma.

## Ma contribution — Juan José Castilla Manrique

J'ai principalement travaillé sur l'infrastructure de développement, l'intégration backend et le déploiement, puis sur les contrôles d'accès et la validation des requêtes.

- **Fondations du projet** : préparation de Docker Compose, des applications frontend et backend, du schéma Prisma initial et du jeu de données de développement. [PR #8](https://github.com/GLO3112-classrooms/ugram-h2026-team-24/pull/8).
- **Intégration continue et déploiement AWS** : ajout du workflow CI et adaptations du packaging de déploiement pour Elastic Beanstalk, notamment les dépendances de production et les binaires Prisma pour Amazon Linux. [PR #10](https://github.com/GLO3112-classrooms/ugram-h2026-team-24/pull/10), [#26](https://github.com/GLO3112-classrooms/ugram-h2026-team-24/pull/26), [#27](https://github.com/GLO3112-classrooms/ugram-h2026-team-24/pull/27).
- **Contrôles d'accès** : ajout de gardes d'authentification et de vérifications de propriété pour les comptes et les images, ainsi que du hachage des mots de passe. [PR #23](https://github.com/GLO3112-classrooms/ugram-h2026-team-24/pull/23).
- **Images et modèle de données** : intégration des uploads S3, normalisation des hashtags avec une relation plusieurs-à-plusieurs et ajustements de l'API de recherche. [PR #23](https://github.com/GLO3112-classrooms/ugram-h2026-team-24/pull/23).
- **Démarrage et journalisation** : ajout d'un script de démarrage Docker et de la journalisation des requêtes HTTP et événements applicatifs. [PR #25](https://github.com/GLO3112-classrooms/ugram-h2026-team-24/pull/25).
- **Validation et documentation de l'API** : intégration de schémas Zod, de limites de fréquence des requêtes et d'une documentation OpenAPI/Swagger. [PR #27](https://github.com/GLO3112-classrooms/ugram-h2026-team-24/pull/27).

Il s'agit de contributions à une application développée en équipe. L'ajout de contrôles de sécurité ne constitue pas une certification de sécurité de l'application.

## Équipe et crédits

Les comptes contributeurs identifiés dans le dépôt sont [OneCosmicDev](https://github.com/OneCosmicDev), [JeremyBeaurivage1](https://github.com/JeremyBeaurivage1), [SADIN4](https://github.com/SADIN4), [ErnestOo0](https://github.com/ErnestOo0) et [oussamatouadjni](https://github.com/oussamatouadjni).

Les consignes et ressources pédagogiques proviennent du cours GLO-3112. La liste ci-dessus reflète l'historique GitHub et peut être complétée pour créditer du travail effectué hors Git.
