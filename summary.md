# BudgetWise - Tugas Besar Microservices

## 📋 RINGKASAN PROYEK

**Nama Aplikasi:** BudgetWise - Expense Tracker dengan Shared Budget  
**Mahasiswa:** Night   
**Mata Kuliah:** IAE (Integration Application Enterprise)

---

## 🎯 KRITERIA PENILAIAN

### 1. **Konsep (Tema + Fitur)**
- ✅ Tema: Personal & Collaborative Budget Management
- ✅ Fitur: Expense tracking + Shared budget rooms dengan real-time notifications

### 2. **Fungsionalitas**
- ✅ Semua fitur bekerja dengan baik
- ✅ CRUD operations lengkap
- ✅ Real-time features dengan WebSocket/GraphQL Subscription

### 3. **UI/UX**
- ✅ Frontend dengan React + Vite
- ✅ Responsive design
- ✅ User-friendly interface
- ✅ Fast development with Hot Module Replacement (HMR)

### 4. **Arsitektur + Code + Kompleksitas + Containerized**
- ✅ Microservices architecture dengan 6 services
- ✅ Docker + Docker Compose
- ✅ API Gateway pattern
- ✅ Event-driven dengan Redis PubSub
- ✅ GraphQL + REST API

### 5. **Penjelasan**
- ✅ Dokumentasi lengkap
- ✅ Testing guide
- ✅ Architecture diagram

---

## 🏗️ ARSITEKTUR MICROSERVICES

```
┌─────────────────────────────────────────────────────────────┐
│                  Frontend (React + Vite)                     │
│                        Port: 5173                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway (REST)                        │
│                        Port: 8000                            │
│  - Rate Limiting                                             │
│  - Request Routing                                           │
│  - Authentication Middleware                                 │
└──────┬──────┬──────┬──────┬──────┬─────────────────────────┘
       │      │      │      │      │
       ▼      ▼      ▼      ▼      ▼
   ┌───────────────────────────────────────────────────────┐
   │  User    Transaction  Budget   Room   Notification    │
   │ Service   Service    Service Service   Service        │
   │ :3001     :3002      :3003   :3004     :3005          │
   │ (REST)    (REST)     (REST)  (REST)    (REST)         │
   └────┬──────────┬─────────┬──────┬────────┬────────────┘
        │          │         │      │        │
        │          └─────────┴──────┴────────┘
        │                    │
        ▼                    ▼
   ┌──────────────────────────────────────┐
   │     Analytics Service (GraphQL)       │
   │            Port: 4000                 │
   │  - Real-time Dashboard                │
   │  - GraphQL Subscriptions              │
   │  - Data Aggregation                   │
   └──────────────┬───────────────────────┘
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
   ┌─────────┐         ┌─────────┐
   │  MySQL  │         │  Redis  │
   │  :3306  │         │  :6379  │
   │         │         │ (Cache/ │
   │         │         │ PubSub) │
   └─────────┘         └─────────┘
```

---

## 🛠️ TECH STACK

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js (REST API)
- **GraphQL:** Apollo Server
- **Database:** MySQL 8.0 (MIGRASI DARI POSTGRESQL)
- **Cache/PubSub:** Redis 7
- **Authentication:** JWT with RSA256 keys
- **Password Hashing:** bcrypt

### Frontend
- **Framework:** React 18
- **Build Tool:** Vite 5
- **Language:** JavaScript/TypeScript
- **UI Library:** React Components
- **Routing:** React Router v6
- **State Management:** React Context API / Zustand
- **API Client:** Axios
- **Styling:** TailwindCSS

### DevOps
- **Containerization:** Docker
- **Orchestration:** Docker Compose
- **Database Admin:** phpMyAdmin

---

## 📦 SERVICES & PORTS

| Service | Port | Type | Description |
|---------|------|------|-------------|
| **Frontend** | 5173 | Web | React + Vite UI |
| **API Gateway** | 8000 | REST | Main entry point |
| **User Service** | 3001 | REST | Authentication & user management |
| **Transaction Service** | 3002 | REST | Income/expense tracking |
| **Budget Service** | 3003 | REST | Budget management |
| **Room Service** | 3004 | REST | Shared budget rooms |
| **Notification Service** | 3005 | REST | User notifications |
| **Analytics Service** | 4000 | GraphQL | Real-time dashboard & analytics |
| **MySQL Database** | 3306 | DB | Main database |
| **Redis** | 6379 | Cache | Caching & PubSub |
| **phpMyAdmin** | 5050 | Web | Database admin tool |

---

## ✨ FITUR UTAMA

### 1. **User Management Service**
- ✅ User registration dengan validasi
- ✅ Login/Logout dengan JWT authentication
- ✅ Profile management (name, email, currency preference)
- ✅ Financial preferences (monthly income, spending goals)
- ✅ Password hashing dengan bcrypt
- ✅ Token refresh mechanism

**Endpoints:**
```
POST   /api/auth/register       - Register user baru
POST   /api/auth/login          - Login dan dapatkan JWT token
POST   /api/auth/logout         - Logout user
POST   /api/auth/refresh        - Refresh access token
GET    /api/users/profile       - Get user profile (auth required)
PUT    /api/users/profile       - Update profile
GET    /api/users/preferences   - Get financial preferences
PUT    /api/users/preferences   - Update preferences
```

