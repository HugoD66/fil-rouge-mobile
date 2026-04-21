# Direction Artistique — Fil Rouge Mobile

> Ce document centralise toutes les décisions visuelles du projet : couleurs, typographie, espacements, composants et tokens de design. À utiliser comme référence pour le développement de l'application mobile.

---

## Palette de couleurs

### Variables CSS globales

Ces variables sont définies dans `:root` et doivent être reprises à l'identique dans le projet mobile.

| Variable | Valeur | Rôle |
|---|---|---|
| `--color-brand-green` | `#15803d` | Couleur principale de la marque (vert) |
| `--color-brand-orange` | `#f97316` | Couleur secondaire / accent (orange) |
| `--color-surface` | `#ffffff` | Fond des cartes et panneaux |
| `--color-muted` | `#f8fafc` | Fond des sections secondaires |
| `--color-text` | `#0f172a` | Texte principal |
| `--color-text-muted` | `#64748b` | Texte secondaire / labels |
| `--color-success` | `#46e480` | État succès |
| `--color-danger` | `#d14949` | État erreur / danger |
| `--color-warning` | `#f59e0b` | État avertissement |
| `--color-info` | `#3b82f6` | État informatif |
| `--color-border` | `#e2e8f0` | Bordures standard |
| `--color-border-soft` | `#f1f5f9` | Bordures légères |

---

### Statuts des interventions

Ces couleurs sont dédiées à l'affichage du statut d'une intervention.

| Variable | Valeur | Statut |
|---|---|---|
| `--itv-pending` | `#f97316` | En attente |
| `--itv-planned` | `#8b5cf6` | Planifiée |
| `--itv-in-progress` | `#3b82f6` | En cours |
| `--itv-completed` | `#22c55e` | Terminée |
| `--itv-cancelled` | `#6b7280` | Annulée |
| `--itv-default` | `#e5e7eb` | Inconnu / par défaut |

---

## Typographie

Le projet ne définit pas de police custom — la police système est utilisée par défaut via Tailwind CSS.

### Échelle typographique (Tailwind)

| Classe | Taille | Utilisation |
|---|---|---|
| `text-xs` | 0.75rem / 12px | Labels, badges, erreurs |
| `text-sm` | 0.875rem / 14px | Texte secondaire, sous-titres |
| `text-base` | 1rem / 16px | Texte courant |
| `text-lg` | 1.125rem / 18px | Titres de section |
| `text-xl` | 1.25rem / 20px | Titres principaux |

### Graisses utilisées

| Classe | Valeur | Utilisation |
|---|---|---|
| `font-normal` | 400 | Corps de texte |
| `font-medium` | 500 | Labels, badges |
| `font-semibold` | 600 | Titres |
| `font-bold` | 700 | Emphase forte |

### Couleurs texte

| Usage | Classe Tailwind | Variable CSS |
|---|---|---|
| Texte principal | `text-gray-900` | `--color-text` |
| Texte secondaire | — | `--color-text-muted` (`#64748b`) |
| Label | — | `--color-text-muted` |
| Accent orange | — | `--color-brand-orange` |

---

## Espacements

Basés sur l'échelle Tailwind (1 unit = 0.25rem = 4px).

| Valeur Tailwind | px | Utilisation |
|---|---|---|
| `p-1` / `gap-1` | 4px | Micro-espacement |
| `p-2` / `gap-2` | 8px | Espacement interne des badges, icônes |
| `p-3` / `gap-3` | 12px | Espacement interne des boutons |
| `p-4` | 16px | Padding des cartes et sections |
| `mb-1` | 4px | Espacement sous label |
| `mb-3` | 12px | Espacement entre champs |
| `mb-6` / `mt-6` | 24px | Espacement entre blocs |

---

## Bordures & Rayons

| Token | Valeur | Utilisation |
|---|---|---|
| `rounded` | 0.25rem | Rayon par défaut (Tailwind) |
| `rounded-md` | 0.375rem | Inputs |
| `rounded-lg` | 0.5rem | Cartes |
| `rounded-full` | 9999px | Avatars, badges pills |
| `rounded-ui` | `0.75rem` | Token custom — cartes UI, panneaux |

---

## Ombres

| Token | Valeur | Utilisation |
|---|---|---|
| `shadow-sm` | `0 1px 2px 0 rgb(0 0 0 / 0.05)` | Boutons, cartes |
| `shadow-ui` | `0 1px 2px 0 rgb(0 0 0 / 0.05)` | Token custom — même valeur que `shadow-sm` |
| `inset-shadow` | *(inset shadow)* | Toolbar |

---

## Composants UI

### Cartes

| Classe | Description |
|---|---|
| `.ui-card` | Carte avec bordure, fond `surface`, ombre, rayon `rounded-lg` |
| `.ui-card-padding` | Utilitaire de padding `p-4` pour l'intérieur d'une carte |
| `.ui-panel` | Combinaison de `.ui-card` + `.ui-card-padding` |
| `.ui-section` | Section avec fond `muted` et rayon |
| `.ui-map-card` | Carte spécifique à l'affichage de carte géographique |
| `.ui-map-shell` | Conteneur principal d'une vue carte |

---

### Formulaires

| Classe | Description |
|---|---|
| `.ui-label` | Label de champ — `text-xs`, `font-medium`, couleur `text-muted` |
| `.ui-input` | Input pleine largeur — bordure, focus ring, rayon `rounded-md` |
| `.ui-error` | Message d'erreur — `text-xs`, couleur `danger` |

---

### Boutons

