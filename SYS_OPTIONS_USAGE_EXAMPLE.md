# Sys Options API - Usage Guide

## 📋 Overview

Complete CRUD endpoints for `sys_options` table with group filtering support.

---

## 🔗 Backend Endpoints

### Base URL
```
http://localhost:3003/api/setting/sys-options
```

### Available Endpoints

#### 1. Get All Options (with filters)
```http
GET /api/setting/sys-options/list?group=general&page=1&perPage=25
```

**Query Parameters:**
- `group` (optional) - Filter by group
- `page` (optional) - Page number (default: 1)
- `perPage` (optional) - Items per page (default: 25)

**Response:**
```json
{
  "status": true,
  "message": "System options retrieved successfully",
  "rows": {
    "data": [
      {
        "id": 1,
        "group": "general",
        "key": "site_title",
        "value": "MKG PWA",
        "description": "Website title"
      }
    ],
    "page": 1,
    "perPage": 25,
    "total": 1,
    "lastPage": 1
  }
}
```

---

#### 2. Get All Groups
```http
GET /api/setting/sys-options/groups
```

**Response:**
```json
{
  "status": true,
  "message": "Groups retrieved successfully",
  "rows": ["general", "email", "notification", "app"]
}
```

---

#### 3. Get Options by Group
```http
GET /api/setting/sys-options/group/general
```

**Response:**
```json
{
  "status": true,
  "message": "System options retrieved successfully",
  "rows": [
    {
      "id": 1,
      "group": "general",
      "key": "site_title",
      "value": "MKG PWA",
      "description": "Website title"
    },
    {
      "id": 2,
      "group": "general",
      "key": "site_description",
      "value": "Mining Management System",
      "description": "Website description"
    }
  ]
}
```

---

#### 4. Get Option by Key
```http
GET /api/setting/sys-options/key/site_title
```

**Response:**
```json
{
  "status": true,
  "message": "System option retrieved successfully",
  "rows": {
    "id": 1,
    "group": "general",
    "key": "site_title",
    "value": "MKG PWA",
    "description": "Website title"
  }
}
```

---

#### 5. Get Option by ID
```http
GET /api/setting/sys-options/1
```

**Response:**
```json
{
  "status": true,
  "message": "System option retrieved successfully",
  "rows": {
    "id": 1,
    "group": "general",
    "key": "site_title",
    "value": "MKG PWA",
    "description": "Website title"
  }
}
```

---

#### 6. Create Option
```http
POST /api/setting/sys-options/create
```

**Request Body:**
```json
{
  "group": "email",
  "key": "smtp_host",
  "value": "smtp.gmail.com",
  "description": "SMTP server host"
}
```

**Response:**
```json
{
  "status": true,
  "message": "System option created successfully",
  "rows": {
    "id": 3,
    "group": "email",
    "key": "smtp_host",
    "value": "smtp.gmail.com",
    "description": "SMTP server host"
  }
}
```

---

#### 7. Update Option
```http
POST /api/setting/sys-options/1/update
```

**Request Body:**
```json
{
  "value": "MKG Web Application",
  "description": "Updated website title"
}
```

**Response:**
```json
{
  "status": true,
  "message": "System option updated successfully",
  "rows": {
    "id": 1,
    "group": "general",
    "key": "site_title",
    "value": "MKG Web Application",
    "description": "Updated website title"
  }
}
```

---

#### 8. Delete Option
```http
POST /api/setting/sys-options/1/destroy
```

**Response:**
```json
{
  "status": true,
  "message": "System option deleted successfully"
}
```

---

## 🎨 Frontend Usage (React Hooks)

### Import
```javascript
import {
  useGetSysOptions,
  useGetSysOptionGroups,
  useGetSysOptionsByGroup,
  useShowSysOption,
  useGetSysOptionByKey,
} from "api/sys-options";
```