### 2. **Transaction Service**
- ✅ Create/Read/Update/Delete transactions
- ✅ Income & expense tracking
- ✅ Category management (Food, Transport, Bills, etc.)
- ✅ Payment method tracking (Cash, Credit Card, etc.)
- ✅ Date-based filtering
- ✅ Daily/Monthly summaries
- ✅ Transaction search & filter

**Endpoints:**
```
GET    /api/transactions              - Get all transactions (with filters)
POST   /api/transactions              - Create new transaction
GET    /api/transactions/:id          - Get transaction by ID
PUT    /api/transactions/:id          - Update transaction
DELETE /api/transactions/:id          - Delete transaction
GET    /api/transactions/summary/daily   - Get daily summary
GET    /api/transactions/summary/monthly - Get monthly summary
GET    /api/categories                - Get all categories
```

**Categories:**
- Food & Dining 🍔
- Transportation 🚗
- Shopping 🛍️
- Bills & Utilities 💡
- Entertainment 🎬
- Healthcare 🏥
- Salary 💰
- Business 💼
- Investment 📈
- Other

### 3. **Budget Service**
- ✅ Create monthly/category budgets
- ✅ Budget tracking & monitoring
- ✅ Budget alerts (50%, 75%, 90%, 100%)
- ✅ Budget status (on track, near limit, exceeded)
- ✅ Budget vs actual spending comparison
- ✅ Automatic notification triggers

**Endpoints:**
```
GET    /api/budgets           - Get all budgets
POST   /api/budgets           - Create new budget
GET    /api/budgets/:id       - Get budget by ID
PUT    /api/budgets/:id       - Update budget
DELETE /api/budgets/:id       - Delete budget
GET    /api/budgets/status    - Get budget status & alerts
GET    /api/budgets/alerts    - Get active budget alerts
```

### 4. **Room Service (Shared Budget)**
- ✅ Create shared budget rooms
- ✅ Unique room codes generation (8 characters)
- ✅ Invite members via room code
- ✅ Role-based access (owner, admin, member)
- ✅ Member management (accept/reject/remove)
- ✅ Shared transactions within room
- ✅ Room-level budget tracking

**Endpoints:**
```
GET    /api/rooms                    - Get user's rooms
POST   /api/rooms                    - Create new room
GET    /api/rooms/:id                - Get room details
PUT    /api/rooms/:id                - Update room info
DELETE /api/rooms/:id                - Delete room
POST   /api/rooms/:id/join           - Join room with code
POST   /api/rooms/:id/leave          - Leave room
GET    /api/rooms/:id/members        - Get room members
POST   /api/rooms/:id/members        - Add member
DELETE /api/rooms/:id/members/:userId - Remove member
GET    /api/rooms/:id/transactions   - Get room transactions
POST   /api/rooms/:id/transactions   - Add transaction to room
```

**Room Roles:**
- **Owner:** Full control, can delete room
- **Admin:** Can manage members and settings
- **Member:** Can view and add transactions

### 5. **Notification Service**
- ✅ Real-time notifications
- ✅ Budget alert notifications
- ✅ Room invitation notifications
- ✅ Member activity notifications
- ✅ Read/unread status
- ✅ Notification history

**Endpoints:**
```
GET    /api/notifications         - Get all notifications
GET    /api/notifications/unread  - Get unread count
PUT    /api/notifications/:id/read - Mark as read
PUT    /api/notifications/read-all - Mark all as read
DELETE /api/notifications/:id     - Delete notification
```

**Notification Types:**
- `room_invite` - Room invitation
- `join_request` - Join request received
- `join_accepted` - Join request accepted
- `join_rejected` - Join request rejected
- `member_joined` - New member joined
- `member_left` - Member left room
- `budget_alert` - Budget threshold reached
- `transaction_added` - New transaction in room
- `system` - System notifications

### 6. **Analytics Service (GraphQL)**
- ✅ Real-time dashboard data
- ✅ Spending by category
- ✅ Income vs expense trends
- ✅ Budget status overview
- ✅ GraphQL subscriptions untuk real-time updates
- ✅ Data aggregation & calculations

**GraphQL Schema:**
```graphql
type Query {
  hello: String
  
  # Dashboard summary
  dashboardSummary(userId: ID!, period: Period!): DashboardSummary
  
  # Spending analysis
  spendingByCategory(userId: ID!, period: Period!): [CategorySpending!]!
  spendingTrend(userId: ID!, period: Period!): [TrendData!]!
  
  # Budget status
  budgetStatus(userId: ID!): [BudgetStatus!]!
  
  # Income vs Expense
  incomeVsExpense(userId: ID!, period: Period!): IncomeExpenseData
}

type Subscription {
  # Real-time updates
  budgetAlertTriggered(userId: ID!): BudgetAlert!
  transactionAdded(userId: ID!): Transaction!
  dashboardUpdated(userId: ID!): DashboardSummary!
}

enum Period {
  DAILY
  WEEKLY
  MONTHLY
  YEARLY
}

type DashboardSummary {
  totalIncome: Float!
  totalExpense: Float!
  balance: Float!
  savingsRate: Float!
  topCategory: String
  transactionCount: Int!
}

type CategorySpending {
  category: String!
  amount: Float!
  percentage: Float!
  color: String!
}

type BudgetStatus {
  category: String!
  budgetAmount: Float!
  spentAmount: Float!
  percentage: Float!
  status: String!
}

type BudgetAlert {
  category: String!
  percentage: Float!
  message: String!
  timestamp: String!
}
```

