(function () {

    const isLocalBackend = false; 

    window.API_BASE = isLocalBackend
        ? "http://127.0.0.1:8000"
        : "https://cineverse-movie-app.onrender.com";

})();