# Fiche technique — Gestion des données cartographiques côté API

## RÉSUMÉ

L'API utilise **PostGIS** (extension PostgreSQL) pour stocker et requêter les données géographiques.
Toute géométrie transite en **GeoJSON standard (SRID 4326 / WGS84)** entre le client et l'API.
Il y a deux usages distincts : les **points** (localisation d'une intervention) et les **polygones** (frontières d'un département).

---

## 1. INFRASTRUCTURE GÉOGRAPHIQUE

### Table `coordinate` — conteneur universel de géométrie

```sql
CREATE TABLE coordinate (
  id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  geom GEOMETRY(Geometry, 4326) NOT NULL  -- Point, Polygon, MultiPolygon...
);
CREATE INDEX coordinate_geom_idx ON coordinate USING GIST (geom);
```

- **Index spatial GIST** : accélère les requêtes géographiques (intersection, distance, etc.)
- **SRID 4326** : système WGS84, coordonnées `[longitude, latitude]` — le standard GPS/GeoJSON
- La table est générique : elle accepte n'importe quel type GeoJSON

### Deux entités l'utilisent

| Entité | Type de géométrie | Usage |
|--------|-------------------|-------|
| `Intervention` | `Point` | Position GPS du problème signalé |
| `Departement` | `Polygon` / `MultiPolygon` | Frontières administratives |

---

## 2. ÉCRITURE — COMMENT UNE GÉOMÉTRIE EST INSÉRÉE

### Fonction PostGIS utilisée

```sql
ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)
```

- `ST_GeomFromGeoJSON` : convertit un objet GeoJSON en géométrie PostGIS interne
- `ST_SetSRID(..., 4326)` : assigne le système de coordonnées WGS84
- Le JSON est sérialisé côté Node avant envoi : `JSON.stringify(dto.geom)`

### Exemple concret — création d'une coordonnée

```typescript
// coordinate.service.ts : create()
const row = await this.dataSource.query(
  `INSERT INTO coordinate (geom)
   VALUES (ST_SetSRID(ST_GeomFromGeoJSON($1), 4326))
   RETURNING id, ST_AsGeoJSON(geom)::json AS geom`,
  [JSON.stringify(dto.geom)],
);
```

La requête retourne immédiatement la géométrie relue (`ST_AsGeoJSON`) pour confirmation.

### Lors de la création d'une intervention

La création d'une Coordinate et d'une Intervention se fait dans **une seule transaction** :

```typescript
// intervention.service.ts : create()
// Étape 1 : insérer la coordonnée, récupérer son id
const coordRows = await queryRunner.query(
  `INSERT INTO coordinate (geom)
   VALUES (ST_SetSRID(ST_GeomFromGeoJSON($1), 4326))
   RETURNING id`,
  [JSON.stringify(createInterventionDto.coordinates.geom)],
);
const coordinateId = coordRows[0].id;

// Étape 2 : créer l'intervention avec le coordinateId
const newIntervention = intervRepo.create({
  ...dto,
  coordinate: { id: coordinateId },
  status: 'PENDING',
});
```

> **Point important** : `coordinates` dans le DTO de création de l'intervention est **optionnel**.
> Une intervention peut exister sans coordonnée (champ `coordinateId` nullable).

---

## 3. LECTURE — COMMENT UNE GÉOMÉTRIE EST RETOURNÉE

### Fonction PostGIS utilisée

```sql
ST_AsGeoJSON(c.geom)::json AS geom
```

- `ST_AsGeoJSON` : convertit la géométrie PostGIS interne en string GeoJSON
- `::json` : cast PostgreSQL → l'objet est retourné directement parsé (pas une string), prêt à être sérialisé en JSON par NestJS

### Format de réponse — un objet `coordinate`

```json
{
  "coordinate": {
    "geom": {
      "type": "Point",
      "coordinates": [2.3488, 48.8534]
    }
  }
}
```

---

## 4. ENDPOINTS CARTOGRAPHIQUES

### 4.1 `GET /intervention/with-geom` [JWT]

Retourne **toutes les interventions avec leur position GPS**.
C'est l'endpoint principal pour alimenter la carte.

**Query param optionnel** : `?zipCode=75001` pour filtrer par zone

**Réponse** : `InterventionWithGeom[]`