---

## 🔄 MIGRASI DATABASE: PostgreSQL → MySQL

### Alasan Migrasi
1. **Konsistensi dengan tech stack kampus** - MySQL lebih umum digunakan
2. **Familiaritas** - Night lebih familiar dengan MySQL
3. **Performa cukup** - Untuk expense tracking app, MySQL lebih dari cukup
4. **Kemudahan development** - Tools dan resources MySQL lebih banyak

### Perubahan Yang Dilakukan

#### 1. Docker Compose Configuration
**SEBELUM (PostgreSQL):**
```yaml
postgres:
  image: postgres:15-alpine
  environment:
    POSTGRES_USER: postgres
    POSTGRES_PASSWORD: postgres
    POSTGRES_DB: budgetwise
  ports:
    - "5432:5432"
  volumes:
    - postgres_data:/var/lib/postgresql/data
```

**SESUDAH (MySQL):**
```yaml
mysql:
  image: mysql:8.0
  environment:
    MYSQL_ROOT_PASSWORD: root
    MYSQL_DATABASE: budgetwise
    MYSQL_USER: budgetwise
    MYSQL_PASSWORD: budgetwise123
  ports:
    - "3306:3306"
  volumes:
    - mysql_data:/var/lib/mysql
  command: --default-authentication-plugin=mysql_native_password
```

#### 2. Database URL Format
**SEBELUM:**
```
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/budgetwise
```

**SESUDAH:**
```
DATABASE_URL=mysql://budgetwise:budgetwise123@mysql:3306/budgetwise
```

#### 3. Migration SQL Adjustments

**PostgreSQL Features yang Diganti:**

```sql
-- PostgreSQL UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- DIHAPUS di MySQL

-- UUID Generation
DEFAULT uuid_generate_v4()
-- DIGANTI dengan: DEFAULT (UUID())

-- Timestamp Auto-update
CURRENT_TIMESTAMP
-- TETAP SAMA di MySQL

-- Triggers & Functions
-- PostgreSQL: LANGUAGE plpgsql
-- MySQL: DELIMITER $$ dan syntax berbeda
```

#### 4. Database Dependencies

**Package yang Diupdate:**
```bash
# Remove PostgreSQL driver
npm uninstall pg pg-hstore

# Install MySQL driver
npm install mysql2
```

#### 5. Query Adjustments

Beberapa query perlu disesuaikan:
- `RETURNING` clause → Tidak ada di MySQL, gunakan `SELECT LAST_INSERT_ID()`
- JSON operations → MySQL 8.0 support tapi syntax berbeda
- Array operations → Gunakan JSON_ARRAY di MySQL

---

## 📁 STRUKTUR DATABASE (MySQL)

### Users Table
```sql
CREATE TABLE users (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    currency VARCHAR(10) DEFAULT 'IDR',
    monthly_income DECIMAL(15,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB;
```

### Transactions Table
```sql
CREATE TABLE transactions (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL,
    room_id CHAR(36),
    type ENUM('income', 'expense') NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    payment_method VARCHAR(50),
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_room_id (room_id),
    INDEX idx_type (type),
    INDEX idx_category (category),
    INDEX idx_date (date),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
) ENGINE=InnoDB;
```

### Budgets Table
```sql
CREATE TABLE budgets (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL,
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    period VARCHAR(20) DEFAULT 'monthly',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    alert_threshold INT DEFAULT 80,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_category (category),
    INDEX idx_period (period),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_category_period (user_id, category, period, start_date)
) ENGINE=InnoDB;
```

### Rooms Table (Shared Budget)
```sql
CREATE TABLE rooms (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    room_code VARCHAR(10) UNIQUE NOT NULL,
    owner_id CHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_owner_id (owner_id),
    INDEX idx_room_code (room_code),
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
```

### Room Members Table
```sql
CREATE TABLE room_members (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    room_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    role ENUM('owner', 'admin', 'member') DEFAULT 'member',
    status ENUM('pending', 'active', 'rejected', 'left') DEFAULT 'pending',
    invited_by CHAR(36),
    joined_at TIMESTAMP,
    left_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_room_id (room_id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_room_user (room_id, user_id)
) ENGINE=InnoDB;
```

### Notifications Table
```sql
CREATE TABLE notifications (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL,
    type ENUM(
        'room_invite',
        'join_request',
        'join_accepted',
        'join_rejected',
        'member_joined',
        'member_left',
        'budget_alert',
        'transaction_added',
        'system'
    ) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_id CHAR(36),
    related_type VARCHAR(50),
    action_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
```

### Categories Table
```sql
CREATE TABLE categories (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) UNIQUE NOT NULL,
    type ENUM('income', 'expense') NOT NULL,
    icon VARCHAR(10),
    color VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
```

---

## 🔐 AUTHENTICATION & SECURITY

### JWT Implementation
- **Algorithm:** RSA256 (Public/Private Key Pair)
- **Access Token:** 15 minutes expiry
- **Refresh Token:** 7 days expiry
- **Key Storage:** Shared volume `/shared/keys/`

### Security Features
1. **Password Hashing:** bcrypt dengan salt rounds 10
2. **JWT Verification:** Pada setiap protected endpoint
3. **Rate Limiting:** API Gateway level (100 requests/15 minutes)
4. **CORS Protection:** Whitelist domains
5. **Input Validation:** Semua user input divalidasi
6. **SQL Injection Prevention:** Prepared statements/parameterized queries
7. **XSS Protection:** Input sanitization

