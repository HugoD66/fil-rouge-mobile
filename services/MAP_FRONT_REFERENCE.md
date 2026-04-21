# Fiche technique — Gestion des données cartographiques côté frontend (Angular)

## RÉSUMÉ

La carte est rendue par **MapLibre GL JS**. Elle est pilotée en **mode réactif** via des Angular Signals.
Toute la logique cartographique est découpée en services spécialisés. Le composant `MapComponent` ne contient
que la logique de rendu MapLibre — les données arrivent des services via des Signals et des Observables.

---

## 1. LIBRAIRIE ET STYLE DE TUILES

```typescript
// map.component.ts : ngOnInit()
this.map = new maplibregl.Map({
  container: this.mapEl.nativeElement,
  style: 'https://openmaptiles.data.gouv.fr/styles/osm-openmaptiles/style.json',
  center: [2.6, 47],   // centre France
  zoom: 4,
});
```

- **MapLibre GL JS** : fork open-source de Mapbox GL JS
- **Style** : tuiles OSM via le CDN de data.gouv.fr (France entière)
- **Coordonnées** : `[longitude, latitude]` — WGS84, identique à l'API

---

## 2. ARCHITECTURE DES SERVICES MAP

```
MapComponent
├── MapSourceService      ← état global des sources GeoJSON + filtres + sélection
├── MapFitService         ← zoom/pan automatique vers une géométrie
├── MapGeojsonBoundsService ← calcul du bounding box d'un GeoJSON
├── MapFeaturePropsService  ← extraction des propriétés d'un feature (département)
├── MapRefService           ← référence globale à l'instance Map (accès depuis n'importe où)
│
├── InterventionService   ← données interventions + computed FeatureCollection
└── DepartmentService     ← données départements + computed FeatureCollection
```

---

## 3. SOURCES ET LAYERS — CATALOGUE COMPLET

Toutes les sources/layers sont nommées via la constante `MAP_IDS` (fichier `map-source-ids.ts`).

### Sources GeoJSON

| Clé (`MAP_IDS.sources`) | Valeur string | Contenu |
|-------------------------|---------------|---------|
| `interventions` | `"interventions"` | Points GPS des interventions |
| `personZone` | `"person-zone"` | Polygon/MultiPolygon du département de l'opérateur |
| `depts` | `"departements"` | Tous les départements disponibles (création orga) |
| `deptSelected` | `"departement-selected"` | Département cliqué/sélectionné (création orga) |

### Layers MapLibre

| Clé (`MAP_IDS.layers`) | Valeur string | Type | Source |
|------------------------|---------------|------|--------|
| `interventions.circle` | `"interventions-circle"` | `circle` | `interventions` |
| `personZone.outline` | `"person-zone-outline"` | `line` | `person-zone` |
| `depts.fill` | `"departements-fill"` | `fill` | `departements` |
| `depts.outline` | `"departements-outline"` | `line` | `departements` |
| `deptSelected.fill` | `"departement-selected-fill"` | `fill` | `departement-selected` |
| `deptSelected.outline` | `"departement-selected-outline"` | `line` | `departement-selected` |

---

## 4. DEUX MODES DE LA CARTE

La même instance `MapComponent` fonctionne en deux modes distincts selon la route Angular :

```typescript
// map.component.ts : ngOnInit()
if (this.route.url === '/home')                this.initPrincipalMap();
if (this.route.url === '/create-organization') this.initOrganizationMap();
```

### Mode `/home` — tableau de bord opérateur

**Ce qui est affiché :**
1. Contour du département de l'opérateur (`personZone.outline` — ligne bleue `#1e3a8a`)
2. Marqueurs des interventions de la zone (`interventions-circle` — point coloré selon statut)

**Flux d'initialisation :**
```
map 'load' event
  → fetchPersonDepartmentWithGeom(person)     // GET /departement/:id/with-geom
  → addSource('person-zone', feature)         // frontières du département
  → addLayer('person-zone-outline')           // contour bleu
  → fitWithRetry(deptFeature, maxZoom: 12)   // zoom sur le département
  → fetchInterventionsForPersonDepartment()   // GET /intervention/with-geom?zipCode=...
  → interventions signal mis à jour
  → interventionsFc computed recalculé
  → effect() détecte le changement → src.setData(filteredFc)
```

### Mode `/create-organization` — sélection de département

**Ce qui est affiché :**
1. Tous les départements libres (remplis en bleu `#3b82f6`, opacité 0.25)
2. Le département sélectionné (rempli en orange `#ff7f50`, opacité 0.4)

**Flux d'initialisation :**
```
map 'load' event
  → addSource('departements', emptyFc)
  → addSource('departement-selected', emptyFc)
  → addLayer('departements-fill')
  → addLayer('departements-outline')
  → addLayer('departement-selected-fill')
  → addLayer('departement-selected-outline')
  → fetchAllDepartmentsPaginated()    // GET /departement/with-geom-temp-paginated (pages de 5)
  → departmentList signal mis à jour au fur et à mesure
  → departmentsFc computed recalculé
  → effect() dans DepartmentService → mapSourceService.setData('departements', fc)
  → getSource$('departements').subscribe() → src.setData(fc)
```

