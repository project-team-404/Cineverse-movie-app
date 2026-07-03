<div align="center">

<img src="screenshots/logo.png" alt="CineVerse Logo" width="200" height="200" />

#  CineVerse

**AI-Powered Movie Streaming & Discovery Platform**

*Inspired by Netflix · Prime Video · Disney+*

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com)
[![Render](https://img.shields.io/badge/Deployed_on-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://render.com)
[![JWT](https://img.shields.io/badge/Auth-JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)](https://jwt.io)
[![LangChain](https://img.shields.io/badge/LangChain-AI-1C3C3C?style=for-the-badge&logo=chainlink&logoColor=white)](https://langchain.com)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](CONTRIBUTING.md)


[Live Demo](https://cineverse-movie-app.onrender.com) · [API Docs](https://cineverse-movie-app.onrender.com/scalar) · [Report Bug](issues) · [Request Feature](issues)

</div>

---

## 📌 Overview

**CineVerse** is a full-stack AI-powered movie streaming and discovery platform built for modern audiences. It combines a cinematic dark UI with real-time AI features — from semantic movie search and intelligent recommendations to auto-generated review summaries powered by a local LLM pipeline.

Whether you're browsing the latest releases, managing your watchlist, or getting an AI-curated recommendation based on your taste — CineVerse delivers a premium, personalized experience.

> Built as a portfolio-grade team project demonstrating end-to-end product engineering — REST APIs, async databases, LLM integration, JWT auth, Docker deployment, and a polished responsive frontend.

---

## ✨ Features

<details>
<summary><b>🎬 Movie Discovery</b></summary>

- Browse movies with posters, trailers, ratings, and descriptions
- Search by title, genre, year, or language
- Filter and paginate results
- Movie detail page with full info + trailer playback
- Responsive movie cards across all screen sizes

</details>

<details>
<summary><b>🔐 Authentication</b></summary>

- JWT-based login and registration
- Secure password hashing (bcrypt)
- OTP email verification
- Forgot password / reset password flow
- Role-based access (user vs admin)
- Rate limiting via Redis

</details>

<details>
<summary><b>👤 User Features</b></summary>

- Personal profile with photo upload
- Favorites collection
- Watchlist management
- Watch history tracking
- Preferred language and movie settings

</details>

<details>
<summary><b>🤖 AI Features</b></summary>

- **AI Review Summary** — Auto-summarized sentiment analysis from user reviews (Groq LLM + LangChain)
- **AI Movie Recommendations** — Personalized suggestions based on watch history and preferences (LangGraph agents)
- **Semantic Search** — HuggingFace embeddings + ChromaDB vector store for natural language queries
- **Local LLM Support** — Runs fully offline in development mode

</details>

<details>
<summary><b>🛠 Admin Dashboard</b></summary>

- Dashboard with platform statistics
- Manage movies (create, edit, delete, upload images)
- Manage genres
- Manage and moderate user reviews
- AI sentiment summary per movie

</details>

 
| Login | Sign Up | Profile |
|-------|---------|---------|
| ![Login](screenshots/login.jpeg) | ![Signup](screenshots/signup.jpeg) | ![Profile](screenshots/profile.jpeg) |
 
| Home | Movie Details | Movie Page |
|------|--------------|------------|
| ![Home](screenshots/home.jpeg) | ![Movie Detail](screenshots/movie-detail.jpeg) | ![Movie Page](screenshots/movie-page.jpeg) |
 
| Watchlist | Favorites | Watch History | AI Recommendations |
|-----------|-----------|--------------|-------------------|
| ![Watchlist](screenshots/watchlist.jpeg) | ![Favorites](screenshots/favorites.jpeg) | ![Watch History](screenshots/watch-history.jpeg) | ![AI](screenshots/ai%20recomendation.jpeg) |

## 🗂 Project Structure

```
CineVerse/
│
├── frontend/
│   ├── assets/
│   │   └── images/
│   ├── components/
│   │   └── navbar.html
│   ├── css/
│   │   ├── global.css
│   │   ├── login.css
│   │   ├── signup.css
│   │   ├── profile.css
│   │   └── admin.css
│   ├── js/
│   │   ├── auth/
│   │   │   ├── login.js
│   │   │   ├── signup.js
│   │   │   ├── logout.js
│   │   │   └── session.js
│   │   ├── user/
│   │   │   └── profile.js
│   │   ├── config/
│   │   │   └── api.js
│   │   ├── utils/
│   │   │   ├── includeHTML.js
│   │   │   └── cursor.js
│   │   ├── components/
│   │   │   ├── navbar.js
│   │   │   └── toast.js
│   │   └── cv-api.js
│   ├── login.html
│   ├── signup.html
│   ├── home.html
│   ├── profile.html
│   ├── movie_page.html
│   ├── movie-details.html
│   ├── favorites.html
│   ├── watchlist.html
│   ├── admin-dashboard.html
│   ├── manage-movies.html
│   ├── manage-genres.html
│   └── manage-reviews.html
│
├── movie_backend/
│   ├── database/
│   │   └── database.py
│   ├── models/
│   │   ├── user.py
│   │   ├── movie.py
│   │   ├── genre.py
│   │   ├── review.py
│   │   ├── watchlist.py
│   │   ├── favorite.py
│   │   └── profile.py
│   ├── schemas/
│   │   ├── auth_schema.py
│   │   ├── movie_schema.py
│   │   ├── genre_schema.py
│   │   ├── review_schema.py
│   │   └── response_schema.py
│   ├── routes/
│   │   ├── auth.py
│   │   ├── movies.py
│   │   ├── genres.py
│   │   ├── admin.py
│   │   ├── favorites.py
│   │   ├── watchlist.py
│   │   ├── review.py
│   │   └── profile.py
│   ├── services/
│   │   ├── auth_service.py
│   │   ├── movies_service.py
│   │   ├── admin_service.py
│   │   ├── favorite_service.py
│   │   ├── genres_service.py
│   │   └── review_service.py
│   └── util/
│       └── helpers.py
├── AI/
│   └── review_summary.py
├── main.py
├── Dockerfile
├── compose.yaml
├── requirements.txt
└── .env
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.11+
- PostgreSQL 15+
- Node.js (optional, for tooling)
- Docker (optional)

---

### Backend Setup

```bash
# 1. Clone the repository
git clone https://github.com/project-team-404/Cineverse-movie-app.git
cd Cineverse-movie-app

# 2. Create virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment variables
cp .env.example .env
# Edit .env with your values

# 5. Run the application
uvicorn main:app --reload --port 8000
```

---

### Docker Setup

```bash
# Build and run with Docker Compose
docker compose up --build

# Backend will be available at:
# http://localhost:8000

# API Docs:
# http://localhost:8000/docs
# http://localhost:8000/scalar
```

---

### Frontend Setup

```bash
# Option 1: VS Code Live Server
# Right-click login.html → Open with Live Server

# Option 2: Python static server
cd frontend
python -m http.server 5500

# Option 3: Any static file server
npx serve frontend
```

> ⚠️ **Important:** Always open the frontend via a server (not by double-clicking HTML files). Direct file:// URLs break API calls and module imports.

---

## 🔑 Environment Variables

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL=postgresql+asyncpg://username:password@localhost:5432/cineverse_db
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cineverse_db
DB_USER=postgres
DB_PASSWORD=your_password

# Auth
SECRET_KEY=your_super_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Redis
REDIS_URL=redis://localhost:6379

# AI / LLM
GROQ_API_KEY=your_groq_api_key
HUGGINGFACE_API_KEY=your_hf_api_key

# Email (OTP)
EMAIL_USERNAME=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=noreply@cineverse.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
```

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | Full async PostgreSQL connection string |
| `SECRET_KEY` | ✅ | JWT signing secret (use a strong random string) |
| `ALGORITHM` | ✅ | JWT algorithm — typically `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | ✅ | Token TTL in minutes |
| `REDIS_URL` | ⚡ V6 | Redis connection for rate limiting & OTP |
| `GROQ_API_KEY` | 🤖 V5 | Groq cloud LLM API key |
| `HUGGINGFACE_API_KEY` | 🤖 V5 | HuggingFace embeddings API key |
| `EMAIL_USERNAME` | 📧 V6 | SMTP email address for OTP emails |
| `EMAIL_PASSWORD` | 📧 V6 | App password for SMTP auth |

---

## 📡 API Highlights

Full interactive docs available at `/scalar` after running the backend.

| Tag | Endpoint | Method | Description |
|---|---|---|---|
| **Auth** | `/auth/signup` | POST | Register new user |
| **Auth** | `/auth/login` | POST | Login and receive JWT |
| **Auth** | `/auth/me` | GET | Get current user info |
| **Movies** | `/movies/` | GET | List movies (paginated, filtered) |
| **Movies** | `/movies/{id}` | GET | Get single movie |
| **Admin** | `/admin/movies` | POST | Create movie |
| **Admin** | `/admin/movies/{id}` | PATCH | Update movie |
| **Admin** | `/admin/movies/{id}` | DELETE | Delete movie |
| **Genres** | `/genres/` | GET | List all genres |
| **Admin** | `/admin/genres` | POST | Create genre |
| **Favorites** | `/favorites/` | GET | Get user favorites |
| **Favorites** | `/favorites/add/{id}` | POST | Add to favorites |
| **Favorites** | `/favorites/delete/{id}` | DELETE | Remove from favorites |
| **Watchlist** | `/watchlist/` | GET | Get user watchlist |
| **Watchlist** | `/watchlist/add/{id}` | POST | Add to watchlist |
| **Reviews** | `/reviews/{movie_id}` | GET | Get reviews for a movie |
| **Reviews** | `/reviews/{id}` | DELETE | Delete a review (admin) |
| **Profile** | `/profile/` | GET | Get user profile |
| **Profile** | `/profile/` | POST | Create profile |
| **Profile** | `/profile/` | PATCH | Update profile |
| **AI** | `/reviews/ai_summary_review/{id}` | GET | AI sentiment summary |

---

## 🤖 AI Features

### Review Summary
Uses **Groq LLM** via **LangChain** to generate a natural-language sentiment summary from all user reviews for a given movie. Returns an overall sentiment (positive / mixed / negative) and a human-readable paragraph.

### Movie Recommendations *(V5)*
A **LangGraph** agent pipeline that:
1. Reads the user's watch history and favorites
2. Encodes preferences using **HuggingFace Embeddings**
3. Queries a **ChromaDB** vector store of movie metadata
4. Returns semantically similar movie recommendations with explanations

### Semantic Search *(V5)*
Natural language queries like *"show me sci-fi movies after 2020 similar to Interstellar"* are converted to embeddings and matched against the movie vector store — no keyword matching required.

---

## 🔒 Security

| Feature | Implementation |
|---|---|
| Password hashing | `bcrypt` via `passlib` |
| Token auth | JWT (HS256) with expiry |
| Role-based access | Admin route guards |
| OTP verification | Email-based TOTP *(V6)* |
| Rate limiting | Redis + sliding window *(V6)* |
| CORS | Configured per environment |
| SQL injection | Prevented via SQLAlchemy ORM |

---



## ☁️ Deployment

The backend is deployed on **Render** using Docker.

```
Backend URL:  https://cineverse-movie-app.onrender.com
API Docs:     https://cineverse-movie-app.onrender.com/scalar
```

**Deployment steps:**
1. Push to GitHub — Render auto-deploys on every push to `main`
2. Environment variables configured in Render dashboard
3. PostgreSQL database provisioned via Render managed DB
4. Docker image built from `Dockerfile` in project root

---

## 🔮 Future Improvements

- [ ] 💳 **Payment Integration** — Stripe-based premium subscription tiers
- [ ] 📹 **Video Streaming** — HLS video playback with adaptive bitrate
- [ ] 🔔 **Real-time Notifications** — WebSocket-based alerts for new releases
- [ ] 📱 **Mobile App** — React Native iOS/Android client
- [ ] 🌙 **Dark/Light Theme** — User-selectable UI themes
- [ ] 📊 **Analytics Dashboard** — Admin charts for user engagement and movie performance
- [ ] 🌍 **Multi-language Support** — i18n for UI and content
- [ ] 📲 **PWA Support** — Offline-capable progressive web app
- [ ] 🎭 **Watch Parties** — Synchronized group viewing with real-time chat
- [ ] 🔍 **Advanced AI Search** — Voice search + natural language filters

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

```bash
# Fork the repo, then:
git checkout -b feature/your-feature-name
git commit -m "feat: add your feature"
git push origin feature/your-feature-name
# Open a Pull Request
```

Please follow the existing code style and add relevant tests where applicable.

---

## 👨‍💻 Contributors

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/MITHULVS">
        <img src="https://github.com/MITHULVS.png" width="80" height="80" style="border-radius:50%" alt="Mithul V S"/><br/>
        <b>Mithul V S</b>
      </a><br/>
      <sub>@MITHULVS</sub>
    </td>
    <td align="center">
      <a href="https://github.com/Kesavan00725">
        <img src="https://github.com/Kesavan00725.png" width="80" height="80" style="border-radius:50%" alt="Kesavan S"/><br/>
        <b>Kesavan S</b>
      </a><br/>
      <sub>@Kesavan00725</sub>
    </td>
    <td align="center">
      <a href="https://github.com/logesh-profile">
        <img src="https://github.com/logesh-profile.png" width="80" height="80" style="border-radius:50%" alt="Logeshwaran M"/><br/>
        <b>Logeshwaran M</b>
      </a><br/>
      <sub>@logesh-profile</sub>
    </td>
    <td align="center">
      <a href="https://github.com/raghul70">
        <img src="https://github.com/raghul70.png" width="80" height="80" style="border-radius:50%" alt="Raghul"/><br/>
        <b>Raghul</b>
      </a><br/>
      <sub>@raghul70</sub>
    </td>
  </tr>
</table>

*CineVerse is a collaborative team project. All contributions welcome.*

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Built by the CineVerse Team

**[⬆ Back to top](#-cineverse)**

</div>