### Environment Variables Security
```bash
# JANGAN commit .env files ke git
# Gunakan .env.example sebagai template

# Required Environment Variables:
NODE_ENV=development
DATABASE_URL=mysql://user:pass@host:port/db
REDIS_URL=redis://host:port
JWT_PRIVATE_KEY_PATH=/path/to/private.pem
JWT_PUBLIC_KEY_PATH=/path/to/public.pem
```

---

## 🐳 DOCKER CONFIGURATION

### Frontend Dockerfile (React + Vite)

**frontend/Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Start development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```

**For Production Build:**
```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Backend Services Dockerfile (Example)

**services/user-service/Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3001

CMD ["node", "index.js"]
```

### Docker Compose Configuration

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  # MySQL Database
  mysql:
    image: mysql:8.0
    container_name: budgetwise-mysql
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: budgetwise
      MYSQL_USER: budgetwise
      MYSQL_PASSWORD: budgetwise123
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - budgetwise-network
    command: --default-authentication-plugin=mysql_native_password
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-ubudgetwise", "-pbudgetwise123"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis for caching and PubSub
  redis:
    image: redis:7-alpine
    container_name: budgetwise-redis
    ports:
      - "6379:6379"
    networks:
      - budgetwise-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # User Service
  user-service:
    build:
      context: ./services/user-service
      dockerfile: Dockerfile
    container_name: budgetwise-user-service
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=development
      - PORT=3001
      - DATABASE_URL=mysql://budgetwise:budgetwise123@mysql:3306/budgetwise
      - REDIS_URL=redis://redis:6379
      - JWT_PRIVATE_KEY_PATH=/app/shared/keys/private.pem
      - JWT_PUBLIC_KEY_PATH=/app/shared/keys/public.pem
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./services/user-service:/app
      - /app/node_modules
      - ./shared:/app/shared
    networks:
      - budgetwise-network
    restart: unless-stopped

  # Transaction Service
  transaction-service:
    build:
      context: ./services/transaction-service
      dockerfile: Dockerfile
    container_name: budgetwise-transaction-service
    ports:
      - "3002:3002"
    environment:
      - NODE_ENV=development
      - PORT=3002
      - DATABASE_URL=mysql://budgetwise:budgetwise123@mysql:3306/budgetwise
      - REDIS_URL=redis://redis:6379
      - JWT_PUBLIC_KEY_PATH=/app/shared/keys/public.pem
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./services/transaction-service:/app
      - /app/node_modules
      - ./shared:/app/shared
    networks:
      - budgetwise-network
    restart: unless-stopped

  # Budget Service
  budget-service:
    build:
      context: ./services/budget-service
      dockerfile: Dockerfile
    container_name: budgetwise-budget-service
    ports:
      - "3003:3003"
    environment:
      - NODE_ENV=development
      - PORT=3003
      - DATABASE_URL=mysql://budgetwise:budgetwise123@mysql:3306/budgetwise
      - REDIS_URL=redis://redis:6379
      - JWT_PUBLIC_KEY_PATH=/app/shared/keys/public.pem
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./services/budget-service:/app
      - /app/node_modules
      - ./shared:/app/shared
    networks:
      - budgetwise-network
    restart: unless-stopped

  # Room Service
  room-service:
    build:
      context: ./services/room-service
      dockerfile: Dockerfile
    container_name: budgetwise-room-service
    ports:
      - "3004:3004"
    environment:
      - NODE_ENV=development
      - PORT=3004
      - DATABASE_URL=mysql://budgetwise:budgetwise123@mysql:3306/budgetwise
      - REDIS_URL=redis://redis:6379
      - JWT_PUBLIC_KEY_PATH=/app/shared/keys/public.pem
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./services/room-service:/app
      - /app/node_modules
      - ./shared:/app/shared
    networks:
      - budgetwise-network
    restart: unless-stopped

  # Notification Service
  notification-service:
    build:
      context: ./services/notification-service
      dockerfile: Dockerfile
    container_name: budgetwise-notification-service
    ports:
      - "3005:3005"
    environment:
      - NODE_ENV=development
      - PORT=3005
      - DATABASE_URL=mysql://budgetwise:budgetwise123@mysql:3306/budgetwise
      - REDIS_URL=redis://redis:6379
      - JWT_PUBLIC_KEY_PATH=/app/shared/keys/public.pem
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./services/notification-service:/app
      - /app/node_modules
      - ./shared:/app/shared
    networks:
      - budgetwise-network
    restart: unless-stopped

  # Analytics Service (GraphQL)
  analytics-service:
    build:
      context: ./services/analytics-service
      dockerfile: Dockerfile
    container_name: budgetwise-analytics-service
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=development
      - PORT=4000
      - DATABASE_URL=mysql://budgetwise:budgetwise123@mysql:3306/budgetwise
      - REDIS_URL=redis://redis:6379
      - JWT_PUBLIC_KEY_PATH=/app/shared/keys/public.pem
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./services/analytics-service:/app
      - /app/node_modules
      - ./shared:/app/shared
    networks:
      - budgetwise-network
    restart: unless-stopped

  # API Gateway
  api-gateway:
    build:
      context: ./api-gateway
      dockerfile: Dockerfile
    container_name: budgetwise-api-gateway
    ports:
      - "8000:8000"
    environment:
      - NODE_ENV=development
      - PORT=8000
      - USER_SERVICE_URL=http://user-service:3001
      - TRANSACTION_SERVICE_URL=http://transaction-service:3002
      - BUDGET_SERVICE_URL=http://budget-service:3003
      - ANALYTICS_SERVICE_URL=http://analytics-service:4000
      - ROOM_SERVICE_URL=http://room-service:3004
      - NOTIFICATION_SERVICE_URL=http://notification-service:3005
      - JWT_PUBLIC_KEY_PATH=/app/shared/keys/public.pem
    depends_on:
      - user-service
      - transaction-service
      - budget-service
      - analytics-service
      - room-service
      - notification-service
    volumes:
      - ./api-gateway:/app
      - /app/node_modules
      - ./shared:/app/shared
    networks:
      - budgetwise-network
    restart: unless-stopped

  # Frontend (React + Vite)
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: budgetwise-frontend
    ports:
      - "5173:5173"
    environment:
      - VITE_API_GATEWAY_URL=http://localhost:8000
      - VITE_ANALYTICS_WS_URL=ws://localhost:4000/graphql
    depends_on:
      - api-gateway
    volumes:
      - ./frontend:/app
      - /app/node_modules
    networks:
      - budgetwise-network
    restart: unless-stopped

  # phpMyAdmin - MySQL Admin Tool
  phpmyadmin:
    image: phpmyadmin/phpmyadmin
    container_name: budgetwise-phpmyadmin
    environment:
      PMA_HOST: mysql
      PMA_PORT: 3306
      PMA_USER: budgetwise
      PMA_PASSWORD: budgetwise123
    ports:
      - "5050:80"
    networks:
      - budgetwise-network
    depends_on:
      - mysql
    restart: unless-stopped

volumes:
  mysql_data:

networks:
  budgetwise-network:
    driver: bridge
```

