import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import config from './config/typeorm.config';
import { AppointmentsModule } from './appointments/appointments.module';

@Module({
  imports: [TypeOrmModule.forRoot(config), AppointmentsModule],
})
export class AppModule {}
