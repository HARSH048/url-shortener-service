# URL Shortener API with Advanced Analytics

A robust URL shortening service with comprehensive analytics capabilities, built with Node.js, Express, MongoDB, and Redis.

## Features

- URL shortening with custom aliases
- Topic-based URL organization
- Comprehensive analytics tracking
- Redis caching for improved performance
- Real-time click tracking
- Device and OS analytics
- Authentication and authorization

## Tech Stack

- Node.js & Express
- MongoDB with Mongoose
- Redis for caching
- JWT for authentication

## API Documentation

### Authentication

```http
POST /api/auth/google
```

### URL SHORT API

```http
POST /api/url/shorten
```

Create a new short URL

```http
POST /api/url/:shortCode
```

Redirect to Long Url

```http
POST /api/url/:shortCode
```

Analytics of short url

```http
POST /api/url'/:shortCode/analytics
```

login and create user with google signin

All analytics endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### URL Analytics API

#### Get URL-specific Analytics

```http
GET /api/analytics/:alias
```

Retrieves detailed analytics for a specific shortened URL.

**Response:**

```json
{
  "totalClicks": 150,
  "uniqueClicks": 75,
  "clicksByDate": [
    {
      "date": "2024-03-10",
      "clicks": 25,
      "uniqueUsers": 15
    }
  ],
  "osType": [
    {
      "osName": "Windows",
      "uniqueClicks": 45,
      "uniqueUsers": 30,
      "browsers": [
        {
          "browser": "Chrome 122",
          "users": 25
        }
      ]
    }
  ],
  "deviceType": [
    {
      "deviceName": "desktop",
      "uniqueClicks": 80,
      "uniqueUsers": 45,
      "models": [
        {
          "model": "Windows PC",
          "users": 40
        }
      ]
    }
  ]
}
```

#### Get Topic-Based Analytics

```http
GET /api/analytics/topic/:topic
```

Retrieves analytics for all URLs under a specific topic.

**Response:**

```json
{
  "totalClicks": 500,
  "uniqueClicks": 250,
  "clicksByDate": [
    {
      "date": "2024-03-10",
      "clicks": 75
    }
  ],
  "urls": [
    {
      "shortUrl": "http://domain.com/abc123",
      "totalClicks": 150,
      "uniqueClicks": 75
    }
  ],
  "osStats": [
    {
      "osName": "Windows",
      "uniqueClicks": 300,
      "uniqueUsers": 150
    }
  ],
  "deviceStats": [
    {
      "deviceName": "mobile",
      "uniqueClicks": 200,
      "uniqueUsers": 100
    }
  ]
}
```

#### Get Overall Analytics

```http
GET /api/analytics/overall
```

Retrieves comprehensive analytics for all URLs created by the authenticated user.

**Response:**

```json
{
  "totalUrls": 25,
  "totalClicks": 1500,
  "uniqueClicks": 750,
  "clicksByDate": [
    {
      "date": "2024-03-10",
      "clicks": 200
    }
  ],
  "osType": [
    {
      "osName": "iOS",
      "uniqueClicks": 400,
      "uniqueUsers": 200
    }
  ],
  "deviceType": [
    {
      "deviceName": "mobile",
      "uniqueClicks": 600,
      "uniqueUsers": 300
    }
  ]
}
```

## Caching Strategy

The API implements a sophisticated caching strategy using Redis:

- URL redirects: Cached for 1 hour
- Analytics data: Cached for 5 minutes
- Topic analytics: Cached for 5 minutes
- Overall analytics: Cached for 5 minutes

Cache invalidation occurs automatically when:

- A URL is accessed (click count updates)
- Analytics data is updated
- New URLs are created under a topic

## Environment Variables

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/url-shortener
JWT_SECRET=your_jwt_secret
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
```

## Data Collection

The analytics system collects:

- Click timestamps
- IP addresses (for unique visitor tracking)
- User agent information
- Operating system data
- Device information
- Browser details
- Geographic location (if available)

## Performance Considerations

- Aggregated analytics are cached to reduce database load
- Asynchronous tracking of analytics data
- Efficient database indexing
- Optimized MongoDB aggregation pipelines
- Rate limiting on all endpoints

## Security Features

- JWT-based authentication
- Rate limiting to prevent abuse
- Input validation and sanitization
- Secure headers configuration
- CORS configuration

## Error Handling

The API implements comprehensive error handling:

- Validation errors
- Authentication errors
- Rate limiting errors
- Database errors
- Cache errors

All errors return appropriate HTTP status codes and descriptive messages.