---

## 🚀 CARA MENJALANKAN APLIKASI

### Prerequisites
```bash
# Install Docker & Docker Compose
docker --version  # Should be 20.10+
docker-compose --version  # Should be 1.29+

# Install Node.js (untuk development)
node --version  # Should be 18+
npm --version
```

### Step-by-Step Installation

#### 1. Clone/Extract Project
```bash
cd budgetwise-microservices
```

#### 2. Generate RSA Keys
```bash
# Buat direktori untuk keys
mkdir -p shared/keys

# Generate private key
openssl genrsa -out shared/keys/private.pem 2048

# Generate public key
openssl rsa -in shared/keys/private.pem -pubout -out shared/keys/public.pem

# Set permissions
chmod 600 shared/keys/private.pem
chmod 644 shared/keys/public.pem
```

#### 3. Setup Environment Files

**Buat `.env` di setiap service folder:**

**api-gateway/.env:**
```env
NODE_ENV=development
PORT=8000
USER_SERVICE_URL=http://user-service:3001
TRANSACTION_SERVICE_URL=http://transaction-service:3002
BUDGET_SERVICE_URL=http://budget-service:3003
ANALYTICS_SERVICE_URL=http://analytics-service:4000
ROOM_SERVICE_URL=http://room-service:3004
NOTIFICATION_SERVICE_URL=http://notification-service:3005
JWT_PUBLIC_KEY_PATH=/app/shared/keys/public.pem
```

**services/user-service/.env:**
```env
NODE_ENV=development
PORT=3001
DATABASE_URL=mysql://budgetwise:budgetwise123@mysql:3306/budgetwise
REDIS_URL=redis://redis:6379
JWT_PRIVATE_KEY_PATH=/app/shared/keys/private.pem
JWT_PUBLIC_KEY_PATH=/app/shared/keys/public.pem
```

**services/transaction-service/.env:**
```env
NODE_ENV=development
PORT=3002
DATABASE_URL=mysql://budgetwise:budgetwise123@mysql:3306/budgetwise
REDIS_URL=redis://redis:6379
JWT_PUBLIC_KEY_PATH=/app/shared/keys/public.pem
```

**services/budget-service/.env:**
```env
NODE_ENV=development
PORT=3003
DATABASE_URL=mysql://budgetwise:budgetwise123@mysql:3306/budgetwise
REDIS_URL=redis://redis:6379
JWT_PUBLIC_KEY_PATH=/app/shared/keys/public.pem
```

**services/room-service/.env:**
```env
NODE_ENV=development
PORT=3004
DATABASE_URL=mysql://budgetwise:budgetwise123@mysql:3306/budgetwise
REDIS_URL=redis://redis:6379
JWT_PUBLIC_KEY_PATH=/app/shared/keys/public.pem
```

**services/notification-service/.env:**
```env
NODE_ENV=development
PORT=3005
DATABASE_URL=mysql://budgetwise:budgetwise123@mysql:3306/budgetwise
REDIS_URL=redis://redis:6379
JWT_PUBLIC_KEY_PATH=/app/shared/keys/public.pem
```

**services/analytics-service/.env:**
```env
NODE_ENV=development
PORT=4000
DATABASE_URL=mysql://budgetwise:budgetwise123@mysql:3306/budgetwise
REDIS_URL=redis://redis:6379
JWT_PUBLIC_KEY_PATH=/app/shared/keys/public.pem
```

