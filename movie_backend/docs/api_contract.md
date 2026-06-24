# Movie App Backend API Contract

## Base URL

### Local Development

```http
http://localhost:8000
```

### Production

```http
https://your-backend.onrender.com
```

---

# Authentication

## Signup

### Endpoint

```http
POST /auth/signup
```

### Request Body

```json
{
  "name": "Mithul",
  "email": "mithul@gmail.com",
  "password": "password123"
}
```

### Success Response

```json
{
  "name": "Mithul",
  "email": "mithul@gmail.com"
}
```

---

## Login

### Endpoint

```http
POST /auth/login
```

### Request Body

```json
{
  "email": "mithul@gmail.com",
  "password": "password123"
}
```

### Success Response

```json
{
  "access_token": "jwt_token",
  "token_type": "bearer"
}
```

---

## Logout

### Endpoint

```http
POST /auth/logout
```

### Headers

```http
Authorization: Bearer <token>
```

### Success Response

```json
{
  "message": "Logged out successfully"
}
```

---

## Get Current User

### Endpoint

```http
GET /auth/me
```

### Headers

```http
Authorization: Bearer <token>
```

### Success Response

```json
{
  "name": "Mithul",
  "email": "mithul@gmail.com"
}
```

---

# Movies

## Get Movies

### Endpoint

```http
GET /movies?page=1&limit=10
```

### Response

```json
[
  {
    "id": 1,
    "title": "Interstellar",
    "description": "Space exploration movie",
    "rating": 8.9,
    "poster_url": "https://...",
    "genre": {},
    "images": []
  }
]
```

---

## Get Movie By Id

### Endpoint

```http
GET /movies/{movie_id}
```

---

## Search Movies

### Endpoint

```http
GET /movies/search?q=interstellar&page=1&limit=10
```

---

## Filter Movies

### Endpoint

```http
GET /movies/filter?genre=Action&language=English&year=2024&page=1&limit=10
```

---

# Genres

## Get Genres

### Endpoint

```http
GET /genres
```

### Response

```json
[
  {
    "id": 1,
    "name": "Action"
  }
]
```

---

# Favorites

## Add Favorite

### Endpoint

```http
POST /favorites/{movie_id}
```

### Headers

```http
Authorization: Bearer <token>
```

---

## Remove Favorite

### Endpoint

```http
DELETE /favorites/{movie_id}
```

### Headers

```http
Authorization: Bearer <token>
```

---

## Get Favorites

### Endpoint

```http
GET /favorites
```

### Headers

```http
Authorization: Bearer <token>
```

---

# Reviews

## Create Review

### Endpoint

```http
POST /reviews/{movie_id}
```

### Headers

```http
Authorization: Bearer <token>
```

### Request Body

```json
{
  "rating": 5,
  "content": "Amazing movie"
}
```

---

## Get Reviews

### Endpoint

```http
GET /reviews/{movie_id}
```

---

## Update Review

### Endpoint

```http
PATCH /reviews/{review_id}
```

### Headers

```http
Authorization: Bearer <token>
```

---

## Delete Review

### Endpoint

```http
DELETE /reviews/{review_id}
```

### Headers

```http
Authorization: Bearer <token>
```

---

# Admin APIs

> Requires Admin Role

### Movies

```http
POST   /admin/movies
PATCH  /admin/movies/{movie_id}
DELETE /admin/movies/{movie_id}
```

### Genres

```http
POST   /admin/genres
PATCH  /admin/genres/{genre_id}
DELETE /admin/genres/{genre_id}
```

### Movie Images

```http
POST   /admin/movies/{movie_id}/images
DELETE /admin/movie-images/{image_id}
```

---

# Common Error Responses

## Unauthorized

```json
{
  "detail": "Invalid token"
}
```

## Not Found

```json
{
  "detail": "Movie not found"
}
```

## Validation Error

```json
{
  "detail": [
    {
      "msg": "Field required"
    }
  ]
}
```
