# Movie API Contract

**Version:** v1.0
**OpenAPI Specification:** 3.1.0

---

# Overview

The Movie API provides endpoints for user authentication, movie management, reviews, favorites, watchlists, genres, and AI-powered review summaries.

## Base URL

### Development

```text
http://localhost:8000
```

### Production

```text
https://your-domain.com
```

---

# Authentication

Protected endpoints require a JWT access token.

### Header

```http
Authorization: Bearer <access_token>
```

---

# Root

## GET /

### Description

Checks whether the API is running.

### Authentication

Not Required

### Request

No request body.

### Success Response

**Status:** `200 OK`

```json
{
  "message": "Movie API is running."
}
```

---

# Authentication APIs

---

## POST /auth/signup

### Description

Registers a new user account.

### Authentication

Not Required

### Headers

```http
Content-Type: application/json
```

### Request Body

| Field    | Type   | Required | Description         |
| -------- | ------ | -------- | ------------------- |
| name     | string | Yes      | User's full name    |
| email    | string | Yes      | Valid email address |
| password | string | Yes      | User password       |

### Example Request

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password@123"
}
```

### Success Response

**Status:** `200 OK`

```json
{
  "name": "John Doe",
  "email": "john@example.com"
}
```

### Error Responses

#### 400 Bad Request

```json
{
  "detail": "Email already registered."
}
```

#### 422 Validation Error

```json
{
  "detail": [
    {
      "loc": [
        "body",
        "email"
      ],
      "msg": "value is not a valid email address"
    }
  ]
}
```

---

## POST /auth/login

### Description

Authenticates a registered user and returns a JWT access token.

### Authentication

Not Required

### Headers

```http
Content-Type: application/json
```

### Request Body

| Field    | Type   | Required |
| -------- | ------ | -------- |
| email    | string | Yes      |
| password | string | Yes      |

### Example Request

```json
{
  "email": "john@example.com",
  "password": "Password@123"
}
```

### Success Response

**Status:** `200 OK`

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### Error Response

#### 401 Unauthorized

```json
{
  "detail": "Invalid email or password."
}
```

#### 422 Validation Error

```json
{
  "detail": [
    {
      "loc": [
        "body",
        "password"
      ],
      "msg": "Field required"
    }
  ]
}
```

---

## POST /auth/logout

### Description

Logs out the currently authenticated user.

### Authentication

Required

### Headers

```http
Authorization: Bearer <access_token>
```

### Request

No request body.

### Success Response

**Status:** `200 OK`

```json
{
  "message": "Successfully logged out."
}
```

### Error Response

#### 401 Unauthorized

```json
{
  "detail": "Invalid or expired token."
}
```

---

## GET /auth/me

### Description

Returns details of the currently authenticated user.

### Authentication

Required

### Headers

```http
Authorization: Bearer <access_token>
```

### Request

No request body.

### Success Response

**Status:** `200 OK`

```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com"
}
```

### Error Response

#### 401 Unauthorized

```json
{
  "detail": "Authentication required."
}
```

---

## Common HTTP Status Codes

| Status Code | Description                    |
| ----------- | ------------------------------ |
| 200         | Request completed successfully |
| 201         | Resource created               |
| 400         | Bad request                    |
| 401         | Unauthorized                   |
| 403         | Forbidden                      |
| 404         | Resource not found             |
| 422         | Validation error               |
| 500         | Internal server error          |

# Movies API

---

## GET /movies/

### Description

Returns a paginated list of all available movies.

### Authentication

Not Required

### Query Parameters

| Parameter | Type    | Required | Description                   |
| --------- | ------- | -------- | ----------------------------- |
| page      | integer | No       | Page number (default: 1)      |
| limit     | integer | No       | Movies per page (default: 10) |

### Example Request

```http
GET /movies/?page=1&limit=10
```

### Success Response

**Status:** `200 OK`

```json
[
  {
    "id": 1,
    "title": "Inception",
    "release_year": 2010,
    "rating": 8.8,
    "genre": "Sci-Fi",
    "poster_url": "https://example.com/posters/inception.jpg"
  },
  {
    "id": 2,
    "title": "Interstellar",
    "release_year": 2014,
    "rating": 8.7,
    "genre": "Sci-Fi",
    "poster_url": "https://example.com/posters/interstellar.jpg"
  }
]
```

### Error Response

```json
{
  "detail": "Unable to fetch movies."
}
```

---

## GET /movies/{movie_id}

### Description

Returns complete information for a specific movie.

### Authentication

Not Required

### Path Parameters

| Parameter | Type    | Required |
| --------- | ------- | -------- |
| movie_id  | integer | Yes      |

### Example Request

```http
GET /movies/1
```

### Success Response

```json
{
  "id": 1,
  "title": "Inception",
  "description": "A thief who enters dreams to steal secrets.",
  "release_year": 2010,
  "duration": 148,
  "rating": 8.8,
  "genre": "Sci-Fi",
  "director": "Christopher Nolan",
  "poster_url": "https://example.com/posters/inception.jpg",
  "backdrop_url": "https://example.com/backdrop/inception.jpg"
}
```

### Error Response

```json
{
  "detail": "Movie not found."
}
```

---

## GET /movies/search/

### Description

Searches movies by title.

### Authentication

Not Required

### Query Parameters

| Parameter | Type   | Required | Description |
| --------- | ------ | -------- | ----------- |
| query     | string | Yes      | Movie title |

### Example Request

```http
GET /movies/search/?query=batman
```

### Success Response

```json
[
  {
    "id": 15,
    "title": "The Batman",
    "release_year": 2022,
    "rating": 7.9,
    "genre": "Action"
  },
  {
    "id": 28,
    "title": "Batman Begins",
    "release_year": 2005,
    "rating": 8.2,
    "genre": "Action"
  }
]
```

### Error Response

```json
{
  "detail": "No movies found."
}
```

---

## GET /movies/filter/

### Description

Returns movies matching the selected filters.

### Authentication

Not Required

### Query Parameters

| Parameter  | Type    | Required |
| ---------- | ------- | -------- |
| genre_id   | integer | No       |
| year       | integer | No       |
| min_rating | float   | No       |

### Example Request

```http
GET /movies/filter/?genre_id=2&year=2024&min_rating=8
```

### Success Response

```json
[
  {
    "id": 30,
    "title": "Dune: Part Two",
    "genre": "Sci-Fi",
    "rating": 8.5,
    "release_year": 2024
  }
]
```

### Error Response

```json
{
  "detail": "No movies match the selected filters."
}
```

---

## GET /movies/latest/

### Description

Returns the latest released movies.

### Authentication

Not Required

### Example Request

```http
GET /movies/latest/
```

### Success Response

```json
[
  {
    "id": 40,
    "title": "Mission Impossible",
    "release_year": 2025,
    "rating": 8.4
  }
]
```

---

## GET /movies/top-rated/

### Description

Returns movies with the highest ratings.

### Authentication

Not Required

### Example Request

```http
GET /movies/top-rated/
```

### Success Response

```json
[
  {
    "id": 1,
    "title": "The Shawshank Redemption",
    "rating": 9.3
  },
  {
    "id": 2,
    "title": "The Godfather",
    "rating": 9.2
  }
]
```

---

## GET /movies/popular/

### Description

Returns the most popular movies.

### Authentication

Not Required

### Example Request

```http
GET /movies/popular/
```

### Success Response

```json
[
  {
    "id": 8,
    "title": "Avengers: Endgame",
    "rating": 8.4
  },
  {
    "id": 11,
    "title": "Spider-Man: No Way Home",
    "rating": 8.2
  }
]
```

---

## GET /movies/recommendations/{movie_id}

### Description

Returns recommended movies based on the selected movie.

### Authentication

Not Required

### Path Parameters

| Parameter | Type    | Required |
| --------- | ------- | -------- |
| movie_id  | integer | Yes      |

### Example Request

```http
GET /movies/recommendations/1
```

### Success Response

```json
[
  {
    "id": 2,
    "title": "Interstellar",
    "genre": "Sci-Fi",
    "rating": 8.7
  },
  {
    "id": 3,
    "title": "Tenet",
    "genre": "Sci-Fi",
    "rating": 7.8
  }
]
```

### Error Response

```json
{
  "detail": "Movie not found."
}
```

---

## Common Movie Status Codes

| Status | Meaning               |
| ------ | --------------------- |
| 200    | Success               |
| 400    | Bad Request           |
| 404    | Movie Not Found       |
| 422    | Validation Error      |
| 500    | Internal Server Error |

# Genres API

---

## GET /genres/

### Description

Returns a list of all movie genres.

### Authentication

Not Required

### Request

No request body.

### Example Request

```http
GET /genres/
```

### Success Response

**Status:** `200 OK`

```json
[
  {
    "id": 1,
    "name": "Action"
  },
  {
    "id": 2,
    "name": "Comedy"
  },
  {
    "id": 3,
    "name": "Drama"
  },
  {
    "id": 4,
    "name": "Science Fiction"
  },
  {
    "id": 5,
    "name": "Thriller"
  }
]
```

### Error Response

**500 Internal Server Error**

```json
{
    "detail": "Unable to fetch genres."
}
```

---

## GET /genres/{genre_id}

> Include this endpoint only if it exists in your project.

### Description

Returns details of a specific genre.

### Authentication

Not Required

### Path Parameters

| Name     | Type    | Required | Description |
| -------- | ------- | -------- | ----------- |
| genre_id | integer | Yes      | Genre ID    |

### Example Request

```http
GET /genres/1
```

### Success Response

```json
{
    "id": 1,
    "name": "Action"
}
```

### Error Response

```json
{
    "detail": "Genre not found."
}
```

---

# Admin Genre APIs

These endpoints require administrator privileges.

---

## POST /admin/genres

### Description

Creates a new movie genre.

### Authentication

Required (Admin)

### Headers

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Request Body

| Field | Type   | Required |
| ----- | ------ | -------- |
| name  | string | Yes      |

### Example Request

```json
{
    "name": "Adventure"
}
```

### Success Response

**Status:** `201 Created`

```json
{
    "id": 6,
    "name": "Adventure"
}
```

### Error Responses

**400 Bad Request**

```json
{
    "detail": "Genre already exists."
}
```

**401 Unauthorized**

```json
{
    "detail": "Authentication required."
}
```

**403 Forbidden**

```json
{
    "detail": "Admin access required."
}
```

---

## PATCH /admin/genres/{genre_id}

### Description

Updates an existing genre.

### Authentication

Required (Admin)

### Headers

```http
Authorization: Bearer <access_token>
```

### Path Parameters

| Name     | Type    |
| -------- | ------- |
| genre_id | integer |

### Example Request

```json
{
    "name": "Science Fiction"
}
```

### Success Response

```json
{
    "id": 4,
    "name": "Science Fiction"
}
```

### Error Responses

```json
{
    "detail": "Genre not found."
}
```

---

## DELETE /admin/genres/{genre_id}

### Description

Deletes a genre.

### Authentication

Required (Admin)

### Headers

```http
Authorization: Bearer <access_token>
```

### Path Parameters

| Name     | Type    |
| -------- | ------- |
| genre_id | integer |

### Example Request

```http
DELETE /admin/genres/6
```

### Success Response

```json
{
    "message": "Genre deleted successfully."
}
```

### Error Responses

```json
{
    "detail": "Genre not found."
}
```

---

# Genre Status Codes

| Status Code | Description                |
| ----------- | -------------------------- |
| 200         | Successful request         |
| 201         | Genre created successfully |
| 400         | Invalid request            |
| 401         | Authentication required    |
| 403         | Admin access required      |
| 404         | Genre not found            |
| 422         | Validation error           |
| 500         | Internal server error      |

# Admin Movie APIs

> **Note:** All endpoints in this section require **Admin** authentication.

---

# POST /admin/movies

## Description

Creates a new movie.

### Authentication

Required (Admin)

### Headers

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Request Body

| Field        | Type    | Required | Description        |
| ------------ | ------- | -------- | ------------------ |
| title        | string  | Yes      | Movie title        |
| description  | string  | Yes      | Movie description  |
| release_year | integer | Yes      | Release year       |
| duration     | integer | Yes      | Duration (minutes) |
| genre_id     | integer | Yes      | Genre ID           |
| rating       | number  | Yes      | IMDb/User rating   |

### Example Request

```json
{
    "title": "Inception",
    "description": "A thief who steals secrets through dream-sharing technology.",
    "release_year": 2010,
    "duration": 148,
    "genre_id": 2,
    "rating": 8.8
}
```

### Success Response

**Status:** `201 Created`

```json
{
    "id": 1,
    "title": "Inception",
    "message": "Movie created successfully."
}
```

### Error Responses

#### 400 Bad Request

```json
{
    "detail": "Movie already exists."
}
```

#### 401 Unauthorized

```json
{
    "detail": "Authentication required."
}
```

#### 403 Forbidden

```json
{
    "detail": "Admin privileges required."
}
```

#### 422 Validation Error

```json
{
    "detail": [
        {
            "loc": [
                "body",
                "title"
            ],
            "msg": "Field required"
        }
    ]
}
```

---

# PATCH /admin/movies/{movie_id}

## Description

Updates an existing movie.

### Authentication

Required (Admin)

### Headers

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Path Parameters

| Name     | Type    | Required |
| -------- | ------- | -------- |
| movie_id | integer | Yes      |

### Example Request

```json
{
    "title": "Inception (Updated)",
    "rating": 9.0
}
```

### Success Response

```json
{
    "id": 1,
    "title": "Inception (Updated)",
    "message": "Movie updated successfully."
}
```

### Error Responses

```json
{
    "detail": "Movie not found."
}
```

---

# DELETE /admin/movies/{movie_id}

## Description

Deletes a movie.

### Authentication

Required (Admin)

### Headers

```http
Authorization: Bearer <access_token>
```

### Path Parameters

| Name     | Type    |
| -------- | ------- |
| movie_id | integer |

### Example Request

```http
DELETE /admin/movies/1
```

### Success Response

```json
{
    "message": "Movie deleted successfully."
}
```

### Error Response

```json
{
    "detail": "Movie not found."
}
```

---

# POST /admin/movies/{movie_id}/images

## Description

Uploads one or more images for a movie.

### Authentication

Required (Admin)

### Headers

```http
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