```typescript
type InterventionWithGeom = {
  id: string;
  name: string;
  description: string | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'PLANNED';
  zipcode: string;
  coordinate: { geom: GeoJSON.Geometry } | null;  // null si pas de localisation
  technician: { id, firstName, lastName, email } | null;
  reporter:   { id, firstName, lastName, email };
  photoKeys: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

**SQL sous-jacent** (simplifié) :
```sql
SELECT i.*, ST_AsGeoJSON(c.geom)::json AS geom,
       tech.id, tech."firstName", tech."lastName",
       rep.id,  rep."firstName",  rep."lastName"
FROM intervention i
LEFT JOIN coordinate c   ON c.id  = i."coordinateId"
LEFT JOIN person     tech ON tech.id = i."technicianId"
LEFT JOIN person     rep  ON rep.id  = i."reporterId"
[WHERE i.zipcode = $1]
```

---

### 4.2 `GET /intervention/search` [JWT]

Recherche textuelle sur `name` (ILIKE) **dans un zipCode donné**, avec géométrie incluse.

**Query params requis** : `?zipCode=75001&q=nid`

**Comportement** : retourne `[]` si `zipCode` ou `q` est absent/vide.

```sql
WHERE i.zipcode = $1 AND i.name ILIKE $2
ORDER BY i."updatedAt" DESC
```

---

### 4.3 `GET /departement/with-geom` (pas d'auth)

Retourne **tous les départements avec leurs frontières géographiques**.
Utilisé pour afficher les zones sur la carte.

**Réponse** : `DepartementWithGeom[]`

```typescript
type DepartementWithGeom = {
  id: string;
  zipCode: string;   // ex: "75", "62", "2A"
  name: string;      // ex: "Paris", "Pas-de-Calais"
  coordinate: {
    geom: GeoJSON.Polygon | GeoJSON.MultiPolygon
  };
}
```

---

### 4.4 `GET /departement/with-geom-temp-paginated` (pas d'auth)

Même données que ci-dessus, mais **paginées** et avec un filtre important :

> **Exclut les départements qui ont déjà une Organisation associée** (déjà "pris" par une mairie).

Utilisé pour la sélection lors de la création d'une organisation.

**Query params** : `?page=1&limit=5`

**SQL sous-jacent** :
```sql
SELECT d.id, d.name, d.zip_code AS "zipCode", ST_AsGeoJSON(c.geom)::json AS geom
FROM departement d
JOIN coordinate c ON c.id = d.coordinate_id
WHERE NOT EXISTS (
  SELECT 1 FROM organization o WHERE o."zipCode"::text = d.zip_code
)
ORDER BY d.zip_code ASC
LIMIT $1 OFFSET $2
```

---

### 4.5 `GET /departement/:personId/with-geom` [JWT]

Retourne le département de la personne connectée, **basé sur son organisation**.

Logique : `person → organization → zipCode → departement`

```sql
FROM departement d
JOIN coordinate c ON c.id = d.coordinate_id
JOIN organization o ON o."zipCode"::text = d.zip_code
JOIN person p ON p.id = $1
  AND (p."organizationId" = o.id OR o."ownerId" = p.id)
