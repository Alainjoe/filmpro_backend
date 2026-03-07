require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const app = express();

/* =========================
   MIDDLEWARES
========================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.set("trust proxy", 1);

/* =========================
   CORS
========================= */
const allowedOrigins = [
   "https://backend-1hwn.onrender.com",
  "https://filmpro-frontend.onrender.com",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

/* =========================
   ROUTES API
========================= */
app.use("/api/auth",     require("./controllers/userController"));
app.use("/api/films",    require("./controllers/filmController"));
app.use("/api/profil",   require("./controllers/profilController"));
app.use("/api/location", require("./controllers/locationController"));

/* =========================
   ERREURS
========================= */
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route non trouvée" });
});

app.use((err, req, res, next) => {
  console.error("Erreur serveur :", err.message);
  res.status(500).json({ success: false, message: "Erreur serveur interne" });
});

/* =========================
   SERVEUR
========================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur le port ${PORT}`);
});
