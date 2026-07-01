(function () {

    const isLocal =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";

    window.API_BASE = isLocal
        ? "http://127.0.0.1:8000"
        : "https://cineverse-movie-app.onrender.com";

})();