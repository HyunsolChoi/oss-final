import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
dotenv.config();

export async function getConnection() {
    return mysql.createConnection({
        host: process.env.DB_HOST,
        port: +process.env.DB_PORT!,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
    });
}
