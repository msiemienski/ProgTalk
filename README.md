# 🚀 ProgTalk - Społeczność Programistów

Aplikacja społecznościowa dla programistów umożliwiająca prowadzenie dyskusji technicznych w hierarchicznie zorganizowanych tematach.

## 📋 Spis Treści

- [Opis Projektu](#opis-projektu)
- [Stack Technologiczny](#stack-technologiczny)
- [Wymagania](#wymagania)
- [Instalacja i Uruchomienie](#instalacja-i-uruchomienie)
- [Struktura Projektu](#struktura-projektu)
- [API Endpoints](#api-endpoints)
- [Rozwój](#rozwój)

## 🎯 Opis Projektu

ProgTalk to platforma umożliwiająca:
- 📝 Dyskusje programistyczne w tematach i podtematach
- 🌳 Hierarchiczną strukturę tematów (drzewo)
- 👥 System moderatorów (główni i delegowani)
- 💬 Wpisy z kodem, tekstem i znacznikami technologii
- 🔐 Autoryzację JWT i system ról
- ⚡ Real-time komunikację przez WebSocket (Socket.io)

## 🛠️ Stack Technologiczny

### Backend
- **Node.js** + **Express.js** - REST API
- **MongoDB** + **Mongoose** - Baza danych
- **Socket.io** - WebSocket (WSS)
- **JWT** - Autoryzacja
- **HTTPS** - Bezpieczna komunikacja

### Frontend
- **Vue.js 3** - Framework UI
- **Vue Router** - Routing
- **Axios** - HTTP Client
- **Socket.io Client** - WebSocket
- **Vite** - Build tool

### DevOps
- **Docker** + **Docker Compose** - Konteneryzacja
- **SSL Certificates** - HTTPS/WSS (dev)

## 📦 Wymagania

- **Docker** (wersja 20.10+)
- **Docker Compose** (wersja 2.0+)
- **OpenSSL** (do generowania certyfikatów SSL)

## 🚀 Instalacja i Uruchomienie

### 1. Klonowanie repozytorium

```bash
git clone <repository-url>
cd tsw_projekt
```

### 2. Konfiguracja środowiska

Skopiuj plik `.env.example` do `.env`:

```bash
cp .env.example .env
```

Opcjonalnie edytuj `.env` aby zmienić domyślne ustawienia.

### 3. Generowanie certyfikatów SSL

**Windows (PowerShell):**
```powershell
cd certs
.\generate-certs.ps1
```

**Linux/Mac lub WSL:**
```bash
cd certs
chmod +x generate-certs.sh
./generate-certs.sh
```

### 4. Uruchomienie aplikacji

```bash
docker compose up --build
```

Aplikacja będzie dostępna pod adresami:
- **Frontend**: https://localhost:5173
- **Backend API**: https://localhost:3000
- **Health Check**: https://localhost:3000/api/health

> ⚠️ **Uwaga**: Przeglądarka wyświetli ostrzeżenie o certyfikacie - to normalne dla certyfikatów self-signed. Zaakceptuj ostrzeżenie aby kontynuować.

### 5. Zatrzymanie aplikacji

```bash
docker compose down
```

Aby usunąć również wolumeny (dane MongoDB):
```bash
docker compose down -v
```

## 📁 Struktura Projektu

```
tsw_projekt/
├── backend/                 # Backend Node.js/Express
│   ├── config/             # Konfiguracja (DB, itp.)
│   ├── routes/             # Endpointy API
│   ├── server.js           # Główny plik serwera
│   ├── package.json        # Zależności backend
│   └── Dockerfile          # Docker backend
│
├── frontend/               # Frontend Vue 3
│   ├── src/
│   │   ├── components/    # Komponenty Vue
│   │   ├── views/         # Widoki/strony
│   │   ├── router/        # Konfiguracja routingu
│   │   ├── services/      # Serwisy (API, itp.)
│   │   ├── App.vue        # Główny komponent
│   │   └── main.js        # Entry point
│   ├── package.json       # Zależności frontend
│   ├── vite.config.js     # Konfiguracja Vite
│   └── Dockerfile         # Docker frontend
│
├── certs/                  # Certyfikaty SSL (dev)
│   ├── generate-certs.sh  # Generator (Linux/Mac)
│   └── generate-certs.ps1 # Generator (Windows)
│
├── docker-compose.yml      # Orkiestracja Docker
├── .env.example           # Przykładowa konfiguracja
├── .gitignore             # Git ignore
└── README.md              # Ten plik
```

## 🔌 API Endpoints

### Health Check
```
GET /api/health
```
Zwraca status serwera i połączenia z bazą danych.

**Przykładowa odpowiedź:**
```json
{
  "status": "OK",
  "timestamp": "2026-01-20T01:54:12.000Z",
  "uptime": 123.45,
  "environment": "development",
  "database": {
    "connected": true,
    "state": "connected"
  }
}
```

### Root Endpoint
```
GET /
```
Zwraca informacje o API.

## 🔧 Rozwój

### Hot Reload

Zarówno backend jak i frontend wspierają hot-reload:
- **Backend**: Nodemon automatycznie restartuje serwer przy zmianach
- **Frontend**: Vite automatycznie odświeża przeglądarkę

### Logi

Aby zobaczyć logi konkretnego serwisu:

```bash
# Backend
docker compose logs -f backend

# Frontend
docker compose logs -f frontend

# MongoDB
docker compose logs -f mongo
```

### Dostęp do MongoDB

MongoDB jest dostępne na porcie `27017`:

```bash
# Połączenie przez MongoDB Compass
mongodb://progtalk_user:progtalk_password@localhost:27017/progtalk?authSource=admin

# Lub przez mongosh w kontenerze
docker compose exec mongo mongosh -u progtalk_user -p progtalk_password
```

### Testowanie API

Możesz użyć curl, Postman lub innego narzędzia:

```bash
# Health check
curl -k https://localhost:3000/api/health

# Root endpoint
curl -k https://localhost:3000/
```

## 📝 Następne Kroki (Etapy Projektu)

- [x] **Etap 0**: Fundament projektu (Docker + DevOps) ✅
- [ ] **Etap 1**: Modele danych i autentykacja
- [ ] **Etap 2**: System tematów i moderacji
- [ ] **Etap 3**: Wpisy i komentarze
- [ ] **Etap 4**: Real-time funkcjonalności
- [ ] **Etap 5**: Panel administracyjny

## 📄 Licencja

Projekt edukacyjny - Technologie Sieci Web 2025/2026

## 👨‍💻 Autor

Projekt indywidualny TSW