```

Retourne `null` si la personne n'appartient à aucune organisation.

---

### 4.6 `GET /person/owner-by-zip-code` [JWT]

Retourne la liste des personnes **propriétaires d'une organisation** pour un `zipCode` donné.

**Query param requis** : `?zipCode=66`

**Réponse** : `PersonSearchResultDto`

```typescript
type PersonSearchResultDto = {
  items: Person[];   // liste des propriétaires trouvés
  total: number;     // nombre total de résultats
  emptyCode?: 'NO_PERSON_MATCH' | null;  // présent si aucun résultat
}
```

**Logique** : joint `person → ownedOrganization` et filtre par `org.zipCode`.

**Cas d'usage mobile** : afficher l'identité du responsable du département de l'utilisateur connecté (icône couronne).

---

### 4.7 `POST /coordinate` [JWT]

Crée une coordonnée autonome (non rattachée à une intervention).

**Corps** :
```json
{
  "geom": {
    "type": "Point",
    "coordinates": [2.3488, 48.8534]
  }
}
```

**Réponse** : `{ id: "uuid", geom: { type: "Point", coordinates: [...] } }`

> En pratique, pour une intervention, ne pas utiliser cet endpoint séparément.
> La création de coordonnée est embarquée dans `POST /intervention` (transaction atomique).

---

## 5. FORMAT GEOJSON — RÉFÉRENCE RAPIDE

### Point (intervention)
```json
{
  "type": "Point",
  "coordinates": [longitude, latitude]
}
```
Exemple Paris : `[2.3488, 48.8534]`

### Polygon (frontière simple)
```json
{
  "type": "Polygon",
  "coordinates": [
    [ [lng, lat], [lng, lat], [lng, lat], [lng, lat] ]
  ]
}
```
> Le premier et dernier point doivent être identiques (anneau fermé).

### MultiPolygon (département avec îles, enclaves…)
```json
{
  "type": "MultiPolygon",
  "coordinates": [
    [ [ [lng, lat], ... ] ],
    [ [ [lng, lat], ... ] ]
  ]
}
```

**Ordre des coordonnées** : toujours `[longitude, latitude]` (WGS84 / GeoJSON standard).
Ne pas inverser avec `[lat, lng]` utilisé par certaines bibliothèques (ex: Leaflet).

---

## 6. FLUX COMPLET — SIGNALEMENT MOBILE (POINT DE VUE CLIENT)

```
1. Récupérer la position GPS de l'utilisateur
   → { longitude: 2.3488, latitude: 48.8534 }

2. POST /intervention
   Body: {
     reporterId: "uuid-user",
     name: "Nid de poule",
     zipcode: "75001",
     coordinates: {
       geom: { "type": "Point", "coordinates": [2.3488, 48.8534] }
     }
   }
   ← { id: "uuid-intervention", status: "PENDING", coordinateId: "uuid-coord", ... }

3. (Optionnel) Upload de photos
   POST /intervention/:id/photos/presign  → { uploadUrl, key }
   PUT uploadUrl (upload direct S3)
   PATCH /intervention/:id  Body: { photoKeys: ["interventions/.../uuid.jpg"] }

4. Afficher l'intervention sur la carte
   GET /intervention/with-geom?zipCode=75001
   → liste avec coordinate.geom pour chaque marqueur
```

---

## 7. FLUX COMPLET — CHARGEMENT DE LA CARTE (OPÉRATEUR WEB)

```
1. Charger les frontières du département de l'opérateur
   GET /departement/:personId/with-geom
   → { zipCode, coordinate: { geom: MultiPolygon } }
   → Afficher la zone de responsabilité

2. Charger les interventions de la zone
   GET /intervention/with-geom?zipCode=<zipCode>
   → Afficher les marqueurs (Point) sur la carte

3. Recherche contextuelle
   GET /intervention/search?zipCode=75001&q=nid
   → Filtrer les marqueurs affichés
```

---

## 8. POINTS D'ATTENTION

| Sujet | Détail |
|-------|--------|
| **Pas de requête spatiale avancée** | L'API ne fait pas de `ST_Within`, `ST_Distance`, etc. Le filtre géographique se fait uniquement par `zipcode` (string, pas un calcul spatial) |
| **Index spatial présent** | L'index GIST sur `coordinate.geom` est en place, mais pas encore utilisé par les requêtes actuelles |
| **Coordonnée optionnelle** | Une intervention peut n'avoir aucune coordonnée (`coordinateId = null`) — prévoir ce cas côté carte (pas de marqueur) |
| **URLs photos expirées** | `GET /intervention/:id/photos/urls` retourne des URLs S3 presignées valables **60 secondes** seulement |
| **`coordinates` vs `coordinate`** | Dans le DTO de création : `coordinates` (pluriel). Dans la réponse et l'entité : `coordinate` (singulier). Cohérence à vérifier côté client |
| **Pas de mise à jour de position** | Il n'y a pas d'endpoint dédié pour modifier la position GPS d'une intervention après création. Utiliser `PATCH /intervention/:id` avec le service d'update (ne met pas à jour la géométrie actuellement) |

---

*Fiche générée pour civic-ops / fil-rouge — Ynov M2 Cloud*
*Référence code : `api/src/coordinate/`, `api/src/departement/`, `api/src/intervention/intervention.service.ts`*