### 1. Get All Options with Pagination
```javascript
function OptionsListPage() {
  const [page, setPage] = useState(1);
  const [group, setGroup] = useState("");

  const { data, pagination, dataLoading, dataError } = useGetSysOptions({
    group: group || undefined,
    page,
    perPage: 25,
  });

  if (dataLoading) return <div>Loading...</div>;
  if (dataError) return <div>Error: {dataError.message}</div>;

  return (
    <div>
      <h1>System Options</h1>
      <table>
        <thead>
          <tr>
            <th>Group</th>
            <th>Key</th>
            <th>Value</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {data.map((option) => (
            <tr key={option.id}>
              <td>{option.group}</td>
              <td>{option.key}</td>
              <td>{option.value}</td>
              <td>{option.description}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {pagination && (
        <div>
          Page {pagination.page} of {pagination.lastPage}
        </div>
      )}
    </div>
  );
}
```

---

### 2. Get All Groups
```javascript
function GroupsSelector() {
  const { data: groups, dataLoading } = useGetSysOptionGroups();

  if (dataLoading) return <div>Loading groups...</div>;

  return (
    <select>
      <option value="">All Groups</option>
      {groups.map((group) => (
        <option key={group} value={group}>
          {group}
        </option>
      ))}
    </select>
  );
}
```

---

### 3. Get Options by Group
```javascript
function GroupOptionsPage({ group }) {
  const { data, dataLoading, dataError } = useGetSysOptionsByGroup(group);

  if (dataLoading) return <div>Loading...</div>;
  if (dataError) return <div>Error: {dataError.message}</div>;

  return (
    <div>
      <h2>Options for: {group}</h2>
      <ul>
        {data.map((option) => (
          <li key={option.id}>
            <strong>{option.key}:</strong> {option.value}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

### 4. Get Option by Key
```javascript
function SiteTitle() {
  const { data, dataLoading } = useGetSysOptionByKey("site_title");

  if (dataLoading) return <div>Loading...</div>;

  return <h1>{data.value || "Default Title"}</h1>;
}
```

---

### 5. Create/Update Option
```javascript
import axiosServices from "utils/axios";

async function createOption(data) {
  try {
    const response = await axiosServices.post(
      "/api/setting/sys-options/create",
      data
    );
    console.log("Created:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

async function updateOption(id, data) {
  try {
    const response = await axiosServices.post(
      `/api/setting/sys-options/${id}/update`,
      data
    );
    console.log("Updated:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

// Usage in component
function OptionForm({ optionId }) {
  const handleSubmit = async (values) => {
    if (optionId) {
      await updateOption(optionId, values);
    } else {
      await createOption(values);
    }
  };

  return <form onSubmit={handleSubmit}>{/* form fields */}</form>;
}
```

---

## 📊 Database Schema

Expected `sys_options` table structure:

```sql
CREATE TABLE sys_options (
  id INT PRIMARY KEY AUTO_INCREMENT,
  `group` VARCHAR(100) NOT NULL,
  `key` VARCHAR(100) NOT NULL UNIQUE,
  `value` TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Sample data
INSERT INTO sys_options (`group`, `key`, `value`, description) VALUES
('general', 'site_title', 'MKG PWA', 'Website title'),
('general', 'site_description', 'Mining Management System', 'Website description'),
('email', 'smtp_host', 'smtp.gmail.com', 'SMTP server host'),
('email', 'smtp_port', '587', 'SMTP server port'),
('notification', 'enable_push', 'true', 'Enable push notifications'),
('app', 'min_version', '1.0.0', 'Minimum app version');
```

---

## 🔒 Security

All endpoints are protected by:
- `auth` middleware - Requires valid JWT token
- `demoProtection` middleware - Prevents demo user modifications

---

## ✅ Testing

### Test with cURL

**Get all options:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3003/api/setting/sys-options/list
```

**Filter by group:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3003/api/setting/sys-options/list?group=email"
```

**Get groups:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3003/api/setting/sys-options/groups
```

**Create option:**
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"group":"test","key":"test_key","value":"test_value"}' \
  http://localhost:3003/api/setting/sys-options/create
```

---

## 📝 Notes

1. **Key uniqueness:** The `key` field must be unique across all groups
2. **Group filtering:** Use `group` query parameter to filter options
3. **Pagination:** Only the `list` endpoint returns paginated data
4. **By-group endpoint:** Returns all options for a group without pagination
5. **Offline support:** Data is cached in IndexedDB via `useOfflineStorage`

---

**Version:** 1.0  
**Last Updated:** 2025-12-25  
**Author:** Development Team