### Path Parameters

| Name     | Type    |
| -------- | ------- |
| movie_id | integer |

### Form Data

| Field | Type | Required |
| ----- | ---- | -------- |
| image | file | Yes      |

### Example Request

```text
POST /admin/movies/1/images

Form Data:
image = inception-poster.jpg
```

### Success Response

```json
{
    "id": 5,
    "image_url": "https://example.com/uploads/inception-poster.jpg",
    "message": "Image uploaded successfully."
}
```

### Error Responses

```json
{
    "detail": "Unsupported file format."
}
```

```json
{
    "detail": "Movie not found."
}
```

---

# DELETE /admin/movie-images/{image_id}

## Description

Deletes an uploaded movie image.

### Authentication

Required (Admin)

### Headers

```http
Authorization: Bearer <access_token>
```

### Path Parameters

| Name     | Type    |
| -------- | ------- |
| image_id | integer |

### Example Request

```http
DELETE /admin/movie-images/5
```

### Success Response

```json
{
    "message": "Movie image deleted successfully."
}
```

### Error Response

```json
{
    "detail": "Image not found."
}
```

---

# Common Status Codes

| Status | Description                   |
| ------ | ----------------------------- |
| 200    | Request successful            |
| 201    | Resource created successfully |
| 400    | Bad request                   |
| 401    | Authentication required       |
| 403    | Admin access required         |
| 404    | Movie/Image not found         |
| 422    | Validation error              |
| 500    | Internal server error         |

