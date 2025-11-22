import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'docsend.db');
const db = new Database(dbPath);

// Initialize Database Schema
const initDb = () => {
  // Files table
  db.exec(`
    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      path TEXT NOT NULL,
      mimeType TEXT NOT NULL,
      size INTEGER NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      views INTEGER DEFAULT 0
    )
  `);

  // Access Logs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS access_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fileId TEXT NOT NULL,
      viewerName TEXT NOT NULL,
      viewerEmail TEXT NOT NULL,
      accessedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      userAgent TEXT,
      ipAddress TEXT,
      country TEXT,
      FOREIGN KEY (fileId) REFERENCES files(id)
    )
  `);

  // Page Views table
  db.exec(`
    CREATE TABLE IF NOT EXISTS page_views (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fileId TEXT NOT NULL,
      viewerEmail TEXT NOT NULL,
      pageNumber INTEGER NOT NULL,
      durationSeconds REAL NOT NULL,
      viewedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (fileId) REFERENCES files(id)
    )
  `);

  try {
    db.exec('ALTER TABLE access_logs ADD COLUMN country TEXT');
  } catch (error) {
    // Column likely already exists
  }
};

initDb();

export default db;
