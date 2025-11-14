import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import config from './config/typeorm.config';
import { AppointmentsModule } from './appointments/appointments.module';
import { AppDataSource } from './config/data-source';

@Module({
  imports: [TypeOrmModule.forRoot(config), AppointmentsModule],
})
export class AppModule implements OnModuleInit {
  private readonly logger = new Logger(AppModule.name);

  async onModuleInit() {
    await AppDataSource.initialize();
    await AppDataSource.runMigrations();
    this.logger.log('Database migrations completed successfully');
  }
}