# Dev Setup — Lancer l'app

## Laptop + appareil physique

```bash
# 1. Vérifie ton IP (change à chaque reconnexion WiFi)
ip addr show | grep 'inet ' | grep -v '127.0.0.1'

# 2. Met à jour .env.local
EXPO_PUBLIC_API_URL=http://<ip-laptop>:3000

# 3. Lance le backend (depuis le dossier API)

# 4. Lance Expo
npx expo start
```

## PC fixe + émulateur Android

```bash
# 1. .env.local — IP fixe, pas besoin de la changer
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000

# 2. Lance le backend normalement

# 3. Lance Expo
npx expo start --android
```

> `10.0.2.2` est l'alias fixe de l'émulateur Android vers `localhost` de la machine hôte.

## Cheatsheet `.env.local`

| Contexte | `EXPO_PUBLIC_API_URL` |
|---|---|
| Laptop + téléphone | `http://<ip-laptop>:3000` (vérifier avec `ip addr show`) |
| PC fixe + émulateur | `http://10.0.2.2:3000` |

## Prérequis une fois (laptop)

```bash
# Ouvrir le port 3000 dans UFW
sudo ufw allow 3000/tcp
```
