# Operator App API Documentation

## Overview
The Operator App API provides endpoints for managing water stations, readings, faults, and user authentication. The API is built with Node.js, Express, and PostgreSQL.

## Base URL
- Development: `http://localhost:3001/api`
- Production: `https://your-production-api.com/api`

## Authentication
All endpoints (except login and register) require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Response Format
All API responses follow this format:
```json
{
  "success": boolean,
  "message": string,
  "data": any
}
```

## Error Handling
Errors return appropriate HTTP status codes with error details:
```json
{
  "success": false,
  "message": "Error description",
  "stack": "Error stack trace (development only)"
}
```

## Endpoints

### Authentication

#### POST /auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "admin@operator.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt-token",
    "user": {
      "id": "user-id",
      "email": "admin@operator.com",
      "firstName": "Admin",
      "lastName": "User",
      "role": "admin"
    }
  }
}
```

#### POST /auth/register
Register a new user (admin only).

**Request Body:**
```json
{
  "email": "user@operator.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "role": "operator"
}
```

#### GET /auth/verify
Verify JWT token and get user information.

**Headers:**
```
Authorization: Bearer <token>
```

### Users

#### GET /users
Get all users (admin only).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "user-id",
      "email": "user@operator.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "operator",
      "phone": "+1234567890",
      "isActive": true,
      "lastLogin": "2023-12-01T10:00:00Z",
      "createdAt": "2023-11-01T10:00:00Z",
      "updatedAt": "2023-12-01T10:00:00Z"
    }
  ]
}
```

#### GET /users/profile
Get current user profile.

#### PUT /users/profile
Update current user profile.

#### PUT /users/change-password
Change user password.

### Stations

#### GET /stations
Get all stations (operators see only their assigned stations).

**Query Parameters:**
- `limit` (optional): Number of results per page
- `offset` (optional): Number of results to skip

#### GET /stations/:id
Get station by ID.

#### POST /stations
Create new station (admin only).

**Request Body:**
```json
{
  "name": "Station Alpha",
  "nameAr": "محطة ألفا",
  "locationName": "Downtown",
  "locationNameAr": "وسط المدينة",
  "latitude": 33.5138,
  "longitude": 36.2765,
  "address": "123 Main Street",
  "addressAr": "شارع الرئيسي 123",
  "capacityLiters": 50000,
  "operatorId": "operator-id"
}
```

#### PUT /stations/:id
Update station (admin only).

#### DELETE /stations/:id
Delete station (admin only).

### Readings

#### GET /readings
Get daily readings with optional filters.

**Query Parameters:**
- `stationId` (optional): Filter by station ID
- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date
- `limit` (optional): Number of results per page
- `offset` (optional): Number of results to skip

#### GET /readings/:id
Get reading by ID.

#### POST /readings
Create new reading.

**Request Body:**
```json
{
  "stationId": "station-id",
  "readingDate": "2023-12-01",
  "phLevel": 7.2,
  "tdsLevel": 150,
  "temperature": 25.5,
  "pressure": 2.1,
  "tankLevelPercentage": 85,
  "notes": "Normal operation",
  "notesAr": "تشغيل طبيعي"
}
```

#### PUT /readings/:id
Update reading.

#### DELETE /readings/:id
Delete reading (admin only).

### Faults

#### GET /faults
Get faults with optional filters.

**Query Parameters:**
- `stationId` (optional): Filter by station ID
- `status` (optional): Filter by status
- `priority` (optional): Filter by priority
- `assignedTo` (optional): Filter by assigned user
- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date
- `limit` (optional): Number of results per page
- `offset` (optional): Number of results to skip

#### GET /faults/:id
Get fault by ID.

#### POST /faults
Create new fault.

**Request Body:**
```json
{
  "stationId": "station-id",
  "title": "Pump Malfunction",
  "titleAr": "عطل في المضخة",
  "description": "Pump not working properly",
  "descriptionAr": "المضخة لا تعمل بشكل صحيح",
  "priority": "high",
  "latitude": 33.5138,
  "longitude": 36.2765,
  "photoUrl": "https://example.com/photo.jpg"
}
```

#### PUT /faults/:id
Update fault.

#### DELETE /faults/:id
Delete fault (admin only).

### Sync

#### GET /sync/pending
Get pending sync data for mobile app.

#### POST /sync/upload
Upload offline data from mobile app.

**Request Body:**
```json
{
  "readings": [
    {
      "stationId": "station-id",
      "readingDate": "2023-12-01",
      "phLevel": 7.2,
      "tdsLevel": 150,
      "temperature": 25.5,
      "pressure": 2.1,
      "tankLevelPercentage": 85,
      "notes": "Normal operation",
      "notesAr": "تشغيل طبيعي"
    }
  ],
  "faults": [
    {
      "stationId": "station-id",
      "title": "Pump Malfunction",
      "titleAr": "عطل في المضخة",
      "description": "Pump not working properly",
      "descriptionAr": "المضخة لا تعمل بشكل صحيح",
      "priority": "high"
    }
  ]
}
```

#### POST /sync/mark-synced
Mark data as synced.

### File Upload

#### POST /upload/single
Upload single file.

**Request Body:**
```
Content-Type: multipart/form-data
file: <file>
```

**Response:**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "url": "/uploads/filename.jpg",
    "filename": "filename.jpg",
    "originalName": "photo.jpg",
    "size": 1024000,
    "mimetype": "image/jpeg"
  }
}
```

#### POST /upload/multiple
Upload multiple files.

#### DELETE /upload/:filename
Delete uploaded file.

#### GET /upload/:filename
Get file information.

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

## Rate Limiting

- 100 requests per 15 minutes per IP address
- Exceeded requests return 429 status code

## Data Validation

All input data is validated using Joi schemas:
- Email format validation
- Password minimum length (6 characters)
- Coordinate range validation
- Date format validation
- Required field validation

## Security

- JWT tokens expire after 7 days
- Passwords are hashed using bcrypt
- CORS enabled for web app
- Helmet security headers
- Input sanitization
- SQL injection protection
