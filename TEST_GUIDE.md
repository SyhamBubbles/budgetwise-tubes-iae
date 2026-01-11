# BudgetWise - Complete Testing Guide

Panduan lengkap untuk menguji semua fitur aplikasi BudgetWise.

---

## ✅ Status: COMPLETE

Semua fitur utama sudah berfungsi dengan baik!

---

## 🚀 Cara Menjalankan

```bash
# 1. Start Backend
cd "c:\Syiham\budgetwise microservice"
docker-compose up -d

# 2. Start Frontend
cd frontend
npm run dev

# Frontend: http://localhost:5173
# phpMyAdmin: http://localhost:5050
```

---

## 🔐 Validasi Input

| Field | Rules |
|-------|-------|
| Email | Harus `@gmail.com` |
| Password | Min 8 karakter, 1 huruf kapital, 1 angka |

**Password Toggle:** Klik icon 👁️ untuk show/hide password

---

## 🧪 Test Cases

### 1. Register / Login

| Action | Expected |
|--------|----------|
| Register dengan `email@gmail.com`, `Password123` | ✅ Redirect ke Dashboard |
| Email bukan Gmail | ❌ Error: "Only Gmail addresses..." |
| Password tanpa kapital | ❌ Error: "...uppercase letter" |
| Password tanpa angka | ❌ Error: "...1 number" |
| Login dengan kredensial valid | ✅ Redirect ke Dashboard |
| Logout (icon di sidebar) | ✅ Redirect ke Login |

### 2. Dashboard

| Action | Expected |
|--------|----------|
| Tambah transaksi Income | ✅ Balance dan Income terupdate |
| Tambah transaksi Expense | ✅ Expenses terupdate, Savings Rate berubah |

### 3. Transactions

| Action | Expected |
|--------|----------|
| Klik "Add Transaction" | ✅ Dialog muncul |
| Pilih Income/Expense, isi form | ✅ Transaksi tersimpan |
| Klik icon hapus | ✅ Transaksi terhapus |

### 4. Budgets

| Action | Expected |
|--------|----------|
| Klik "Create Budget" | ✅ Dialog muncul |
| Isi form, klik Create | ✅ Budget card dengan progress bar |
| Expense > 80% budget | ⚠️ "Near Limit" (kuning) |
| Expense > 100% budget | 🔴 "Over Budget!" (merah) |

### 5. Rooms

| Action | Expected |
|--------|----------|
| Create Room | ✅ Room dengan room code |
| Join Room (dengan code) | ✅ Room muncul di list |
| Klik Room → Add Expense | ✅ Dialog untuk shared expense |
| Room transactions muncul | ✅ List transaksi room |

---

## 🔧 API Health Check

```
GET http://localhost:8000/health → {"status":"ok"}
```

---

## 📝 Notes

- **Port:** Jika port 5173 sudah dipakai, frontend akan pakai 5174
- **MySQL:** Port 3307 (bukan 3306 default)
- **Data:** Docker volume menyimpan data, `docker-compose down -v` akan menghapus

---

**Aplikasi BudgetWise 100% COMPLETE! 🎉**