# Favorites API

---

# Overview

The Favorites API allows authenticated users to add movies to their favorites, remove them, and retrieve their favorite movies.

> **Authentication Required:** Yes (JWT Bearer Token)

---

# POST /favorites/add/{movie_id}

## Description

Adds a movie to the authenticated user's favorites.

### Authentication

Required

### Headers

```http
Authorization: Bearer <access_token>
```

### Path Parameters

| Name     | Type    | Required | Description            |
| -------- | ------- | -------- | ---------------------- |
| movie_id | integer | Yes      | ID of the movie to add |

### Request Body

None

### Example Request

```http
POST /favorites/add/5
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Success Response

**Status:** `200 OK`

```json
{
    "message": "Movie added to favorites successfully."
}
```

### Error Responses

#### 400 Bad Request

```json
{
    "detail": "Movie already exists in favorites."
}
```

#### 401 Unauthorized

```json
{
    "detail": "Authentication required."
}
```

#### 404 Not Found

```json
{
    "detail": "Movie not found."
}
```

---

# DELETE /favorites/delete/{movie_id}

## Description

Removes a movie from the authenticated user's favorites.

### Authentication

Required

### Headers

```http
Authorization: Bearer <access_token>
```

### Path Parameters

| Name     | Type    | Required |
| -------- | ------- | -------- |
| movie_id | integer | Yes      |

### Request Body

None

### Example Request

```http
DELETE /favorites/delete/5
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Success Response

