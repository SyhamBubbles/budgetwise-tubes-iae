# 💰 BudgetWise - Personal Finance & Patungan App

Aplikasi keuangan pribadi berbasis **Microservices Architecture** yang membantu pengguna mengelola transaksi, budget, dan fitur **Patungan** (tabungan bersama) dengan teman/keluarga.

![Tech Stack](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=flat&logo=mysql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)
![GraphQL](https://img.shields.io/badge/GraphQL-E10098?style=flat&logo=graphql&logoColor=white)

---

## 📋 Fitur Utama

- **🔐 Authentication** - Register & Login dengan JWT
- **💳 Transactions** - Catat pemasukan & pengeluaran
- **📊 Budgets** - Atur limit budget per kategori
- **👥 Patungan (Rooms)** - Fitur tabungan bersama:
  - Buat room dengan target amount
  - Invite teman via kode unik
  - Kontribusi ke tabungan bersama
  - Lihat progress dan kontribusi masing-masing
- **📈 Analytics** - Dashboard statistik keuangan (GraphQL)
- **🔔 Notifications** - Notifikasi real-time

---

## 🏗️ Arsitektur

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
│                      localhost:5173                          │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                    API Gateway                               │
│                    localhost:8000                            │
└──┬──────┬──────┬──────┬──────┬──────┬───────────────────────┘
   │      │      │      │      │      │
   ▼      ▼      ▼      ▼      ▼      ▼
┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐┌──────────┐
│User  ││Trans ││Budget││Room  ││Notif ││Analytics │
│:3001 ││:3002 ││:3003 ││:3004 ││:3005 ││:4000     │
└──┬───┘└──┬───┘└──┬───┘└──┬───┘└──┬───┘└──┬───────┘
   │       │       │       │       │       │
   └───────┴───────┴───────┼───────┴───────┘
                           │
              ┌────────────┴────────────┐
              │                         │
         ┌────▼────┐              ┌─────▼────┐
         │  MySQL  │              │  Redis   │
         │  :3307  │              │  :6379   │
         └─────────┘              └──────────┘
```

---

## 🚀 Cara Menjalankan

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (wajib)
- [Node.js 18+](https://nodejs.org/) (untuk frontend development)

### 1️⃣ Clone Repository

```bash
git clone https://github.com/SyhamBubbles/budgetwise-tubes-iae.git
cd budgetwise-tubes-iae
```

### 2️⃣ Jalankan Backend (Docker)

```bash
# Build dan jalankan semua services
docker-compose up --build

# Atau jalankan di background
docker-compose up --build -d
```

Tunggu sampai semua services healthy (~1-2 menit pertama kali).

### 3️⃣ Jalankan Frontend

Buka terminal baru:

```bash
cd frontend
npm install
npm run dev
```

### 4️⃣ Akses Aplikasi

| Service | URL |
|---------|-----|
| 🌐 **Frontend** | http://localhost:5173 |
| 🔌 **API Gateway** | http://localhost:8000 |
| 📊 **GraphQL Playground** | http://localhost:4000/graphql |
| 🗄️ **phpMyAdmin** | http://localhost:5050 |

---

## 📁 Struktur Project

```
budgetwise-tubes-iae/
├── api-gateway/          # API Gateway (Express.js)
├── services/
│   ├── user-service/     # Auth & User management
│   ├── transaction-service/
│   ├── budget-service/
│   ├── room-service/     # Patungan feature
│   ├── notification-service/
│   └── analytics-service/  # GraphQL
├── frontend/             # React + Vite + TailwindCSS
├── database/
│   └── migrations/       # SQL migrations
├── shared/
│   └── keys/             # JWT RSA keys
└── docker-compose.yml
```

---

## 🔑 Default Test Account

Setelah aplikasi berjalan, kamu bisa register akun baru atau gunakan:

```
Email: test@example.com
Password: password123
```

---

## 🛑 Menghentikan Aplikasi

```bash
# Stop semua containers
docker-compose down

# Stop dan hapus volumes (reset database)
docker-compose down -v
```

---

## 📝 Tech Stack

**Backend:**
- Node.js + Express.js
- MySQL 8.0
- Redis (caching & pub/sub)
- GraphQL (Apollo Server)
- JWT (RS256)

**Frontend:**
- React 18 + TypeScript
- Vite
- TailwindCSS + shadcn/ui
- React Query
- Apollo Client

**DevOps:**
- Docker & Docker Compose

---

## 👨‍💻 Author

Dibuat untuk Tugas Besar mata kuliah **Integrasi Aplikasi Enterprise (IAE)**