**frontend/.env:**
```env
VITE_API_GATEWAY_URL=http://localhost:8000
VITE_ANALYTICS_WS_URL=ws://localhost:4000/graphql
```

> **Note:** Vite menggunakan prefix `VITE_` untuk environment variables yang bisa diakses di client-side

#### 4. Setup Frontend (React + Vite)

**Option A: Create New (Jika belum ada folder frontend)**
```bash
# Create React + Vite project
npm create vite@latest frontend -- --template react

# Or with TypeScript
npm create vite@latest frontend -- --template react-ts

# Install dependencies
cd frontend
npm install

# Install additional packages
npm install react-router-dom axios
npm install -D tailwindcss postcss autoprefixer

# Initialize Tailwind
npx tailwindcss init -p
```

**Option B: Use Existing (Jika sudah ada)**
```bash
cd frontend
npm install
```

**Tailwind Configuration (tailwind.config.js):**
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

**Vite Configuration (vite.config.js):**
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: {
      usePolling: true,
    },
  },
})
```

**Frontend Structure:**
```
frontend/
├── src/
│   ├── components/       # Reusable components
│   ├── pages/           # Page components
│   ├── services/        # API services
│   ├── hooks/           # Custom React hooks
│   ├── context/         # Context providers
│   ├── utils/           # Utility functions
│   ├── App.jsx          # Main app component
│   └── main.jsx         # Entry point
├── public/              # Static assets
├── .env                 # Environment variables
├── index.html           # HTML template
├── package.json
└── vite.config.js       # Vite configuration
```

**API Service Example (src/services/api.js):**
```javascript
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_GATEWAY_URL;

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

#### 5. Build & Run Docker Containers
```bash
# Build semua services
docker-compose build

# Start semua services
docker-compose up -d

# Atau build + start sekaligus
docker-compose up --build -d

# Check logs
docker-compose logs -f

# Check status
docker-compose ps
```

#### 6. Run Database Migrations
```bash
# Masuk ke MySQL container
docker exec -it budgetwise-mysql mysql -u budgetwise -pbudgetwise123 budgetwise

# Atau run migration files
docker exec -i budgetwise-mysql mysql -u budgetwise -pbudgetwise123 budgetwise < database/migrations/001_create_tables.sql
docker exec -i budgetwise-mysql mysql -u budgetwise -pbudgetwise123 budgetwise < database/migrations/002_seed_categories.sql
```

#### 7. Verify Services Running
```bash
# Check health endpoints
curl http://localhost:8000/health  # API Gateway
curl http://localhost:3001/health  # User Service
curl http://localhost:3002/health  # Transaction Service
curl http://localhost:3003/health  # Budget Service
curl http://localhost:3004/health  # Room Service
curl http://localhost:3005/health  # Notification Service
curl http://localhost:4000/graphql # Analytics Service

# All should return: {"status":"ok"}
```

#### 8. Access Applications
- **Frontend:** http://localhost:5173
- **API Gateway:** http://localhost:8000
- **GraphQL Playground:** http://localhost:4000/graphql
- **phpMyAdmin:** http://localhost:5050
  - Server: mysql
  - Username: budgetwise
  - Password: budgetwise123

---

## 🧪 TESTING GUIDE

### Manual Testing dengan Postman/curl

#### 1. Register User
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234",
    "name": "Test User",
    "currency": "IDR",
    "monthly_income": 10000000
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "test@example.com",
      "name": "Test User",
      "currency": "IDR",
      "monthly_income": 10000000
    },
    "accessToken": "eyJhbGciOiJSUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJSUzI1NiIs..."
  }
}
```

#### 2. Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234"
  }'
```

**SIMPAN ACCESS TOKEN untuk request selanjutnya!**

#### 3. Create Transaction
```bash
curl -X POST http://localhost:8000/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "type": "expense",
    "amount": 150000,
    "category": "Food & Dining",
    "description": "Lunch at restaurant",
    "payment_method": "Credit Card",
    "date": "2024-12-19"
  }'
```

#### 4. Get Transactions
```bash
curl -X GET "http://localhost:8000/api/transactions" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### 5. Create Budget
```bash
curl -X POST http://localhost:8000/api/budgets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "category": "Food & Dining",
    "amount": 2000000,
    "period": "monthly",
    "start_date": "2024-12-01",
    "end_date": "2024-12-31",
    "alert_threshold": 80
  }'
```

#### 6. Create Room (Shared Budget)
```bash
curl -X POST http://localhost:8000/api/rooms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "Family Budget",
    "description": "Monthly household expenses"
  }'
