# MIGRASI WEB - 08 AUTHENTICATION & AUTHORIZATION

## 📋 Overview

Authentication system using NextAuth.js with JWT tokens and role-based access control.

**Priority:** 🔴 CRITICAL

---

## 🔐 Authentication Flow

### 1. Login
**Page:** `/login`  
**API:** `/api/auth/login`

```typescript
interface LoginRequest {
  username: string
  password: string
}

interface LoginResponse {
  token: {
    type: 'bearer'
    accessToken: string
    refreshToken: string
  }
  user: {
    id: number
    username: string
    email: string
    nama: string
    role: string
    karyawan_id?: number
  }
}
```

### 2. Session Management
**Provider:** NextAuth.js

```javascript
// Get session
const session = await getSession()
const token = session?.token?.accessToken

// User data
const user = session?.user
```

### 3. Token Refresh
Auto-refresh on 401 response

### 4. Logout
Clear session and redirect to login

---

## 🛡️ Authorization

### Role-Based Access
```typescript
type Role = 'admin' | 'supervisor' | 'user'
```

### Menu Visibility
Dynamic menu from API based on user role

### Route Protection
```javascript
// In layout or middleware
if (!session) {
  redirect('/login')
}
```

---

## 📋 Migration TODO

- [ ] Set up NextAuth.js
- [ ] Configure JWT strategy
- [ ] Create login page
- [ ] Implement login API call
- [ ] Store token in session
- [ ] Add token to axios headers
- [ ] Implement logout
- [ ] Add route protection
- [ ] Test auth flow
- [ ] Test token refresh
- [ ] Test 401 handling

---

**Priority:** 🔴 CRITICAL  
**Estimated Effort:** 10-15 hours