---

## 5. FLUX DE DONNÉES RÉACTIF (SIGNALS + EFFECTS)

### Données interventions

```
API GET /intervention/with-geom?zipCode=...
    ↓
InterventionService.interventions (WritableSignal<InterventionWithGeom[]>)
    ↓ computed
InterventionService.displayedInterventions
  — si recherche active → searchedInterventions
  — sinon              → interventions
    ↓ computed
InterventionService.interventionsFc (Signal<FeatureCollection>)
  — filtre les interventions sans coordonnée
  — construit chaque Feature avec properties: { id, name, status, zip, technicianId, reporterId }
    ↓ effect() dans MapComponent
map.getSource('interventions').setData(filteredFc)
  — applique en plus le filtre de MapSourceService.interventionListFilter
    (personnId + personType + status)
```

### Données départements

```
API GET /departement/with-geom-temp-paginated?page=N&limit=5
    ↓ (chargement progressif page par page)
DepartmentService.departmentList (WritableSignal<DepartementWithGeom[]>)
    ↓ computed
DepartmentService.departmentsFc (Signal<FeatureCollection>)
  — properties: { name, zip }
    ↓ effect() dans DepartmentService
MapSourceService.setData('departements', fc)
    ↓ BehaviorSubject
MapComponent.getSource$('departements').subscribe() → src.setData(fc)
```

---

## 6. COLORATION DES MARQUEURS D'INTERVENTIONS

Les couleurs sont lues depuis les **variables CSS** au moment du rendu :

```typescript
const pending    = getCssVar('--itv-pending',     '#f97316');  // orange
const planned    = getCssVar('--itv-planned',     '#8b5cf6');  // violet
const inProgress = getCssVar('--itv-in-progress', '#3b82f6');  // bleu
const completed  = getCssVar('--itv-completed',   '#22c55e');  // vert
const cancelled  = getCssVar('--itv-cancelled',   '#6b7280');  // gris
```

Utilisées dans une expression MapLibre `match` sur la propriété `status` du feature :

```typescript
'circle-color': [
  'match', ['get', 'status'],
  'pending',     pending,
  'in_progress', inProgress,
  'completed',   completed,
  'cancelled',   cancelled,
  'planned',     planned,
  def,  // fallback gris clair
]
```

---

## 7. INTERACTIONS UTILISATEUR SUR LA CARTE

### Clic sur un marqueur d'intervention (`/home`)

```typescript
map.on('click', 'interventions-circle', (e) => {
  const clickedId = features[0].properties['id'];

  if (panelOpen && clickedId === currentSelectedId) {
    // Deuxième clic sur le même → ferme le panneau
    overlayLayoutService.isPanelOpen.set(false);
    mapSourceService.clearSelection();
  } else {
    // Nouveau clic → ouvre le panneau + centre la carte
    mapSourceService.selectInterventionOnMap(clickedId);
    overlayLayoutService.isPanelOpen.set(true);
  }
});
```

**Sélection d'une intervention depuis la liste** (panneau latéral) :
```typescript
mapSourceService.selectInterventionFromList(id);
// → effect() dans MapComponent détecte selectedInterventionId()
// → mapFitService.fitMapToGeoJSON(map, selectedFeature, { maxZoom: 12, duration: 300 })
```

### Clic sur un département (`/create-organization`)

```typescript
map.on('click', 'departements-fill', (e) => {
  const { zipCode, name, props } = featurePropsService.extractDeptPropsFromFeature(f);
  mapSourceService.setSelection('departement', { zipCode, name, properties: props });

  // Met à jour la source 'departement-selected' → highlight orange
  selectedSrc.setData({ type: 'FeatureCollection', features: [f] });

  // Zoom sur le département sélectionné
  fitWithRetry(featureCollection, { maxZoom: 8 });
});
```

---

## 8. ZOOM AUTOMATIQUE — `MapFitService`

Service central pour tous les zooms/pans programmatiques.

### `fitMapToGeoJSON(map, geo, options)`

Calcule le bounding box de n'importe quel GeoJSON (Feature ou FeatureCollection) puis appelle `map.fitBounds()`.

```typescript
// Cas spécial Point : utilise easeTo() plutôt que fitBounds()
if (geom.type === 'Point') {
  map.easeTo({ center: [lng, lat], zoom: 14, duration: 500, padding });
}
```

### Padding dynamique selon les overlays ouverts

Le padding droit est agrandi quand le panneau latéral est ouvert, pour éviter que le marqueur
soit masqué derrière le panneau :