```json
{
    "message": "Movie removed from favorites successfully."
}
```

### Error Responses

#### 401 Unauthorized

```json
{
    "detail": "Authentication required."
}
```

#### 404 Not Found

```json
{
    "detail": "Favorite movie not found."
}
```

---

# GET /favorites/

## Description

Returns all favorite movies of the authenticated user.

### Authentication

Required

### Headers

```http
Authorization: Bearer <access_token>
```

### Request Body

None

### Example Request

```http
GET /favorites/
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Success Response

**Status:** `200 OK`

```json
[
    {
        "id": 1,
        "movie_id": 5
    },
    {
        "id": 2,
        "movie_id": 8
    },
    {
        "id": 3,
        "movie_id": 12
    }
]
```

> If your API returns nested movie details instead of only `movie_id`, replace the example with your actual response model.

Example:

```json
[
    {
        "id": 1,
        "movie": {
            "id": 5,
            "title": "Inception",
            "genre": "Sci-Fi",
            "rating": 8.8,
            "poster_url": "https://example.com/posters/inception.jpg"
        }
    }
]
```

### Error Responses

#### 401 Unauthorized

```json
{
    "detail": "Authentication required."
}
```

#### 500 Internal Server Error

```json
{
    "detail": "Unable to retrieve favorite movies."
}
```

---

# Favorites Status Codes

| Status Code | Description                       |
| ----------- | --------------------------------- |
| 200         | Success                           |
| 400         | Movie already exists in favorites |
| 401         | Authentication required           |
| 404         | Movie/Favorite not found          |
| 422         | Validation error                  |
| 500         | Internal server error             |

# Reviews API

---

# Overview

The Reviews API allows authenticated users to create, view, update, and delete movie reviews. It also provides an AI-powered review summary generated from user reviews.

> **Authentication Required:** Yes (except where your implementation allows public access to viewing reviews).

---

# POST /reviews/{movie_id}

## Description

Creates a review for the specified movie.

### Authentication

Required

### Headers

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Path Parameters

| Name     | Type    | Required | Description |
| -------- | ------- | -------- | ----------- |
| movie_id | integer | Yes      | Movie ID    |

### Request Body

| Field  | Type    | Required | Description  |
| ------ | ------- | -------- | ------------ |
| rating | integer | Yes      | Rating (1–5) |
| review | string  | Yes      | User review  |

### Example Request

```json
{
    "rating": 5,
    "review": "Amazing movie with excellent visuals and storytelling."
}
```

### Success Response

**Status:** `201 Created`

```json
{
    "id": 14,
    "movie_id": 5,
    "user_id": 2,
    "rating": 5,
    "review": "Amazing movie with excellent visuals and storytelling.",
    "created_at": "2026-06-25T18:30:12Z"
}
```

### Error Responses

#### 400 Bad Request

```json
{
    "detail": "You have already reviewed this movie."
}
```

#### 404 Not Found

```json
{
    "detail": "Movie not found."
}
```

#### 401 Unauthorized

```json
{
    "detail": "Authentication required."
}
```

---

# GET /reviews/{movie_id}

## Description

Returns all reviews for the specified movie.

### Authentication

Not Required (or Required if your API enforces authentication)

### Path Parameters

| Name     | Type    |
| -------- | ------- |
| movie_id | integer |

### Example Request

```http
GET /reviews/5
```

### Success Response

```json
[
    {
        "id": 1,
        "user": "John Doe",
        "rating": 5,
        "review": "Fantastic movie!",
        "created_at": "2026-06-25T12:00:00Z"
    },
    {
        "id": 2,
        "user": "Jane Smith",
        "rating": 4,
        "review": "Very enjoyable.",
        "created_at": "2026-06-25T14:10:30Z"
    }
]
```

### Error Response

```json
{
    "detail": "Movie not found."
}
```

---

# PATCH /reviews/{review_id}

## Description

Updates a review created by the authenticated user.

### Authentication

Required

### Headers

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Path Parameters

| Name      | Type    |
| --------- | ------- |
| review_id | integer |

### Example Request

```json
{
    "rating": 4,
    "review": "After watching again, I liked it even more."
}
```

### Success Response

```json
{
    "id": 14,
    "rating": 4,
    "review": "After watching again, I liked it even more.",
    "message": "Review updated successfully."
}
```

### Error Responses

#### 403 Forbidden

```json
{
    "detail": "You can only edit your own review."
}
```

#### 404 Not Found

```json
{
    "detail": "Review not found."
}
```

---

# DELETE /reviews/{review_id}

## Description

Deletes a review created by the authenticated user.

### Authentication

Required

### Headers

```http
Authorization: Bearer <access_token>
```

### Path Parameters

| Name      | Type    |
| --------- | ------- |
| review_id | integer |

### Example Request

```http
DELETE /reviews/14
```

### Success Response

```json
{
    "message": "Review deleted successfully."
}
```

### Error Responses

#### 403 Forbidden

```json
{
    "detail": "You can only delete your own review."
}
```

#### 404 Not Found

```json
{
    "detail": "Review not found."
}
```

---

# GET /reviews/ai_summary_review/{movie_id}

## Description

Generates an AI-powered summary based on all reviews for the specified movie.

### Authentication

Required (adjust if your implementation allows public access)

### Headers

```http
Authorization: Bearer <access_token>
```

### Path Parameters

| Name     | Type    |
| -------- | ------- |
| movie_id | integer |

### Example Request

```http
GET /reviews/ai_summary_review/5
```

### Success Response

```json
{
    "summary_message": "Most users praise the movie for its engaging story, outstanding performances, and impressive visuals. The overall audience sentiment is highly positive, with many recommending it to fans of science fiction."
}
```

### Error Responses

#### 404 Not Found

```json
{
    "detail": "Movie not found."
}
```

#### 500 Internal Server Error

```json
{
    "detail": "Unable to generate AI review summary."
}
```

---

# Review Status Codes

| Status Code | Description                 |
| ----------- | --------------------------- |
| 200         | Request successful          |
| 201         | Review created successfully |
| 400         | Invalid request             |
| 401         | Authentication required     |
| 403         | Permission denied           |
| 404         | Movie or review not found   |
| 422         | Validation error            |
| 500         | Internal server error       |

# Watchlist API

---

# Overview

The Watchlist API allows authenticated users to save movies they plan to watch later, remove movies from their watchlist, and retrieve their personal watchlist.

> **Authentication Required:** Yes (JWT Bearer Token)

---

# POST /watchlist/add/{movie_id}

## Description

Adds a movie to the authenticated user's watchlist.

### Authentication

Required

### Headers

```http
Authorization: Bearer <access_token>
```

### Path Parameters

| Name     | Type    | Required | Description            |
| -------- | ------- | -------- | ---------------------- |
| movie_id | integer | Yes      | ID of the movie to add |

### Request Body

None

### Example Request

```http
POST /watchlist/add/5
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Success Response

