# API Documentation

## Base URL

```
http://localhost:5000/api
```

## Authentication

Currently not implemented. JWT authentication will be added in future iterations.

## Endpoints

### Test Endpoint

**GET** `/test`

Tests API connectivity and returns server status.

#### Response

```json
{
  "success": true,
  "message": "API working",
  "data": {
    "timestamp": "2024-02-28T15:47:00.000Z",
    "environment": "development"
  }
}
```

### Health Check

**GET** `/health`

Checks server health and uptime.

#### Response

```json
{
  "status": "OK",
  "timestamp": "2024-02-28T15:47:00.000Z",
  "uptime": 123.456
}
```

## Error Handling

All errors follow this format:

```json
{
  "success": false,
  "error": "Error message"
}
```

In development mode, stack traces are included:

```json
{
  "success": false,
  "error": "Error message",
  "stack": "Error: Error message\n    at ..."
}
```

## HTTP Status Codes

- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

## Future Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user

### Users
- `GET /users` - Get all users (admin only)
- `GET /users/:id` - Get user by ID
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user

## Request/Response Examples

### Making a Request

```javascript
// Using fetch
const response = await fetch('http://localhost:5000/api/test');
const data = await response.json();

// Using axios
const response = await axios.get('http://localhost:5000/api/test');
console.log(response.data);
```

### Error Handling

```javascript
try {
  const response = await fetch('http://localhost:5000/api/test');
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  console.log(data);
} catch (error) {
  console.error('API Error:', error);
}
```

## Rate Limiting

Not implemented yet. Will be added in production.

## CORS

CORS is configured to allow requests from the frontend URL specified in environment variables.

## Security

- Helmet middleware for security headers
- Input validation (to be implemented)
- SQL injection prevention via Prisma ORM
- XSS protection (to be enhanced)
