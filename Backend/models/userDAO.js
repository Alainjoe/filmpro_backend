// Backend/models/userDAO.js
const db = require('../config/db');
const bcrypt = require('bcrypt');

class UserDAO {

  // ===============================
  // INSCRIPTION
  // ===============================
  static async SetInscription({ name, email, password }, callback) {
    try {
      // Validation mot de passe
      if (!password || password.length < 6) {
        return callback({ message: "Le mot de passe doit contenir au moins 6 caractères." });
      }

      // Vérifier email existant
      const check = await db.query(
        `SELECT id FROM users WHERE email = $1`,
        [email]
      );

      if (check.rows.length > 0) {
        return callback({ message: "Email existe déjà" });
      }

      // Hash + insertion
      const hash = await bcrypt.hash(password, 10);

      const result = await db.query(
        `INSERT INTO users(name, email, password, date_inscription)
         VALUES ($1, $2, $3, NOW())
         RETURNING id`,
        [name, email, hash]
      );

      return callback(null, { id: result.rows[0].id });

    } catch (err) {
      console.error(" Erreur inscription:", err);
      return callback({ message: "Erreur serveur." });
    }
  }

  // ===============================
  // CONNEXION
  // ===============================
  static async SetLogin({ email, password }, callback) {
    try {
      const result = await db.query(
        `SELECT * FROM users WHERE email = $1`,
        [email]
      );

      if (result.rows.length === 0) return callback(null, null);

      const user = result.rows[0];
      const match = await bcrypt.compare(password, user.password);

      if (!match) return callback(null, null);

      return callback(null, user);

    } catch (err) {
      console.error(" Erreur login:", err);
      return callback(err);
    }
  }
}

module.exports = UserDAO;