**Status:** `200 OK`

```json
{
    "message": "Movie added to watchlist successfully."
}
```

### Error Responses

#### 400 Bad Request

```json
{
    "detail": "Movie already exists in watchlist."
}
```

#### 401 Unauthorized

```json
{
    "detail": "Authentication required."
}
```

#### 404 Not Found

```json
{
    "detail": "Movie not found."
}
```

---

# DELETE /watchlist/{movie_id}

## Description

Removes a movie from the authenticated user's watchlist.

### Authentication

Required

### Headers

```http
Authorization: Bearer <access_token>
```

### Path Parameters

| Name     | Type    | Required |
| -------- | ------- | -------- |
| movie_id | integer | Yes      |

### Request Body

None

### Example Request

```http
DELETE /watchlist/5
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Success Response

```json
{
    "message": "Movie removed from watchlist successfully."
}
```

### Error Responses

#### 401 Unauthorized

```json
{
    "detail": "Authentication required."
}
```

#### 404 Not Found

```json
{
    "detail": "Movie not found in watchlist."
}
```

---

# GET /watchlist/

## Description

Returns all movies saved in the authenticated user's watchlist.

### Authentication

Required

### Headers

```http
Authorization: Bearer <access_token>
```

### Request Body

None

### Example Request

```http
GET /watchlist/
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Success Response

```json
[
    {
        "id": 1,
        "movie_id": 5
    },
    {
        "id": 2,
        "movie_id": 9
    }
]
```

> If your API returns complete movie information instead of only `movie_id`, use a response like this:

```json
[
    {
        "id": 1,
        "movie": {
            "id": 5,
            "title": "Inception",
            "genre": "Sci-Fi",
            "rating": 8.8,
            "poster_url": "https://example.com/posters/inception.jpg"
        }
    }
]
```

### Error Responses

#### 401 Unauthorized

```json
{
    "detail": "Authentication required."
}
```

#### 500 Internal Server Error

```json
{
    "detail": "Unable to retrieve watchlist."
}
```

---

# Watchlist Status Codes

| Status Code | Description                       |
| ----------- | --------------------------------- |
| 200         | Request successful                |
| 400         | Movie already exists in watchlist |
| 401         | Authentication required           |
| 404         | Movie or watchlist item not found |
| 422         | Validation error                  |
| 500         | Internal server error             |