| Classe | Style | Utilisation |
|---|---|---|
| `.ui-btn` | Base — gap, rayon, ombre | Tous les boutons |
| `.ui-btn-primary` | Fond sombre, texte blanc | Action principale |
| `.ui-btn-secondary` | Fond `muted` | Action secondaire |
| `.ui-btn-ghost` | Transparent, hover léger | Action tertiaire |
| `.ui-btn-success` | Fond vert (`success`) | Confirmation |
| `.ui-btn-danger` | Fond rouge (`danger`) | Suppression |
| `.ui-btn-submit` | Pleine largeur | Formulaires |
| `.ui-icon-btn` | Carré 8×8 (32px) | Bouton icône seul |

**États des boutons :**
- **Disabled** : `opacity: 0.4`, `cursor: not-allowed`, icônes en `grayscale(1)`
- **Hover** : fond légèrement assombri selon la variante
- **Active** : fond encore plus sombre

---

### Badges

| Classe | Couleur | Utilisation |
|---|---|---|
| `.ui-badge` | Base — `text-xs`, `font-medium` | Badge générique |
| `.ui-badge-success` | Vert | Statut positif |
| `.ui-badge-warning` | Amber | Avertissement |
| `.ui-badge-danger` | Rouge | Erreur / critique |
| `.ui-badge-neutral` | Gris neutre | Statut neutre |

---

### Alertes

| Classe | Couleur | Utilisation |
|---|---|---|
| `.ui-alert` | Base | Alerte générique |
| `.ui-alert-success` | Vert | Succès d'une action |
| `.ui-alert-danger` | Rouge | Erreur |
| `.ui-alert-warning` | Amber | Avertissement |

---

### Icônes de statut

| Classe | Couleur | Description |
|---|---|---|
| `.ui-icon-status-error` | Rouge | Icône d'erreur |
| `.ui-icon-status-success` | Vert | Icône de succès |

---

### Composant Brand (Logo + Nom)

Structure du composant identitaire de l'application :

| Classe | Description |
|---|---|
| `.ui-brand` | Conteneur flex horizontal, `gap-3` |
| `.ui-brand-logo` | Cercle 48×48px avec dégradé (`brand-green` → `brand-orange`) |
| `.ui-brand-logo-inner` | Conteneur intérieur du logo |
| `.ui-brand-logo-img` | Image du logo dans le cercle |
| `.ui-brand-text` | Bloc texte aligné à gauche |
| `.ui-brand-title` | Titre — `text-lg`, `font-semibold` |
| `.ui-brand-accent` | Partie en accent orange du titre |
| `.ui-brand-subtitle` | Sous-titre de la marque |

---

### Layout d'authentification

| Classe | Description |
|---|---|
| `.ui-auth-layout` | Layout pleine hauteur, centré (flex + items-center + justify-center) |
| `.ui-auth-container` | Conteneur centré, largeur max `max-w-md` |
| `.ui-auth-header` | Espacement du header (mb-6) |
| `.ui-auth-footer` | Texte de bas de page — `text-sm`, `text-muted`, centré |

---

### Toolbar de carte

| Classe | Description |
|---|---|
| `.ui-map-toolbar` | Barre d'outils flex avec ombre intérieure |
| `.ui-map-toolbar-title` | Titre de la toolbar |
| `.ui-map-toolbar-subtitle` | Sous-titre de la toolbar |
| `.ui-map-container` | Conteneur de la vue carte |
| `.ui-map-frame` | Cadre de la carte avec fond |

---

### Bouton icône inline (`.font-icon-button`)

Bouton texte avec icône :

- Padding : `6px`
- Bordure + rayon
- Transition sur fond
- **Hover** : fond clair
- **Active** : fond sombre
- **Disabled** : `opacity: 0.5`, `cursor: not-allowed`

---

## Tokens Tailwind personnalisés

Ces tokens sont définis dans `tailwind.config.js` et mappent vers les variables CSS.

### Couleurs

| Token | Variable CSS |
|---|---|
| `surface` | `--color-surface` |
| `muted` | `--color-muted` |
| `border` | `--color-border` |
| `text` | `--color-text` |
| `text-muted` | `--color-text-muted` |
| `brand-green` | `--color-brand-green` |
| `brand-orange` | `--color-brand-orange` |
| `borderSoft` | `--color-border-soft` |
| `success` | `--color-success` |
| `warning` | `--color-warning` |
| `danger` | `--color-danger` |

### Utilitaires

| Token | Valeur | Type |
|---|---|---|
| `rounded-ui` | `0.75rem` | Border radius |
| `shadow-ui` | `0 1px 2px 0 rgb(0 0 0 / 0.05)` | Box shadow |

---

## Règles globales

- **Fond de page** : blanc (`bg-white`)
- **Texte par défaut** : `text-gray-900`
- **Police** : police système (san-serif native)
- **Icônes** : FontAwesome (library enregistrée dans l'app config)
- **Transitions** : légères, sur les hover/active — ne pas animer de façon excessive sur mobile

---

## Références de fichiers source

| Fichier | Contenu |
|---|---|
| `front/src/styles/colors.scss` | Variables CSS des couleurs |
| `front/src/styles/ui.scss` | Classes des composants UI |
| `front/src/styles/button.scss` | États des boutons et `.font-icon-button` |
| `front/src/styles/intervention-status.scss` | Variables de statuts d'intervention |
| `front/src/styles.scss` | Entry point — imports globaux + body |
| `front/tailwind.config.js` | Tokens Tailwind personnalisés |
