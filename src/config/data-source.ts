import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

config();  // Load .env

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || 'postgres',
    database: process.env.DB_NAME || 'appointments',
    entities: [join(__dirname, '..', 'appointments/entities/*.entity.{ts,js}')],
    migrations: [join(__dirname, '..', 'migrations/*.{ts,js}')],
    logging: true,
});