```typescript
getFitPadding(): { top, bottom, left, right } {
  if (!isPanelOpen && !isProfileOpen) return { all: 20px };

  const panelWidthPx = remToPx(overlayLayoutService.panelsWidth());
  return { top: 20, bottom: 20, left: 20, right: 20 + panelWidthPx };
}
```

### `fitWithRetry(geo, { maxZoom })`

Relance le zoom jusqu'à 6 fois avec backoff exponentiel (début 80ms, max 2000ms) si le style
MapLibre n'est pas encore chargé. Évite les erreurs de timing au démarrage.

---

## 9. CALCUL DES BOUNDS — `MapGeojsonBoundsService`

Parcourt récursivement tous les types GeoJSON pour extraire les coordonnées :

| Type GeoJSON | Stratégie |
|---|---|
| `Point` | 1 coordonnée |
| `MultiPoint` / `LineString` | tableau plat |
| `Polygon` / `MultiLineString` | `.flat(1)` |
| `MultiPolygon` | `.flat(2)` |
| `GeometryCollection` | récursif |

Retourne `[minLng, minLat], [maxLng, maxLat]` → `LngLatBoundsLike` pour MapLibre.

---

## 10. FILTRAGE DES INTERVENTIONS SUR LA CARTE

Le filtre est un Signal dans `MapSourceService` :

```typescript
interventionListFilter = signal<InterventionListFilter>({
  personId: null,      // filtrer par personne
  personLabel: null,   // label d'affichage
  personType: null,    // 'technician' | 'user'
  status: null,        // filtre par statut
})
```

L'`effect()` dans `MapComponent` recalcule et pousse les données filtrées à chaque changement :

```typescript
effect(() => {
  const fc = interventionService.interventionsFc();   // toutes les interventions
  const filter = mapSourceService.interventionListFilter();

  const filteredFc = {
    features: fc.features.filter((f) => {
      // filtre sur technicianId ou reporterId selon personType
      // filtre sur status
    })
  };

  src.setData(filteredFc);  // mise à jour immédiate sur la carte
});
```

---

## 11. PERSISTANCE DU DÉPARTEMENT EN `localStorage`

Le département de l'opérateur est mis en cache dans `localStorage` pour éviter
une re-requête à chaque rechargement de page :

```typescript
// DepartmentService — au constructeur
const raw = localStorage.getItem('departementWithGeom');
if (raw) this.personDepartmentWithGeom.set(JSON.parse(raw));

// Après fetch réussi
localStorage.setItem('departementWithGeom', JSON.stringify(data));

// Au logout
localStorage.removeItem('departementWithGeom');
```

---

## 12. CACHE DES URLs PHOTOS (55 SECONDES)

Les URLs S3 presignées expirent après 60s côté API. Le frontend maintient un cache
in-memory de **55 secondes** pour éviter des requêtes inutiles :

```typescript
private readonly photoUrlCache = new Map<string, { urls: string[], expiresAt: number }>();
private readonly PHOTO_URL_TTL_MS = 55_000;

getInterventionPhotoUrlsCached(interventionId: string): Observable<{ urls: string[] }> {
  const cached = this.photoUrlCache.get(interventionId);
  if (cached && cached.expiresAt > Date.now()) return of({ urls: cached.urls });

  return this.getInterventionPhotoUrls(interventionId).pipe(
    tap(({ urls }) => {
      this.photoUrlCache.set(interventionId, {
        urls,
        expiresAt: Date.now() + 55_000,
      });
    })
  );
}
```

---

## 13. POINTS D'ATTENTION

| Sujet | Détail |
|-------|--------|
| **`promoteId: 'id'`** | La source `interventions` est créée avec `promoteId: 'id'` — les features utilisent leur propriété `id` comme identifiant MapLibre (nécessaire pour le state hover/selected) |
| **Géométrie `string` vs `object`** | La réponse API peut retourner `geom` comme string JSON ou comme objet. Partout dans le code : `typeof geom === 'string' ? JSON.parse(geom) : geom` |
| **`isStyleLoaded()` check** | Toutes les opérations sur les sources/layers sont gardées par `map.isStyleLoaded()` + retry si false |
| **Chargement progressif des départements** | Les départements sont chargés page par page (5 par page). La carte se met à jour à chaque page reçue — l'utilisateur voit les polygones apparaître progressivement |
| **Reset de vue** | Quand tous les filtres sont effacés ET qu'aucune intervention n'est sélectionnée → la carte revient sur `homeFeature` (le département de l'opérateur) via `fitWithRetry` |
| **`MapRefService`** | Expose l'instance `Map` globalement. Permet à n'importe quel service d'appeler `mapFitService.redirectToMap()` sans passer par `@Input` |

---

*Fiche générée pour civic-ops / fil-rouge — Ynov M2 Cloud*
*Référence code : `front/src/app/components/map/`, `front/src/app/services/map/`,*
*`front/src/app/services/intervention.service.ts`, `front/src/app/services/department.service.ts`*
