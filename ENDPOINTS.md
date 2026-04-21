# API Reference — Fil Rouge

> Base URL: `http://localhost:3000`  
> Authentication: Bearer JWT token via `Authorization: Bearer <token>` header

---

## Authentication

### POST `/security/register`

Register a new user account.

**Auth required:** No

**Request body:**

| Field | Type | Required | Constraints | Description |
|---|---|---|---|---|
| `firstName` | string | Yes | 2–50 chars | First name |
| `lastName` | string | Yes | 2–50 chars | Last name |
| `email` | string | Yes | valid email | Email address |
| `password` | string | Yes | 2–50 chars | Password |
| `avatarKey` | string | No | S3 object key | Avatar image key |
| `address` | string | No | — | Postal address |
| `role` | string | No | `user` \| `technician` | User role |

**Response:** `Person` object

---

### POST `/security/login`

Authenticate and receive a JWT token.

**Auth required:** No

**Request body:**

| Field | Type | Required | Constraints | Description |
|---|---|---|---|---|
| `email` | string | Yes | valid email | Email address |
| `password` | string | Yes | 2–50 chars | Password |

**Response:**

```json
{
  "accessToken": "string",
  "expiresIn": 3600,
  "user": { ...Person },
  "organization": { ...Organization } | null
}
```

---

### GET `/security/me`

Get the currently authenticated user's profile.

**Auth required:** Yes (JWT + blacklist check)

**Response:** `Person` object

---

### POST `/security/logout`

Invalidate the current JWT token.

**Auth required:** Yes

**Response:**

```json
{ "message": "string" }
```

---

## Person

### GET `/person`

Get all persons with optional filters.

**Auth required:** Yes

**Query parameters:**

| Param | Type | Required | Description |
|---|---|---|---|
| *(FindPersonDto fields)* | — | No | Filter criteria |

**Response:** `Person[]`

---

### GET `/person/search`

Search persons by name and zip code.

**Auth required:** Yes

**Query parameters:**

| Param | Type | Required | Description |
|---|---|---|---|
| `q` | string | Yes | Search query (name) |
| `zipCode` | string | Yes | Zip code filter |
| `role` | string | No | `user` \| `technician` |

**Response:** `PersonSearchResultDto`

---

### GET `/person/:id`

Get a person by their UUID.

**Auth required:** Yes

**Path parameters:**

| Param | Type | Description |
|---|---|---|
| `id` | UUID | Person identifier |

**Response:** `Person`

---

### PATCH `/person/:id`

Update a person's details.

**Auth required:** Yes

**Path parameters:**

| Param | Type | Description |
|---|---|---|
| `id` | UUID | Person identifier |

**Request body (all fields optional):**

| Field | Type | Description |
|---|---|---|
| `firstName` | string | First name |
| `lastName` | string | Last name |
| `email` | string | Email address |
| `address` | string | Postal address |
| `role` | string | `user` \| `technician` |
| `avatarKey` | string | S3 object key for avatar |

**Response:** `Person`

---

### DELETE `/person/:id`

Delete a person.

**Auth required:** Yes

**Path parameters:**

| Param | Type | Description |
|---|---|---|
| `id` | UUID | Person identifier |

**Response:** `204 No Content`

---

### GET `/person/:operatorId/reduced-technicians`

Get a reduced list of technicians available for assignment.

**Auth required:** Yes

**Path parameters:**

| Param | Type | Description |
|---|---|---|
| `operatorId` | UUID | Operator's identifier |

**Response:**

```json
[
  {
    "id": "uuid",
    "firstName": "string",
    "lastName": "string"
  }
]
```

---

### POST `/person/:id/avatar/presign`

Get an S3 presigned URL to upload an avatar image.

**Auth required:** Yes

**Path parameters:**

| Param | Type | Description |
|---|---|---|
| `id` | UUID | Person identifier |

**Response:**

```json
{
  "uploadUrl": "https://...",
  "key": "s3-object-key"
}
```

---

### GET `/person/:id/avatar/url`

Get an S3 presigned URL to read an avatar image.

**Auth required:** Yes

**Path parameters:**

| Param | Type | Description |
|---|---|---|
| `id` | UUID | Person identifier |

**Response:**

```json
{ "url": "https://..." | null }
```

---

### POST `/person/:id/invite-technician`

Invite/create a technician linked to an operator.

**Auth required:** Yes

**Path parameters:**

| Param | Type | Description |
|---|---|---|
| `id` | UUID | Operator's identifier |

**Request body:**

| Field | Type | Required | Constraints | Description |
|---|---|---|---|---|
| `firstName` | string | Yes | 2–50 chars | First name |
| `lastName` | string | Yes | 2–50 chars | Last name |
| `email` | string | Yes | valid email | Email address |
| `address` | string | No | — | Postal address |
| `role` | string | No | `user` \| `technician` | Role |

