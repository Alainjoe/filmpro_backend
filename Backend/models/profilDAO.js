// Backend/models/profilDAO.js
const db = require('../config/db'); // Pool pg
const bcrypt = require('bcrypt');

class ProfilDAO {

  // ===============================
  // Profil utilisateur
  // ===============================
  static getUserProfile(userId, callback) {
    const sql = `
      SELECT id, name, email, date_inscription
      FROM users
      WHERE id = $1
    `;

    db.query(sql, [userId])
      .then(result => callback(null, result.rows[0] || null))
      .catch(err => callback(err));
  }

  // ===============================
  // Films loués
  // ===============================
  static getUserRentals(userId, callback) {
    const sql = `
      SELECT
        r.id AS rental_id,
        r.film_id,
        f.title AS film_title,
        r.rental_date,
        r.return_date,
        CASE
          WHEN r.return_date IS NULL THEN 'En cours'
          ELSE 'Retourné'
        END AS statut
      FROM rentals r
      JOIN films f ON r.film_id = f.id
      WHERE r.user_id = $1
      ORDER BY r.rental_date DESC
    `;

    db.query(sql, [userId])
      .then(result => callback(null, result.rows))
      .catch(err => callback(err));
  }

  // ===============================
  // Modifier mot de passe
  // ===============================
  static async updatePasswordWithVerification(userId, current, newPass, callback) {
  try {
    const result = await db.query(
      `SELECT password FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return callback({ message: "Utilisateur introuvable" });
    }

    const match = await bcrypt.compare(current, result.rows[0].password);
    if (!match) {
      return callback({ message: "Mot de passe incorrect" });
    }

    const hash = await bcrypt.hash(newPass, 10);

    await db.query(
      `UPDATE users SET password = $1 WHERE id = $2`,
      [hash, userId]
    );

    return callback(null, { message: "Mot de passe changé" });

  } catch (err) {
    console.error("updatePasswordWithVerification:", err);
    return callback({ message: "Erreur serveur" });
  }
}
  // ===============================
  // Modifier profil (nom + email)
  // ===============================
  static updateProfile(userId, { name, email }, callback) {
    const sqlCheck = `SELECT id FROM users WHERE email = $1 AND id <> $2`;

    db.query(sqlCheck, [email, userId])
      .then(result => {
        if (result.rows.length > 0) {
          return callback({ message: "Email déjà utilisé" });
        }

        return db.query(
          `UPDATE users SET name = $1, email = $2 WHERE id = $3`,
          [name, email, userId]
        );
      })
      .then(() => callback(null, { message: "Profil mis à jour" }))
      .catch(err => {
        console.error("updateProfile:", err);
        callback({ message: "Erreur serveur" });
      });
  }

  // ===============================
  // Supprimer compte (version CASCADE)
  // ===============================
  static deleteAccount(userId, callback) {
    const sql = `DELETE FROM users WHERE id = $1`;

    db.query(sql, [userId])
      .then(result => {
        if (result.rowCount === 0) {
          return callback({ message: "Utilisateur introuvable" });
        }

        // Rentals supprimés automatiquement grâce à ON DELETE CASCADE
        return callback(null, { message: "Compte supprimé" });
      })
      .catch(err => {
        console.error("❌ deleteAccount:", err);
        return callback({ message: "Erreur serveur" });
      });
  }
}

module.exports = ProfilDAO;