# User Access API Documentation

## Overview

Fitur user access management untuk mengatur permission/akses user terhadap menu dan submenu aplikasi.

## Endpoints

### 1. GET - List User Access

**URL:** `/api/setting/akses-menu/list`

**Method:** `GET`

**Query Parameters:**

- `user_id` (optional) - Filter by user ID
- `menu_id` (optional) - Filter by menu ID
- `submenu_id` (optional) - Filter by submenu ID
- `page` (optional) - Page number (default: 1)
- `perPages` (optional) - Items per page (default: 25)

**Response:**

```json
{
  "diagnostic": {
    "ver": 3.0,
    "error": false
  },
  "rows": {
    "total": 100,
    "perPage": 25,
    "page": 1,
    "lastPage": 4,
    "data": [
      {
        "id": 1,
        "user_id": 123,
        "nmuser": "John Doe",
        "menu_id": 5,
        "submenu_id": 15,
        "nmsubmenu": "Timesheet",
        "read": "Y",
        "insert": "Y",
        "update": "Y",
        "remove": "N",
        "accept": "N",
        "validate": "N",
        "approve": "N",
        "aktif": "Y",
        "user": {
          "id": 123,
          "nmlengkap": "John Doe",
          "usertype": "Admin"
        },
        "menu": {
          "id": 5,
          "name": "Operations"
        },
        "submenu": {
          "id": 15,
          "name": "Timesheet",
          "menu": {
            "id": 5,
            "name": "Operations"
          }
        }
      }
    ]
  }
}
```

### 2. POST - Create/Update User Access

**URL:** `/api/setting/akses-menu/create`

**Method:** `POST`

**Request Body:**

```json
{
  "user_id": 123,
  "user": {
    "id": 123,
    "nmlengkap": "John Doe",
    "nama": "John Doe"
  },
  "submenu": [
    {
      "id": 15,
      "name": "Timesheet",
      "menu": {
        "id": 5,
        "name": "Operations"
      }
    }
  ],
  "access": [
    {
      "submenu": {
        "id": 15,
        "name": "Timesheet",
        "menu": {
          "id": 5,
          "name": "Operations"
        }
      },
      "read": "Y",
      "insert": "Y",
      "update": "Y",
      "remove": "N",
      "accept": "N",
      "validate": "N",
      "approve": "N"
    }
  ]
}
```

**Response:**

```json
{
  "diagnostic": {
    "ver": 3.0,
    "error": false
  },
  "rows": { ...request_data }
}
```

**Logic:**

- Checks if access for user + submenu already exists
- If exists → UPDATE (merge changes, set aktif='Y')
- If not exists → INSERT new access
- Uses transaction (commit/rollback)

### 3. POST - Delete User Access (NEEDS TO BE ADDED)

**URL:** `/api/setting/akses-menu/:id/destroy`

**Method:** `POST`

**URL Parameters:**

- `id` - User ID to delete all access

**Request Body:** (optional)

```json
{
  "user_id": 123
}
```

**Response:**

```json
{
  "diagnostic": {
    "ver": 3.0,
    "error": false
  },
  "message": "User access berhasil dihapus"
}
```

**Backend Implementation Needed:**

```javascript
async destroy({ auth, params, response }) {
  const trx = await DB.beginTransaction()
  const user = await auth.authenticator('jwt').getUser()
  const userId = params.id

  try {
    // Soft delete: set aktif='N'
    await DB.table('sys_access_permission')
      .where('user_id', userId)
      .update({ aktif: 'N' })
      .transacting(trx)

    await trx.commit()

    Logger.info(`[Delete by ${user.nama_lengkap}]`, {
      action: 'delete_user_access',
      user_id: userId
    })

    return response.status(200).json({
      diagnostic: { ver: 3.0, error: false },
      message: 'User access berhasil dihapus'
    })
  } catch (error) {
    await trx.rollback()
    Logger.warn(`[Err by ${user.nama_lengkap}]`, {
      errteks: error.sqlMessage,
      user_id: userId
    })

    return response.status(400).json({
      diagnostic: { ver: 3.0, error: error.sqlMessage },
      message: 'Gagal menghapus user access'
    })
  }
}
```

## Frontend Routes

### Pages

- `/user-access` - List all user access
- `/user-access/create` - Create new user access
- `/user-access/:id/show` - Edit user access (by user_id)
- `/user-access/:id/destroy` - Delete user access (by user_id)

### Components

- `views/setting/user-access/index.js` - Main list page
- `views/setting/user-access/create.js` - Create form
- `views/setting/user-access/show.js` - Edit form
- `views/setting/user-access/destroy.js` - Delete confirmation
- `views/setting/user-access/list.js` - Table list component
- `views/setting/user-access/filter.js` - Filter drawer

### API Hooks

- `useGetUserAccess(params)` - Fetch user access with filters
- `useShowUserAccess(userId)` - Fetch user access by user_id

## Permission Fields

- **read** - View/read access
- **insert** - Create/add new data
- **update** - Edit/modify existing data
- **remove** - Delete data
- **accept** - Accept/receive data
- **validate** - Validate data
- **approve** - Approve data

## Database Schema

Table: `sys_access_permission`

```sql
- id (PK)
- user_id (FK)
- nmuser
- menu_id (FK)
- submenu_id (FK)
- nmsubmenu
- read ('Y'/'N')
- insert ('Y'/'N')
- update ('Y'/'N')
- remove ('Y'/'N')
- accept ('Y'/'N')
- validate ('Y'/'N')
- approve ('Y'/'N')
- aktif ('Y'/'N')
- created_at
- updated_at
```

## TODO for Backend

1. ✅ GET /setting/akses-menu/list - Already implemented
2. ✅ POST /setting/akses-menu/create - Already implemented
3. ❌ POST /setting/akses-menu/:id/destroy - **NEEDS TO BE ADDED**

Add this route in `start/routes.js`:

```javascript
Route.post(
  "/setting/akses-menu/:id/destroy",
  "setting/UserAksesController.destroy",
);
```

## Filter Components Needed

Create these filter components if not exist:

- `FilterUser` - Filter by user/karyawan
- `FilterMenu` - Filter by menu
- `FilterSubmenu` - Filter by submenu (with menu_id dependency)