**Response:** `Person`

---

## Organization

### POST `/organization`

Create a new organization.

**Auth required:** Yes

**Request body:**

| Field | Type | Required | Constraints | Description |
|---|---|---|---|---|
| `city` | string | Yes | 2–50 chars | City name |
| `zipCode` | string | Yes | exactly 2 digits | Zip code |
| `technicians` | PartialPersonDto[] | Yes | — | Associated technicians |

**Response:** `Organization`

---

### GET `/organization`

Get all organizations.

**Auth required:** No

**Response:** `Organization[]`

---

### GET `/organization/:id`

Get an organization by UUID.

**Auth required:** No

**Path parameters:**

| Param | Type | Description |
|---|---|---|
| `id` | UUID | Organization identifier |

**Response:** `Organization`

---

### PATCH `/organization/:id`

Update an organization.

**Auth required:** No

**Path parameters:**

| Param | Type | Description |
|---|---|---|
| `id` | UUID | Organization identifier |

**Request body (all fields optional):**

| Field | Type | Constraints | Description |
|---|---|---|---|
| `city` | string | 2–50 chars | City name |
| `zipCode` | string | 2 digits | Zip code |
| `technicianIds` | UUID[] | — | List of technician UUIDs |

**Response:** `Organization`

---

### DELETE `/organization/:id`

Delete an organization.

**Auth required:** Yes

**Path parameters:**

| Param | Type | Description |
|---|---|---|
| `id` | UUID | Organization identifier |

**Response:** `204 No Content`

---

## Intervention

### POST `/intervention`

Create a new intervention report.

**Auth required:** No

**Request body:**

| Field | Type | Required | Constraints | Description |
|---|---|---|---|---|
| `reporterId` | UUID | Yes | — | ID of the reporting person |
| `name` | string | Yes | 3–255 chars | Intervention title |
| `description` | string | No | — | Detailed description |
| `zipcode` | string | Yes | 2–10 chars | Location zip code |
| `coordinates` | GeoJSON Geometry | No | — | Geographic coordinates |
| `photoKeys` | string[] | No | max 5 items | S3 keys for photos |

**Response:** `Intervention`

---

### GET `/intervention/with-geom`

Get all interventions including geographic data.

**Auth required:** Yes

**Query parameters:**

| Param | Type | Required | Description |
|---|---|---|---|
| `zipCode` | string | No | Filter by zip code |

**Response:** `InterventionWithGeom[]`

---

### GET `/intervention/search`

Search interventions by text and location.

**Auth required:** Yes

**Query parameters:**

| Param | Type | Required | Description |
|---|---|---|---|
| `zipCode` | string | Yes | Location zip code |
| `q` | string | Yes | Search query |

**Response:** `InterventionWithGeom[]`

---

### GET `/intervention/:id`

Get an intervention by ID.

**Auth required:** Yes

**Path parameters:**

| Param | Type | Description |
|---|---|---|
| `id` | string | Intervention identifier |

**Response:** `Intervention`

---

### PATCH `/intervention/:id`

Update an intervention.

**Auth required:** Yes

**Path parameters:**

| Param | Type | Description |
|---|---|---|
| `id` | string | Intervention identifier |

**Request body (all fields optional):**

| Field | Type | Constraints | Description |
|---|---|---|---|
| `reporterId` | UUID | — | Reporter ID |
| `name` | string | 3–255 chars | Title |
| `description` | string | — | Description |
| `zipcode` | string | 2–10 chars | Zip code |
| `coordinates` | GeoJSON Geometry | — | Coordinates |
| `photoKeys` | string[] | max 5 | S3 photo keys |

**Response:** `Intervention`

---

### DELETE `/intervention/:id`

Delete an intervention.

**Auth required:** Yes

**Path parameters:**

| Param | Type | Description |
|---|---|---|
| `id` | string | Intervention identifier |

**Response:** `204 No Content`

---

### POST `/intervention/:id/photos/presign`

Get an S3 presigned URL to upload a photo for an intervention.

**Auth required:** Yes

**Path parameters:**

| Param | Type | Description |
|---|---|---|
| `id` | string | Intervention identifier |

**Request body:**

| Field | Type | Required | Description |
|---|---|---|---|
| `contentType` | string | No | MIME type (e.g. `image/jpeg`) |

**Response:**

```json
{
  "uploadUrl": "https://...",
  "key": "s3-object-key"
}
```

---

### GET `/intervention/:id/photos/urls`

Get presigned S3 URLs for all photos of an intervention.

**Auth required:** Yes

