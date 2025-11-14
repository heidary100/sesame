import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentsModule } from '../src/appointments/appointments.module';
import { Appointment } from '../src/appointments/entities/appointment.entity';
import { AppointmentHistory } from '../src/appointments/entities/appointment-history.entity';
import { DataSource } from 'typeorm';

describe('AppointmentsController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432'),
          username: process.env.DB_USERNAME || 'postgres',
          password: process.env.DB_PASSWORD || 'postgres',
          database: 'sesame_test',
          entities: [Appointment, AppointmentHistory],
          synchronize: false,
          migrationsRun: false,
        } as any),
        AppointmentsModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    dataSource = moduleRef.get<DataSource>(DataSource);

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    // Clean up database before tests
    await dataSource.query('TRUNCATE TABLE appointments_history CASCADE');
    await dataSource.query('TRUNCATE TABLE appointments CASCADE');
  });

  afterAll(async () => {
    await dataSource.query('TRUNCATE TABLE appointments_history CASCADE');
    await dataSource.query('TRUNCATE TABLE appointments CASCADE');
    await dataSource.destroy();
    await app.close();
  });

  afterEach(async () => {
    // Clean up database after each test to prevent state leakage
    await dataSource.query('TRUNCATE TABLE appointments_history CASCADE');
    await dataSource.query('TRUNCATE TABLE appointments CASCADE');
  });

  describe('POST /appointments', () => {
    describe('creating new appointments', () => {
      it('should create a new appointment successfully', async () => {
        const response = await request(app.getHttpServer())
          .post('/appointments')
          .send({
            id: 1,
            start: '2020-10-10 20:20',
            end: '2020-10-10 20:30',
            createdAt: '2020-09-02 14:23:12',
            updatedAt: '2020-09-28 14:23:12',
          })
          .expect(201);

        expect(response.body).toHaveProperty('id', 1);
        expect(response.body).toHaveProperty('version', 1);
        expect(response.body.start).toBeDefined();
        expect(response.body.end).toBeDefined();
      });

      it('should create multiple non-overlapping appointments', async () => {
        // Create first appointment
        await request(app.getHttpServer())
          .post('/appointments')
          .send({
            id: 10,
            start: '2020-10-11 10:00',
            end: '2020-10-11 11:30',
            createdAt: '2020-09-01 11:23:12',
            updatedAt: '2020-09-28 14:23:12',
          })
          .expect(201);

        // Create second appointment (non-overlapping)
        const response = await request(app.getHttpServer())
          .post('/appointments')
          .send({
            id: 11,
            start: '2020-10-12 12:00',
            end: '2020-10-12 13:30',
            createdAt: '2020-08-02 13:23:12',
            updatedAt: '2020-09-28 14:23:12',
          })
          .expect(201);

        expect(response.body.id).toBe(11);
      });

      it('should reject appointment with end before start', async () => {
        await request(app.getHttpServer())
          .post('/appointments')
          .send({
            id: 20,
            start: '2020-10-12 12:27',
            end: '2020-10-10 12:27',
            createdAt: '2020-09-11 10:23:12',
            updatedAt: '2020-09-28 14:23:12',
          })
          .expect(400);
      });

      it('should reject appointment with missing required fields', async () => {
        await request(app.getHttpServer())
          .post('/appointments')
          .send({
            id: 21,
            start: '2020-10-10 20:20',
            // missing end
            createdAt: '2020-09-02 14:23:12',
            updatedAt: '2020-09-28 14:23:12',
          })
          .expect(400);
      });

      it('should reject appointment with invalid date format', async () => {
        await request(app.getHttpServer())
          .post('/appointments')
          .send({
            id: 22,
            start: '2020/10/10 20:20',
            end: '2020-10-10 20:30',
            createdAt: '2020-09-02 14:23:12',
            updatedAt: '2020-09-28 14:23:12',
          })
          .expect(400);
      });

      it('should reject appointment with non-positive id', async () => {
        await request(app.getHttpServer())
          .post('/appointments')
          .send({
            id: 0,
            start: '2020-10-10 20:20',
            end: '2020-10-10 20:30',
            createdAt: '2020-09-02 14:23:12',
            updatedAt: '2020-09-28 14:23:12',
          })
          .expect(400);
      });
    });

    describe('conflict detection', () => {
      beforeEach(async () => {
        // Clean up for each test
        await dataSource.query('TRUNCATE TABLE appointments_history CASCADE');
        await dataSource.query('TRUNCATE TABLE appointments CASCADE');

        // Create base appointment for conflict tests
        await request(app.getHttpServer())
          .post('/appointments')
          .send({
            id: 100,
            start: '2020-10-10 20:20',
            end: '2020-10-10 20:30',
            createdAt: '2020-09-02 14:23:12',
            updatedAt: '2020-09-28 14:23:12',
          })
          .expect(201);
      });

      it('should reject appointment overlapping with existing', async () => {
        const response = await request(app.getHttpServer())
          .post('/appointments')
          .send({
            id: 101,
            start: '2020-10-10 20:25',
            end: '2020-10-10 20:35',
            createdAt: '2020-09-01 13:23:12',
            updatedAt: '2020-09-28 14:23:12',
          })
          .expect(409);

        expect(response.body.message).toContain('not available');
      });

      it('should allow appointment starting when previous ends', async () => {
        await request(app.getHttpServer())
          .post('/appointments')
          .send({
            id: 102,
            start: '2020-10-10 20:30',
            end: '2020-10-10 20:40',
            createdAt: '2020-09-02 14:23:12',
            updatedAt: '2020-09-28 14:23:12',
          })
          .expect(201);
      });

      it('should reject appointment fully contained in existing', async () => {
        await request(app.getHttpServer())
          .post('/appointments')
          .send({
            id: 103,
            start: '2020-10-10 20:22',
            end: '2020-10-10 20:28',
            createdAt: '2020-09-02 14:23:12',
            updatedAt: '2020-09-28 14:23:12',
          })
          .expect(409);
      });

      it('should reject appointment that fully contains existing', async () => {
        await request(app.getHttpServer())
          .post('/appointments')
          .send({
            id: 104,
            start: '2020-10-10 20:10',
            end: '2020-10-10 20:40',
            createdAt: '2020-09-02 14:23:12',
            updatedAt: '2020-09-28 14:23:12',
          })
          .expect(409);
      });
    });

    describe('updating appointments', () => {
      beforeEach(async () => {
        await dataSource.query('TRUNCATE TABLE appointments_history CASCADE');
        await dataSource.query('TRUNCATE TABLE appointments CASCADE');

        // Create initial appointment
        await request(app.getHttpServer())
          .post('/appointments')
          .send({
            id: 200,
            start: '2020-10-10 20:20',
            end: '2020-10-10 20:30',
            createdAt: '2020-09-02 14:23:12',
            updatedAt: '2020-09-28 14:23:12',
          })
          .expect(201);
      });

      it('should update appointment with new time range', async () => {
        const response = await request(app.getHttpServer())
          .post('/appointments')
          .send({
            id: 200,
            start: '2020-10-17 14:40',
            end: '2020-10-17 15:30',
            createdAt: '2020-03-02 19:23:12',
            updatedAt: '2020-09-28 14:24:12',
          })
          .expect(201);

        expect(response.body.id).toBe(200);
        expect(response.body.version).toBe(2);
      });

      it('should save historical record on update', async () => {
        // Update the appointment
        await request(app.getHttpServer())
          .post('/appointments')
          .send({
            id: 200,
            start: '2020-10-17 14:40',
            end: '2020-10-17 15:30',
            createdAt: '2020-03-02 19:23:12',
            updatedAt: '2020-09-28 14:24:12',
          })
          .expect(201);

        // Query history
        const history = await dataSource.query(
          'SELECT * FROM appointments_history WHERE "appointmentId" = $1',
          [200],
        );

        expect(history.length).toBeGreaterThan(0);
        expect(history[0].version).toBe(1);
      });

      it('should reject update that creates conflict', async () => {
        // Create another appointment
        await request(app.getHttpServer())
          .post('/appointments')
          .send({
            id: 201,
            start: '2020-10-17 14:40',
            end: '2020-10-17 15:30',
            createdAt: '2020-03-02 19:23:12',
            updatedAt: '2020-09-28 14:24:12',
          })
          .expect(201);

        // Try to update first appointment to overlap with second
        await request(app.getHttpServer())
          .post('/appointments')
          .send({
            id: 200,
            start: '2020-10-17 14:50',
            end: '2020-10-17 15:20',
            createdAt: '2020-03-02 19:23:12',
            updatedAt: '2020-09-28 14:25:12',
          })
          .expect(409);
      });

      it('should increment version on each update', async () => {
        // First update
        let response = await request(app.getHttpServer())
          .post('/appointments')
          .send({
            id: 200,
            start: '2020-10-17 14:40',
            end: '2020-10-17 15:30',
            createdAt: '2020-03-02 19:23:12',
            updatedAt: '2020-09-28 14:24:12',
          })
          .expect(201);

        expect(response.body.version).toBe(2);

        // Second update
        response = await request(app.getHttpServer())
          .post('/appointments')
          .send({
            id: 200,
            start: '2020-10-18 14:40',
            end: '2020-10-18 15:30',
            createdAt: '2020-03-02 19:23:12',
            updatedAt: '2020-09-28 14:25:12',
          })
          .expect(201);

        expect(response.body.version).toBe(3);
      });
    });
  });

  describe('GET /appointments', () => {
    beforeEach(async () => {
      await dataSource.query('TRUNCATE TABLE appointments_history CASCADE');
      await dataSource.query('TRUNCATE TABLE appointments CASCADE');
    });

    it('should return empty array when no appointments exist', async () => {
      const response = await request(app.getHttpServer())
        .get('/appointments')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return all appointments ordered by start time', async () => {
      // Create appointments in non-chronological order
      await request(app.getHttpServer())
        .post('/appointments')
        .send({
          id: 300,
          start: '2020-10-12 12:00',
          end: '2020-10-12 13:30',
          createdAt: '2020-08-02 13:23:12',
          updatedAt: '2020-09-28 14:23:12',
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/appointments')
        .send({
          id: 301,
          start: '2020-10-10 20:20',
          end: '2020-10-10 20:30',
          createdAt: '2020-09-02 14:23:12',
          updatedAt: '2020-09-28 14:23:12',
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/appointments')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0].id).toBe(301); // Earlier start time
      expect(response.body[1].id).toBe(300); // Later start time
    });

    it('should return appointments with all required fields', async () => {
      await request(app.getHttpServer())
        .post('/appointments')
        .send({
          id: 302,
          start: '2020-10-10 20:20',
          end: '2020-10-10 20:30',
          createdAt: '2020-09-02 14:23:12',
          updatedAt: '2020-09-28 14:23:12',
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/appointments')
        .expect(200);

      expect(response.body).toHaveLength(1);
      const appointment = response.body[0];
      expect(appointment).toHaveProperty('id');
      expect(appointment).toHaveProperty('start');
      expect(appointment).toHaveProperty('end');
      expect(appointment).toHaveProperty('createdAt');
      expect(appointment).toHaveProperty('updatedAt');
      expect(appointment).toHaveProperty('version');
    });

    describe('pagination', () => {
      beforeEach(async () => {
        await dataSource.query('TRUNCATE TABLE appointments_history CASCADE');
        await dataSource.query('TRUNCATE TABLE appointments CASCADE');

        // Create 10 appointments
        for (let i = 0; i < 10; i++) {
          await request(app.getHttpServer())
            .post('/appointments')
            .send({
              id: 5000 + i,
              start: `2020-10-${10 + i} 10:00`,
              end: `2020-10-${10 + i} 11:00`,
              createdAt: '2020-09-02 14:23:12',
              updatedAt: '2020-09-28 14:23:12',
            })
            .expect(201);
        }
      });

      it('should apply default limit (100) when no parameters provided', async () => {
        const response = await request(app.getHttpServer())
          .get('/appointments')
          .expect(200);

        expect(response.body.length).toBe(10);
      });

      it('should respect custom limit parameter', async () => {
        const response = await request(app.getHttpServer())
          .get('/appointments?limit=5')
          .expect(200);

        expect(response.body).toHaveLength(5);
      });

      it('should respect offset parameter', async () => {
        const allResponse = await request(app.getHttpServer())
          .get('/appointments')
          .expect(200);

        const offsetResponse = await request(app.getHttpServer())
          .get('/appointments?limit=3&offset=3')
          .expect(200);

        expect(offsetResponse.body).toHaveLength(3);
        expect(offsetResponse.body[0].id).toBe(allResponse.body[3].id);
      });

      it('should cap limit at maximum (1000)', async () => {
        const response = await request(app.getHttpServer())
          .get('/appointments?limit=5000')
          .expect(200);

        expect(response.body.length).toBe(10);
      });

      it('should handle invalid limit gracefully', async () => {
        const response = await request(app.getHttpServer())
          .get('/appointments?limit=invalid')
          .expect(200);

        expect(response.body).toHaveLength(10);
      });

      it('should handle zero limit gracefully', async () => {
        const response = await request(app.getHttpServer())
          .get('/appointments?limit=0')
          .expect(200);

        expect(response.body).toHaveLength(10);
      });

      it('should handle negative offset gracefully', async () => {
        const response = await request(app.getHttpServer())
          .get('/appointments?offset=-5')
          .expect(200);

        expect(response.body).toHaveLength(10);
      });

      it('should handle offset beyond total appointments', async () => {
        const response = await request(app.getHttpServer())
          .get('/appointments?limit=10&offset=20')
          .expect(200);

        expect(response.body).toHaveLength(0);
      });

      it('should return correct subset with both limit and offset', async () => {
        const response = await request(app.getHttpServer())
          .get('/appointments?limit=2&offset=4')
          .expect(200);

        expect(response.body).toHaveLength(2);
      });
    });
  });

  describe('concurrent requests', () => {
    beforeEach(async () => {
      await dataSource.query('TRUNCATE TABLE appointments_history CASCADE');
      await dataSource.query('TRUNCATE TABLE appointments CASCADE');
    });

    it('should handle concurrent requests safely', async () => {
      // Create base appointment
      await request(app.getHttpServer())
        .post('/appointments')
        .send({
          id: 400,
          start: '2020-10-10 20:20',
          end: '2020-10-10 20:30',
          createdAt: '2020-09-02 14:23:12',
          updatedAt: '2020-09-28 14:23:12',
        })
        .expect(201);

      // Send concurrent requests that would conflict
      const promises = [
        request(app.getHttpServer()).post('/appointments').send({
          id: 401,
          start: '2020-10-10 20:25',
          end: '2020-10-10 20:35',
          createdAt: '2020-09-02 14:23:12',
          updatedAt: '2020-09-28 14:23:12',
        }),
        request(app.getHttpServer()).post('/appointments').send({
          id: 402,
          start: '2020-10-10 20:28',
          end: '2020-10-10 20:40',
          createdAt: '2020-09-02 14:23:12',
          updatedAt: '2020-09-28 14:23:12',
        }),
      ];

      const results = await Promise.all(promises);

      // Both requests should fail with 409 due to conflict
      const statusCodes = results.map((r) => r.status);
      expect(statusCodes.every((s) => s === 409)).toBe(true);

      // Only the base appointment should exist
      const appointments = await dataSource.query(
        'SELECT COUNT(*) as count FROM appointments',
      );
      expect(parseInt(appointments[0].count)).toBe(1);
    });

    it('should handle multiple concurrent non-conflicting requests', async () => {
      // Send 5 concurrent requests with different time ranges (no conflicts)
      const promises = [
        request(app.getHttpServer()).post('/appointments').send({
          id: 500,
          start: '2020-10-10 08:00',
          end: '2020-10-10 09:00',
          createdAt: '2020-09-02 14:23:12',
          updatedAt: '2020-09-28 14:23:12',
        }),
        request(app.getHttpServer()).post('/appointments').send({
          id: 501,
          start: '2020-10-10 10:00',
          end: '2020-10-10 11:00',
          createdAt: '2020-09-02 14:23:12',
          updatedAt: '2020-09-28 14:23:12',
        }),
        request(app.getHttpServer()).post('/appointments').send({
          id: 502,
          start: '2020-10-10 12:00',
          end: '2020-10-10 13:00',
          createdAt: '2020-09-02 14:23:12',
          updatedAt: '2020-09-28 14:23:12',
        }),
        request(app.getHttpServer()).post('/appointments').send({
          id: 503,
          start: '2020-10-10 14:00',
          end: '2020-10-10 15:00',
          createdAt: '2020-09-02 14:23:12',
          updatedAt: '2020-09-28 14:23:12',
        }),
        request(app.getHttpServer()).post('/appointments').send({
          id: 504,
          start: '2020-10-10 16:00',
          end: '2020-10-10 17:00',
          createdAt: '2020-09-02 14:23:12',
          updatedAt: '2020-09-28 14:23:12',
        }),
      ];

      const results = await Promise.all(promises);

      // All requests should succeed with 201
      const statusCodes = results.map((r) => r.status);
      expect(statusCodes.every((s) => s === 201)).toBe(true);

      // All 5 appointments should be created
      const appointments = await dataSource.query(
        'SELECT COUNT(*) as count FROM appointments',
      );
      expect(parseInt(appointments[0].count)).toBe(5);
    });

    it('should handle concurrent updates to same appointment', async () => {
      // Create base appointment
      await request(app.getHttpServer())
        .post('/appointments')
        .send({
          id: 600,
          start: '2020-10-10 20:20',
          end: '2020-10-10 20:30',
          createdAt: '2020-09-02 14:23:12',
          updatedAt: '2020-09-28 14:23:12',
        })
        .expect(201);

      // Send 3 concurrent update requests to the same appointment
      const promises = [
        request(app.getHttpServer()).post('/appointments').send({
          id: 600,
          start: '2020-10-11 10:00',
          end: '2020-10-11 11:00',
          createdAt: '2020-09-02 14:23:12',
          updatedAt: '2020-09-28 14:23:13',
        }),
        request(app.getHttpServer()).post('/appointments').send({
          id: 600,
          start: '2020-10-12 10:00',
          end: '2020-10-12 11:00',
          createdAt: '2020-09-02 14:23:12',
          updatedAt: '2020-09-28 14:23:14',
        }),
        request(app.getHttpServer()).post('/appointments').send({
          id: 600,
          start: '2020-10-13 10:00',
          end: '2020-10-13 11:00',
          createdAt: '2020-09-02 14:23:12',
          updatedAt: '2020-09-28 14:23:15',
        }),
      ];

      const results = await Promise.all(promises);

      // All should succeed (updates are allowed)
      const successCount = results.filter((r) => r.status === 201).length;
      expect(successCount).toBe(3);

      // Should have only 1 appointment (same ID)
      const appointments = await dataSource.query(
        'SELECT COUNT(*) as count FROM appointments',
      );
      expect(parseInt(appointments[0].count)).toBe(1);

      // Should have 3 history records (original + 2 updates)
      const history = await dataSource.query(
        'SELECT COUNT(*) as count FROM appointments_history WHERE "appointmentId" = $1',
        [600],
      );
      expect(parseInt(history[0].count)).toBe(3);
    });

    it('should handle mix of creates and updates concurrently', async () => {
      // Create initial appointment
      await request(app.getHttpServer())
        .post('/appointments')
        .send({
          id: 700,
          start: '2020-10-10 20:20',
          end: '2020-10-10 20:30',
          createdAt: '2020-09-02 14:23:12',
          updatedAt: '2020-09-28 14:23:12',
        })
        .expect(201);

      // Send concurrent requests: 2 updates to existing, 2 new creates
      const promises = [
        // Update existing
        request(app.getHttpServer()).post('/appointments').send({
          id: 700,
          start: '2020-10-11 10:00',
          end: '2020-10-11 11:00',
          createdAt: '2020-09-02 14:23:12',
          updatedAt: '2020-09-28 14:24:12',
        }),
        // Update existing
        request(app.getHttpServer()).post('/appointments').send({
          id: 700,
          start: '2020-10-12 10:00',
          end: '2020-10-12 11:00',
          createdAt: '2020-09-02 14:23:12',
          updatedAt: '2020-09-28 14:25:12',
        }),
        // Create new
        request(app.getHttpServer()).post('/appointments').send({
          id: 701,
          start: '2020-10-20 10:00',
          end: '2020-10-20 11:00',
          createdAt: '2020-09-02 14:23:12',
          updatedAt: '2020-09-28 14:23:12',
        }),
        // Create new (different time)
        request(app.getHttpServer()).post('/appointments').send({
          id: 702,
          start: '2020-10-21 10:00',
          end: '2020-10-21 11:00',
          createdAt: '2020-09-02 14:23:12',
          updatedAt: '2020-09-28 14:23:12',
        }),
      ];

      const results = await Promise.all(promises);

      // All should succeed
      expect(results.every((r) => r.status === 201)).toBe(true);

      // Should have 3 appointments total
      const appointments = await dataSource.query(
        'SELECT COUNT(*) as count FROM appointments',
      );
      expect(parseInt(appointments[0].count)).toBe(3);
    });

    it('should prevent race condition during overlap check', async () => {
      // Create base appointment
      await request(app.getHttpServer())
        .post('/appointments')
        .send({
          id: 800,
          start: '2020-10-10 20:00',
          end: '2020-10-10 21:00',
          createdAt: '2020-09-02 14:23:12',
          updatedAt: '2020-09-28 14:23:12',
        })
        .expect(201);

      // Send multiple concurrent requests that all overlap with the same appointment
      // This tests that pessimistic locking prevents race conditions
      const promises: Promise<any>[] = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          request(app.getHttpServer()).post('/appointments').send({
            id: 801 + i,
            start: '2020-10-10 20:30',
            end: '2020-10-10 20:50',
            createdAt: '2020-09-02 14:23:12',
            updatedAt: '2020-09-28 14:23:12',
          }),
        );
      }

      const results = await Promise.all(promises);

      // All should fail with 409 (conflict) - exactly one would succeed if race condition existed
      const statusCodes = results.map((r: any) => r.status);
      expect(statusCodes.every((s) => s === 409)).toBe(true);

      // Only the original appointment should exist
      const appointments = await dataSource.query(
        'SELECT COUNT(*) as count FROM appointments',
      );
      expect(parseInt(appointments[0].count)).toBe(1);
    });

    it('should handle rapid sequential requests from job requirements script', async () => {
      // This simulates the test data from the job requirements
      const testData = [
        {
          id: '1',
          start: '2020-10-10 20:20',
          end: '2020-10-10 20:30',
          createdAt: '2020-09-02 14:23:12',
          updatedAt: '2020-09-28 14:23:12',
        },
        {
          id: '2',
          start: '2020-10-09 20:20',
          end: '2020-10-09 20:30',
          createdAt: '2018-10-02 16:23:12',
          updatedAt: '2020-09-28 14:23:12',
        },
        {
          id: '3',
          start: '2020-10-10 20:25',
          end: '2020-10-10 20:35',
          createdAt: '2020-09-01 13:23:12',
          updatedAt: '2020-09-28 14:23:12',
        },
        {
          id: '4',
          start: '2020-10-11 10:00',
          end: '2020-10-11 11:30',
          createdAt: '2020-09-28 14:23:12',
          updatedAt: '2020-10-01 11:23:12',
        },
        {
          id: '6',
          start: '2020-10-12 12:00',
          end: '2020-10-12 13:30',
          createdAt: '2020-08-02 13:23:12',
          updatedAt: '2020-09-28 14:23:12',
        },
        {
          id: '1',
          start: '2020-10-17 14:40',
          end: '2020-10-17 15:30',
          createdAt: '2020-03-02 19:23:12',
          updatedAt: '2020-09-28 14:24:12',
        },
      ];

      const results: any[] = [];
      for (const data of testData) {
        const res = await request(app.getHttpServer())
          .post('/appointments')
          .send(data);
        results.push(res);
      }

      // Requests 1-4, 6 should succeed; request 3 should fail (overlaps with 1)
      // Request 1 (update) should succeed
      expect(results[0].status).toBe(201); // id:1 create
      expect(results[1].status).toBe(201); // id:2 create
      expect(results[2].status).toBe(409); // id:3 conflicts with id:1
      expect(results[3].status).toBe(201); // id:4 create
      expect(results[4].status).toBe(201); // id:6 create
      expect(results[5].status).toBe(201); // id:1 update

      // Final state: should have appointments 1, 2, 4, 6 (id:3 rejected due to conflict)
      const appointments = await dataSource.query(
        'SELECT id FROM appointments ORDER BY id',
      );
      expect(appointments.length).toBeGreaterThanOrEqual(4);
    });
  });
});

