import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import config from './config/typeorm.config';

@Module({
  imports: [
    TypeOrmModule.forRoot(config),
  ],
})
export class AppModule {}