**Path parameters:**

| Param | Type | Description |
|---|---|---|
| `id` | string | Intervention identifier |

**Response:**

```json
{ "urls": ["https://...", "https://..."] }
```

---

### PATCH `/intervention/:id/launch`

Assign a technician and schedule an intervention.

**Auth required:** Yes

**Path parameters:**

| Param | Type | Description |
|---|---|---|
| `id` | string | Intervention identifier |

**Request body:**

| Field | Type | Required | Description |
|---|---|---|---|
| `technicianId` | UUID | Yes | Assigned technician's ID |
| `scheduledDate` | string (ISO 8601) | Yes | Planned date/time |

**Response:** `Intervention`

---

## Departement

### POST `/departement`

Create a department with geographic data.

**Auth required:** No

**Request body:**

| Field | Type | Required | Description |
|---|---|---|---|
| `zipCode` | string | Yes | Department zip code |
| `name` | string | Yes | Department name |
| `coordinate` | CreateCoordinateDto | Yes | Geographic data |

**CreateCoordinateDto:**

| Field | Type | Description |
|---|---|---|
| `geom` | GeoJSON Geometry | Point, Polygon, MultiPolygon, etc. |

**Response:** `Departement`

---

### GET `/departement/with-geom`

Get all departments including geographic data.

**Auth required:** No

**Response:** `DepartementWithGeom[]`

---

### GET `/departement/with-geom-temp-paginated`

Get departments with geographic data, paginated.

**Auth required:** No

**Query parameters (PageOptionsDto):**

| Param | Type | Required | Description |
|---|---|---|---|
| `page` | number | No | Page number |
| `take` | number | No | Items per page |

**Response:** `PageDto<DepartementWithGeomDto>`

---

### GET `/departement`

Get all departments (without geometry).

**Auth required:** Yes

**Response:** `Departement[]`

---

### GET `/departement/:id`

Get a department by ID.

**Auth required:** Yes

**Path parameters:**

| Param | Type | Description |
|---|---|---|
| `id` | string | Department identifier |

**Response:** `Departement`

---

### DELETE `/departement/:id`

Delete a department.

**Auth required:** No

**Path parameters:**

| Param | Type | Description |
|---|---|---|
| `id` | string | Department identifier |

**Response:** `204 No Content`

---

### GET `/departement/:personId/with-geom`

Get the department (with geometry) assigned to a person.

**Auth required:** Yes

**Path parameters:**

| Param | Type | Description |
|---|---|---|
| `personId` | UUID | Person identifier |

**Response:** `DepartementWithGeom | null`

---

## Coordinate

### POST `/coordinate`

Create a coordinate.

**Auth required:** Yes

**Request body:**

| Field | Type | Required | Description |
|---|---|---|---|
| `geom` | GeoJSON Geometry | Yes | Geographic geometry |

**Response:** `Coordinate`

---

### GET `/coordinate`

Get all coordinates.

**Auth required:** No

**Response:** `Coordinate[]`

---

### GET `/coordinate/:id`

Get a coordinate by ID.

**Auth required:** No

**Path parameters:**

| Param | Type | Description |
|---|---|---|
| `id` | string | Coordinate identifier |

**Response:** `Coordinate`

---

## Storage

### GET `/storage/health`

Check S3 bucket connectivity.

**Auth required:** No

**Response:**

```json
{
  "ok": true,
  "bucket": "string",
  "endpoint": "string",
  "region": "string",
  "forcePathStyle": true,
  "error": "string"
}
```

---

## Enums

### Role

| Value | Description |
|---|---|
| `user` | Standard user / reporter |
| `technician` | Field technician |

### Intervention Status

| Value | Color | Description |
|---|---|---|
| `pending` | `#f97316` Orange | Awaiting assignment |
| `planned` | `#8b5cf6` Purple | Scheduled |
| `in_progress` | `#3b82f6` Blue | Ongoing |
| `completed` | `#22c55e` Green | Finished |
| `cancelled` | `#6b7280` Gray | Cancelled |

---

## Common Response Models

### Person

```json
{
  "id": "uuid",
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "address": "string | null",
  "role": "user | technician",
  "avatarKey": "string | null"
}
```

### Organization

```json
{
  "id": "uuid",
  "city": "string",
  "zipCode": "string",
  "technicians": [Person]
}
```

### Intervention

```json
{
  "id": "string",
  "name": "string",
  "description": "string | null",
  "zipcode": "string",
  "status": "pending | planned | in_progress | completed | cancelled",
  "reporterId": "uuid",
  "technicianId": "uuid | null",
  "scheduledDate": "ISO8601 | null",
  "photoKeys": ["string"],
  "coordinates": "GeoJSON | null"
}
```