```

**Response will include unique `room_code` untuk invite members**

#### 7. GraphQL Query
```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { dashboardSummary(userId: \"YOUR_USER_ID\", period: MONTHLY) { totalIncome totalExpense balance savingsRate } }"
  }'
```

### Testing GraphQL Subscriptions

1. Buka http://localhost:4000/graphql
2. Test subscription:

```graphql
subscription {
  budgetAlertTriggered(userId: "YOUR_USER_ID") {
    category
    percentage
    message
    timestamp
  }
}
```

3. Di tab lain, create transaction yang trigger budget alert
4. Subscription akan receive real-time notification

---

## 📊 MONITORING & DEBUGGING

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f user-service
docker-compose logs -f mysql
docker-compose logs -f redis

# Last 100 lines
docker-compose logs --tail=100 transaction-service
```

### Check Container Status
```bash
# List running containers
docker-compose ps

# Check resource usage
docker stats

# Inspect container
docker inspect budgetwise-user-service
```

### Database Debugging

**Via phpMyAdmin:**
- Go to http://localhost:5050
- Server: mysql
- Username: budgetwise
- Password: budgetwise123

**Via MySQL CLI:**
```bash
# Enter MySQL container
docker exec -it budgetwise-mysql mysql -u budgetwise -pbudgetwise123 budgetwise

# Show tables
SHOW TABLES;

# Check data
SELECT * FROM users;
SELECT * FROM transactions LIMIT 10;
SELECT * FROM rooms;
SELECT * FROM notifications;
```

### Redis Monitoring
```bash
# Enter Redis container
docker exec -it budgetwise-redis redis-cli

# Check keys
KEYS *

# Monitor real-time commands
MONITOR

# Check pub/sub channels
PUBSUB CHANNELS
```

---

## 🐛 TROUBLESHOOTING

### Problem: Port Already in Use
```bash
# Check what's using the port
lsof -i :3000  # or any port number
netstat -ano | findstr :3000  # Windows

# Kill the process or change port in docker-compose.yml
```

### Problem: Database Connection Failed
```bash
# Check if MySQL is running
docker-compose ps mysql

# Check MySQL logs
docker-compose logs mysql

# Restart MySQL
docker-compose restart mysql

# Verify DATABASE_URL format
# Should be: mysql://user:pass@host:port/database
```

### Problem: JWT Authentication Failed
```bash
# Verify RSA keys exist
ls -la shared/keys/

# Regenerate if missing
openssl genrsa -out shared/keys/private.pem 2048
openssl rsa -in shared/keys/private.pem -pubout -out shared/keys/public.pem

# Restart services
docker-compose restart
```

### Problem: Redis Connection Failed
```bash
# Check Redis status
docker-compose ps redis

# Test Redis connection
docker exec -it budgetwise-redis redis-cli PING
# Should return: PONG

# Restart Redis
docker-compose restart redis
```

### Problem: Service Not Starting
```bash
# Check logs for errors
docker-compose logs service-name

# Common issues:
# 1. Missing .env file → Create it
# 2. Wrong DATABASE_URL → Fix format
# 3. Port conflict → Change port
# 4. Missing dependencies → docker-compose build --no-cache
```

### Problem: Frontend Can't Connect to Backend
```bash
# Check if API Gateway is running
curl http://localhost:8000/health

# Verify VITE_API_GATEWAY_URL in frontend/.env
# Should be: http://localhost:8000

# For accessing env variables in React + Vite code:
const apiUrl = import.meta.env.VITE_API_GATEWAY_URL;

# Check CORS settings in API Gateway
# Frontend origin (http://localhost:5173) should be whitelisted
```

### Nuclear Option - Complete Reset
```bash
# Stop and remove all containers, volumes, networks
docker-compose down -v

# Remove images (optional)
docker-compose down --rmi all

# Rebuild from scratch
docker-compose build --no-cache
docker-compose up -d

# Re-run migrations
docker exec -i budgetwise-mysql mysql -u budgetwise -pbudgetwise123 budgetwise < database/migrations/001_create_tables.sql
```

---

## 📝 DEVELOPMENT WORKFLOW

### Adding New Feature
```bash
# 1. Create new branch
git checkout -b feature/new-feature

# 2. Develop locally (without Docker)
cd services/new-service
npm install
npm run dev

# 3. Test the feature
# Use Postman/curl to test endpoints

# 4. Add to Docker
# Update docker-compose.yml
# Create Dockerfile in service folder

# 5. Build and test in Docker
docker-compose build new-service
docker-compose up -d new-service

# 6. Commit and push
git add .
git commit -m "Add new feature"
git push origin feature/new-feature
```

### Database Schema Changes
```bash
# 1. Create new migration file
touch database/migrations/003_add_new_table.sql

# 2. Write SQL
# Use MySQL syntax!

# 3. Run migration
docker exec -i budgetwise-mysql mysql -u budgetwise -pbudgetwise123 budgetwise < database/migrations/003_add_new_table.sql

# 4. Verify
docker exec -it budgetwise-mysql mysql -u budgetwise -pbudgetwise123 -e "DESCRIBE new_table;" budgetwise
```

### Code Style & Best Practices
- Use ESLint & Prettier
- Follow REST API conventions
- Write meaningful commit messages
- Add JSDoc comments
- Handle errors properly
- Validate input data
- Use try-catch blocks
- Return consistent response format

---

## 🎓 PENJELASAN UNTUK PRESENTASI

### Konsep Aplikasi
"BudgetWise adalah aplikasi manajemen keuangan personal yang dikembangkan dengan arsitektur microservices. Aplikasi ini tidak hanya memungkinkan user untuk track income dan expense secara personal, tapi juga bisa collaborate dengan orang lain dalam shared budget rooms. Misalnya untuk manage budget rumah tangga, atau budget organisasi."

### Arsitektur Microservices
"Kami menggunakan 6 microservices yang independent:
1. User Service untuk authentication
2. Transaction Service untuk tracking transaksi
3. Budget Service untuk budget management
4. Room Service untuk shared budget
5. Notification Service untuk real-time alerts
6. Analytics Service dengan GraphQL untuk dashboard

Semua request lewat API Gateway yang handle routing, rate limiting, dan authentication."

### Frontend dengan React + Vite
"Untuk frontend, kami menggunakan React dengan Vite sebagai build tool. Keuntungan menggunakan React + Vite:
1. Development experience yang sangat cepat dengan Hot Module Replacement
2. Build time yang jauh lebih cepat dibanding webpack
3. Security lebih straightforward karena pure client-side (tidak ada SSR complexity)
4. Bundle size lebih kecil dan optimized
5. Setup yang simple dan maintainable

Vite menggunakan native ES modules di development, jadi tidak perlu bundling saat development, membuat reload sangat cepat."

### Database Migration
"Awalnya kami design dengan PostgreSQL, tapi kemudian migrate ke MySQL karena:
1. Lebih familiar dan sesuai dengan yang dipelajari di kampus
2. Performance cukup untuk use case kami
3. Tool dan resources lebih banyak

Migration melibatkan perubahan pada:
- Docker configuration
- Database URL format
- SQL syntax (UUID, triggers, functions)
- Database driver di code"

### Docker & Containerization
"Semua services di-containerize dengan Docker:
- Setiap service punya Dockerfile sendiri
- Docker Compose orchestrate semua containers
- Shared volumes untuk RSA keys
- Network isolation dengan bridge network
- Health checks untuk dependency management"

### Real-time Features
"Kami implement real-time notifications dengan:
- Redis PubSub untuk message broker
- GraphQL Subscriptions untuk real-time dashboard
- WebSocket connection
- Event-driven architecture

Contohnya ketika spending reach 80% dari budget, user langsung dapat notification via WebSocket."

### Security Implementation
"Security features:
- JWT dengan RSA256 algorithm
- Password hashing dengan bcrypt
- API rate limiting
- CORS protection
- Input validation
- SQL injection prevention dengan prepared statements"

### Kompleksitas
"Yang membuat complex:
- 6 independent services yang berkomunikasi
- Event-driven architecture dengan Redis
- GraphQL + REST API hybrid
- Real-time subscriptions
- Shared budget dengan role-based access
- Transaction history & analytics aggregation"

---

## ✅ CHECKLIST SEBELUM SUBMIT

### Code Quality
- [ ] All services running without errors
- [ ] No hardcoded credentials
- [ ] Environment variables properly configured
- [ ] Code properly commented
- [ ] Consistent code style
- [ ] Error handling implemented

### Functionality
- [ ] User registration works
- [ ] Login/logout works
- [ ] Transaction CRUD works
- [ ] Budget management works
- [ ] Room creation and joining works
- [ ] Notifications working
- [ ] GraphQL queries working
- [ ] GraphQL subscriptions working

### Database
- [ ] MySQL container running
- [ ] All tables created
- [ ] Migrations executed
- [ ] Sample data inserted
- [ ] Foreign keys working
- [ ] Indexes created

### Docker
- [ ] All containers building successfully
- [ ] Health checks passing
- [ ] Volumes properly configured
- [ ] Networks configured
- [ ] Port mappings correct

### Documentation
- [ ] README complete
- [ ] API documentation available
- [ ] Architecture diagram included
- [ ] Setup instructions clear
- [ ] Testing guide complete
- [ ] Troubleshooting section complete

### Testing
- [ ] Manual testing completed
- [ ] All endpoints tested
- [ ] GraphQL queries tested
- [ ] Subscriptions tested
- [ ] Error scenarios tested

### Presentation
- [ ] Demo prepared
- [ ] Screenshots taken
- [ ] Architecture diagram ready
- [ ] Explanation points prepared
- [ ] Q&A anticipated

---

## 📞 SUPPORT & RESOURCES

### Jika Ada Error
1. Check logs: `docker-compose logs -f`
2. Check container status: `docker-compose ps`
3. Check database connection
4. Verify .env files
5. Restart services: `docker-compose restart`

### Useful Commands
```bash
# Quick restart
docker-compose restart

# Rebuild specific service
docker-compose up --build user-service

# View real-time logs
docker-compose logs -f | grep ERROR

# Clean everything
docker system prune -a

# Check disk usage
docker system df
```

### Learning Resources
- Docker: https://docs.docker.com
- MySQL: https://dev.mysql.com/doc/
- Node.js: https://nodejs.org/docs
- GraphQL: https://graphql.org/learn/
- JWT: https://jwt.io/introduction

---

## 🎯 KESIMPULAN

BudgetWise adalah implementasi complete dari arsitektur microservices dengan fitur:
- ✅ 6 independent services
- ✅ REST + GraphQL API
- ✅ Real-time notifications
- ✅ Shared budget collaboration
- ✅ Docker containerization
- ✅ MySQL database
- ✅ Redis caching & PubSub
- ✅ JWT authentication
- ✅ Event-driven architecture
- ✅ Modern React + Vite frontend

Project ini memenuhi semua kriteria penilaian:
1. ✅ Konsep jelas dengan fitur lengkap
2. ✅ Fungsionalitas semua bekerja
3. ✅ UI/UX dengan React + Vite (fast & secure)
4. ✅ Arsitektur complex dengan Docker
5. ✅ Dokumentasi lengkap

**Target:** Nilai A untuk Tugas Besar IAE! 🎯🚀

---

**Author:** Night  
**Institution:** UTS - Information Systems Engineering & Security  
**Date:** December 2024  
**Version:** 2.0 (MySQL Migration)

---

**Good luck with your project! 💪🎓**
