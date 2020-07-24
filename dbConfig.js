require("dotenv").config();

const { Pool } = require("pg");

const LOCAL_DB_PASSWORD = process.env.LOCAL_DB_PASSWORD;

const isProduction = process.env.NODE_ENV === "production";

const connectionString = `postgres://postgres:${LOCAL_DB_PASSWORD}@localhost/nodelogin`;

const pool = new Pool({
  connectionString: isProduction? process.env.DATABASE_URL : connectionString
});

module.exports = { pool };
