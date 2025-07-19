const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/timeData.json');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS user_time (
      user_id TEXT PRIMARY KEY,
      total_ms INTEGER DEFAULT 0
    )
  `);
});

function addTime(userId, ms) {
  if (!ms || ms <= 0) return;

  db.run(`
    INSERT INTO user_time (user_id, total_ms)
    VALUES (?, ?)
    ON CONFLICT(user_id) DO UPDATE SET total_ms = total_ms + ?
  `, [userId, ms, ms], (err) => {
    if (err) console.error('DB Error:', err.message);
  });
}

function getTotalTime(userId, callback) {
  db.get(`SELECT total_ms FROM user_time WHERE user_id = ?`, [userId], (err, row) => {
    if (err) {
      console.error('DB Error:', err.message);
      return callback(0);
    }
    callback(row?.total_ms || 0);
  });
}

function getLeaderboard(limit, callback) {
  db.all(`
    SELECT user_id, total_ms
    FROM user_time
    ORDER BY total_ms DESC
    LIMIT ?
  `, [limit], (err, rows) => {
    if (err) {
      console.error('DB Error:', err.message);
      return callback([]);
    }
    callback(rows);
  });
}

module.exports = { addTime, getTotalTime, getLeaderboard };