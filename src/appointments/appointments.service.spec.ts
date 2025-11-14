import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ConflictException } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { Appointment } from './entities/appointment.entity';
import { AppointmentHistory } from './entities/appointment-history.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  let repository: Repository<Appointment>;
  let dataSource: DataSource;

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      find: jest.fn(),
      save: jest.fn(),
    },
  };

  const mockRepository = {
    find: jest.fn(),
  };

  const mockDataSource = {
    createQueryRunner: jest.fn(() => mockQueryRunner),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        {
          provide: getRepositoryToken(Appointment),
          useValue: mockRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
    repository = module.get<Repository<Appointment>>(
      getRepositoryToken(Appointment),
    );
    dataSource = module.get<DataSource>(DataSource);
  });

  describe('upsertAppointment', () => {
    describe('creating new appointment', () => {
      it('should successfully create a new appointment with no overlaps', async () => {
        const dto: CreateAppointmentDto = {
          id: 1,
          start: '2020-10-10 20:20',
          end: '2020-10-10 20:30',
          createdAt: '2020-09-02 14:23:12',
          updatedAt: '2020-09-28 14:23:12',
        };

        const savedEntity = {
          id: 1,
          start: new Date('2020-10-10 20:20'),
          end: new Date('2020-10-10 20:30'),
          createdAt: new Date('2020-09-02 14:23:12'),
          updatedAt: new Date('2020-09-28 14:23:12'),
          version: 1,
        };

        mockQueryRunner.manager.find.mockResolvedValue([]);
        mockQueryRunner.manager.save.mockResolvedValue(savedEntity);

        const result = await service.upsertAppointment(dto);

        expect(mockQueryRunner.connect).toHaveBeenCalled();
        expect(mockQueryRunner.startTransaction).toHaveBeenCalledWith(
          'REPEATABLE READ',
        );
        expect(mockQueryRunner.manager.find).toHaveBeenCalledWith(Appointment, {
          lock: { mode: 'pessimistic_write' },
        });
        expect(mockQueryRunner.manager.save).toHaveBeenCalled();
        expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
        expect(mockQueryRunner.release).toHaveBeenCalled();
        expect(result).toEqual(savedEntity);
      });

      it('should throw ConflictException when new appointment overlaps with existing', async () => {
        const dto: CreateAppointmentDto = {
          id: 2,
          start: '2020-10-10 20:25',
          end: '2020-10-10 20:35',
          createdAt: '2020-09-02 14:23:12',
          updatedAt: '2020-09-28 14:23:12',
        };

        const existingAppointment = {
          id: 1,
          start: new Date('2020-10-10 20:20'),
          end: new Date('2020-10-10 20:30'),
          createdAt: new Date('2020-09-02 14:23:12'),
          updatedAt: new Date('2020-09-28 14:23:12'),
          version: 1,
        };

        mockQueryRunner.manager.find.mockResolvedValue([existingAppointment]);

        await expect(service.upsertAppointment(dto)).rejects.toThrow(
          ConflictException,
        );
        expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
        expect(mockQueryRunner.release).toHaveBeenCalled();
      });

      it('should validate that end time is after start time', async () => {
        const dto: CreateAppointmentDto = {
          id: 5,
          start: '2020-10-12 12:27',
          end: '2020-10-10 12:27', // end before start
          createdAt: '2020-09-11 10:23:12',
          updatedAt: '2020-09-28 14:23:12',
        };

        // DTO validation happens at controller level before reaching service
        // Service receives already validated DTO, but we test domain validation
        await expect(service.upsertAppointment(dto)).rejects.toThrow();
      });
    });

    describe('updating existing appointment', () => {
      it('should update appointment and save historical record', async () => {
        const dto: CreateAppointmentDto = {
          id: 1,
          start: '2020-10-17 14:40',
          end: '2020-10-17 15:30',
          createdAt: '2020-03-02 19:23:12',
          updatedAt: '2020-09-28 14:24:12',
        };

        const existingAppointment = {
          id: 1,
          start: new Date('2020-10-10 20:20'),
          end: new Date('2020-10-10 20:30'),
          createdAt: new Date('2020-09-02 14:23:12'),
          updatedAt: new Date('2020-09-28 14:23:12'),
          version: 1,
        };

        const updatedEntity = {
          id: 1,
          start: new Date('2020-10-17 14:40'),
          end: new Date('2020-10-17 15:30'),
          createdAt: new Date('2020-03-02 19:23:12'),
          updatedAt: new Date('2020-09-28 14:24:12'),
          version: 2,
        };

        mockQueryRunner.manager.find.mockResolvedValue([existingAppointment]);
        mockQueryRunner.manager.save.mockResolvedValue(updatedEntity);

        const result = await service.upsertAppointment(dto);

        // Should save history first
        expect(mockQueryRunner.manager.save).toHaveBeenCalledTimes(2);
        expect(result).toEqual(updatedEntity);
        expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      });

      it('should increment version number on update', async () => {
        const dto: CreateAppointmentDto = {
          id: 1,
          start: '2020-10-17 14:40',
          end: '2020-10-17 15:30',
          createdAt: '2020-03-02 19:23:12',
          updatedAt: '2020-09-28 14:24:12',
        };

        const existingAppointment = {
          id: 1,
          start: new Date('2020-10-10 20:20'),
          end: new Date('2020-10-10 20:30'),
          createdAt: new Date('2020-09-02 14:23:12'),
          updatedAt: new Date('2020-09-28 14:23:12'),
          version: 5,
        };

        const updatedEntity = {
          id: 1,
          start: new Date('2020-10-17 14:40'),
          end: new Date('2020-10-17 15:30'),
          createdAt: new Date('2020-03-02 19:23:12'),
          updatedAt: new Date('2020-09-28 14:24:12'),
          version: 6,
        };

        mockQueryRunner.manager.find.mockResolvedValue([existingAppointment]);
        mockQueryRunner.manager.save.mockResolvedValue(updatedEntity);

        const result = await service.upsertAppointment(dto);

        expect(result.version).toBe(6);
      });

      it('should throw ConflictException when update overlaps with other appointments', async () => {
        const dto: CreateAppointmentDto = {
          id: 1,
          start: '2020-10-10 20:25',
          end: '2020-10-10 20:35',
          createdAt: '2020-03-02 19:23:12',
          updatedAt: '2020-09-28 14:24:12',
        };

        const existingAppointment = {
          id: 1,
          start: new Date('2020-10-10 20:20'),
          end: new Date('2020-10-10 20:30'),
          createdAt: new Date('2020-09-02 14:23:12'),
          updatedAt: new Date('2020-09-28 14:23:12'),
          version: 1,
        };

        const conflictingAppointment = {
          id: 3,
          start: new Date('2020-10-10 20:30'),
          end: new Date('2020-10-10 20:40'),
          createdAt: new Date('2020-10-01 13:23:12'),
          updatedAt: new Date('2020-10-02 14:23:12'),
          version: 1,
        };

        mockQueryRunner.manager.find.mockResolvedValue([
          existingAppointment,
          conflictingAppointment,
        ]);

        await expect(service.upsertAppointment(dto)).rejects.toThrow(
          ConflictException,
        );
        expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      });
    });

    describe('concurrent request handling', () => {
      it('should use REPEATABLE_READ isolation level', async () => {
        const dto: CreateAppointmentDto = {
          id: 1,
          start: '2020-10-10 20:20',
          end: '2020-10-10 20:30',
          createdAt: '2020-09-02 14:23:12',
          updatedAt: '2020-09-28 14:23:12',
        };

        mockQueryRunner.manager.find.mockResolvedValue([]);
        mockQueryRunner.manager.save.mockResolvedValue({
          id: 1,
          version: 1,
        });

        await service.upsertAppointment(dto);

        expect(mockQueryRunner.startTransaction).toHaveBeenCalledWith(
          'REPEATABLE READ',
        );
      });

      it('should acquire pessimistic write lock on all appointments', async () => {
        const dto: CreateAppointmentDto = {
          id: 1,
          start: '2020-10-10 20:20',
          end: '2020-10-10 20:30',
          createdAt: '2020-09-02 14:23:12',
          updatedAt: '2020-09-28 14:23:12',
        };

        mockQueryRunner.manager.find.mockResolvedValue([]);
        mockQueryRunner.manager.save.mockResolvedValue({
          id: 1,
          version: 1,
        });

        await service.upsertAppointment(dto);

        expect(mockQueryRunner.manager.find).toHaveBeenCalledWith(Appointment, {
          lock: { mode: 'pessimistic_write' },
        });
      });

      it('should rollback transaction on any error', async () => {
        const dto: CreateAppointmentDto = {
          id: 1,
          start: '2020-10-10 20:20',
          end: '2020-10-10 20:30',
          createdAt: '2020-09-02 14:23:12',
          updatedAt: '2020-09-28 14:23:12',
        };

        mockQueryRunner.manager.find.mockRejectedValue(
          new Error('Database error'),
        );

        await expect(service.upsertAppointment(dto)).rejects.toThrow(
          'Database error',
        );
        expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
        expect(mockQueryRunner.release).toHaveBeenCalled();
      });
    });

    describe('edge cases', () => {
      it('should handle appointment with same start time (no overlap)', async () => {
        const dto: CreateAppointmentDto = {
          id: 2,
          start: '2020-10-10 20:30',
          end: '2020-10-10 20:40',
          createdAt: '2020-09-02 14:23:12',
          updatedAt: '2020-09-28 14:23:12',
        };

        const existingAppointment = {
          id: 1,
          start: new Date('2020-10-10 20:20'),
          end: new Date('2020-10-10 20:30'),
          createdAt: new Date('2020-09-02 14:23:12'),
          updatedAt: new Date('2020-09-28 14:23:12'),
          version: 1,
        };

        const savedEntity = {
          id: 2,
          start: new Date('2020-10-10 20:30'),
          end: new Date('2020-10-10 20:40'),
          version: 1,
        };

        mockQueryRunner.manager.find.mockResolvedValue([existingAppointment]);
        mockQueryRunner.manager.save.mockResolvedValue(savedEntity);

        const result = await service.upsertAppointment(dto);

        expect(result).toEqual(savedEntity);
        expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      });

      it('should handle multiple non-overlapping appointments', async () => {
        const dto: CreateAppointmentDto = {
          id: 4,
          start: '2020-10-11 10:00',
          end: '2020-10-11 11:30',
          createdAt: '2020-10-01 11:23:12',
          updatedAt: '2020-10-02 14:23:12',
        };

        const existingAppointments = [
          {
            id: 1,
            start: new Date('2020-10-10 20:20'),
            end: new Date('2020-10-10 20:30'),
            version: 1,
          },
          {
            id: 2,
            start: new Date('2019-10-10 20:20'),
            end: new Date('2020-10-10 20:30'),
            version: 1,
          },
          {
            id: 3,
            start: new Date('2020-10-10 20:25'),
            end: new Date('2020-10-10 20:35'),
            version: 1,
          },
        ];

        const savedEntity = {
          id: 4,
          start: new Date('2020-10-11 10:00'),
          end: new Date('2020-10-11 11:30'),
          version: 1,
        };

        mockQueryRunner.manager.find.mockResolvedValue(existingAppointments);
        mockQueryRunner.manager.save.mockResolvedValue(savedEntity);

        const result = await service.upsertAppointment(dto);

        expect(result).toEqual(savedEntity);
        expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      });
    });
  });

  describe('findCurrentAppointments', () => {
    it('should return all appointments ordered by start time', async () => {
      const appointments = [
        {
          id: 1,
          start: new Date('2020-10-10 20:20'),
          end: new Date('2020-10-10 20:30'),
          version: 1,
        },
        {
          id: 2,
          start: new Date('2020-10-11 10:00'),
          end: new Date('2020-10-11 11:30'),
          version: 1,
        },
      ];

      mockRepository.find.mockResolvedValue(appointments);

      const result = await service.findCurrentAppointments();

      expect(mockRepository.find).toHaveBeenCalledWith({
        order: { start: 'ASC' },
        take: 100,
        skip: 0,
      });
      expect(result).toEqual(appointments);
    });

    it('should return all appointments ordered by start time', async () => {
      const appointments = [
        {
          id: 1,
          start: new Date('2020-10-10 20:20'),
          end: new Date('2020-10-10 20:30'),
          version: 1,
        },
        {
          id: 2,
          start: new Date('2020-10-11 10:00'),
          end: new Date('2020-10-11 11:30'),
          version: 1,
        },
      ];

      mockRepository.find.mockResolvedValue(appointments);

      const result = await service.findCurrentAppointments(50, 10);

      expect(mockRepository.find).toHaveBeenCalledWith({
        order: { start: 'ASC' },
        take: 50,
        skip: 10,
      });
      expect(result).toEqual(appointments);
    });

    it('should return empty array when no appointments exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findCurrentAppointments();

      expect(result).toEqual([]);
    });
  });

  describe('transaction error handling', () => {
    it('should rollback and release on unexpected error', async () => {
      const dto: CreateAppointmentDto = {
        id: 1,
        start: '2020-10-10 20:20',
        end: '2020-10-10 20:30',
        createdAt: '2020-09-02 14:23:12',
        updatedAt: '2020-09-28 14:23:12',
      };

      mockQueryRunner.manager.find.mockRejectedValue(
        new Error('Database connection error'),
      );

      await expect(service.upsertAppointment(dto)).rejects.toThrow(
        'Database connection error',
      );
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should rollback when overlap is detected', async () => {
      const dto: CreateAppointmentDto = {
        id: 2,
        start: '2020-10-10 20:25',
        end: '2020-10-10 20:35',
        createdAt: '2020-09-02 14:23:12',
        updatedAt: '2020-09-28 14:23:12',
      };

      const existingAppointment = {
        id: 1,
        start: new Date('2020-10-10 20:20'),
        end: new Date('2020-10-10 20:30'),
        createdAt: new Date('2020-09-02 14:23:12'),
        updatedAt: new Date('2020-09-28 14:23:12'),
        version: 1,
      };

      mockQueryRunner.manager.find.mockResolvedValue([existingAppointment]);

      await expect(service.upsertAppointment(dto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });
});
