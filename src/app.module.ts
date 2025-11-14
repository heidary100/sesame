import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import config from './config/typeorm.config';
import { AppointmentsModule } from './appointments/appointments.module';
import { AppDataSource } from './config/data-source';

@Module({
  imports: [TypeOrmModule.forRoot(config), AppointmentsModule],
})
export class AppModule implements OnModuleInit {
  async onModuleInit() {
    await AppDataSource.initialize();
    await AppDataSource.runMigrations();
    console.log('Migrations run successfully');
  }
}