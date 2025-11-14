import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentsModule } from '../src/appointments/appointments.module';
import { AppointmentsService } from '../src/appointments/appointments.service';

describe('AppointmentsController (e2e)', () => {
  let app: INestApplication;

  const mockService = {
    createOrUpdate: jest.fn().mockResolvedValue({
      id: 1,
      start: '2025-10-10T20:20:00Z',
      end: '2025-10-10T20:30:00Z',
    }),
    findAll: jest.fn().mockResolvedValue([{ id: 1 }]),
  };

  const MockTypeOrmModule = TypeOrmModule.forRootAsync({
    useFactory: () => ({
      type: 'sqlite',
      database: ':memory:',
      synchronize: false,
      entities: [],
    }),
  });

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [MockTypeOrmModule, AppointmentsModule],
    })
      .overrideProvider(AppointmentsService)
      .useValue(mockService)
      .compile();

    app = moduleRef.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/POST appointments should create correctly', async () => {
    return request(app.getHttpServer())
      .post('/appointments')
      .send({
        id: 1,
        start: '2020-10-10T20:20:00Z',
        end: '2020-10-10T20:30:00Z',
        createdAt: '2020-09-02T14:23:12Z',
        updatedAt: '2020-09-28T14:23:12Z',
      })
      .expect(201)
      .expect({
        id: 1,
        start: '2025-10-10T20:20:00Z',
        end: '2025-10-10T20:30:00Z',
      });
  });

  it('/GET appointments should return all appointments', async () => {
    return request(app.getHttpServer())
      .get('/appointments')
      .expect(200)
      .expect([{ id: 1 }]);
  });

  it('/POST should validate bad input', async () => {
    return request(app.getHttpServer())
      .post('/appointments')
      .send({
        id: 'wrong',
        start: '2025-10-10T20:20:00Z',
        end: '2025-10-10T20:30:00Z',
      })
      .expect(400);
  });
});
