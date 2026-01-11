# BudgetWise

Aplikasi keuangan pribadi berbasis Microservices yang membantu pengguna mengelola transaksi, budget, dan fitur Patungan (tabungan bersama).

## Fitur Utama

- **Authentication** - Register & Login dengan JWT
- **Transactions** - Catat pemasukan & pengeluaran
- **Budgets** - Atur limit budget per kategori
- **Patungan (Rooms)** - Fitur tabungan bersama:
  - Buat room dengan target amount
  - Invite teman via kode unik
  - Kontribusi ke tabungan bersama
  - Lihat progress dan kontribusi masing-masing
- **Analytics** - Dashboard statistik keuangan
- **Notifications** - Notifikasi real-time

## Cara Menjalankan

### Prerequisites

- Docker Desktop
- Node.js 18+

### 1. Clone Repository

```bash
git clone https://github.com/SyhamBubbles/budgetwise-tubes-iae.git
cd budgetwise-tubes-iae
```

### 2. Jalankan Backend

```bash
docker-compose up --build
```

Tunggu sampai semua services ready (~1-2 menit pertama kali).

### 3. Jalankan Frontend

Buka terminal baru:

```bash
cd frontend
npm install
npm run dev
```

### 4. Akses Aplikasi

- **Frontend**: http://localhost:5173
- **API Gateway**: http://localhost:8000
- **phpMyAdmin**: http://localhost:5050

### Menghentikan Aplikasi

```bash
docker-compose down
```
