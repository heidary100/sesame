import { DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { Appointment } from 'src/appointments/entities/appointment.entity';
import { AppointmentHistory } from 'src/appointments/entities/appointment-history.entity';
dotenv.config();

const config: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || 'postgres',
  database: process.env.DB_NAME || 'appointments',
  entities: [Appointment, AppointmentHistory],
  synchronize: false,
  logging: false,
};

export default config;
