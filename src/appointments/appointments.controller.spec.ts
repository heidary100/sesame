import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { ConflictException, BadRequestException } from '@nestjs/common';

describe('AppointmentsController', () => {
  let controller: AppointmentsController;
  let service: AppointmentsService;

  const mockService = {
    upsertAppointment: jest.fn(),
    findCurrentAppointments: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppointmentsController],
      providers: [
        {
          provide: AppointmentsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<AppointmentsController>(AppointmentsController);
    service = module.get<AppointmentsService>(AppointmentsService);

    // Mock logger
    jest.spyOn(controller['logger'], 'debug').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const dto: CreateAppointmentDto = {
      id: 1,
      start: '2020-10-10 20:20',
      end: '2020-10-10 20:30',
      createdAt: '2020-09-02 14:23:12',
      updatedAt: '2020-09-28 14:23:12',
    };

    it('should call service.createOrUpdate with the DTO', async () => {
      mockService.upsertAppointment.mockResolvedValue({ message: 'created' });

      const result = await controller.create(dto);
      expect(result).toEqual({ message: 'created' });
      expect(service.upsertAppointment).toHaveBeenCalledWith(dto);
    });

    it('should log debug message on create', async () => {
      mockService.upsertAppointment.mockResolvedValue({
        id: 1,
        version: 1,
      });

      await controller.create(dto);

      expect(controller['logger'].debug).toHaveBeenCalledWith(
        expect.stringContaining('Upserting appointment'),
      );
      expect(controller['logger'].debug).toHaveBeenCalledWith(
        expect.stringContaining('Successfully upserted appointment'),
      );
    });

    it('should bubble validation errors (400)', async () => {
      mockService.upsertAppointment.mockRejectedValue(new BadRequestException());

      await expect(controller.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('should bubble conflict errors (409)', async () => {
      mockService.upsertAppointment.mockRejectedValue(new ConflictException());

      await expect(controller.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return all appointments with default pagination', async () => {
      const mockData = [{ id: 1 }, { id: 2 }];
      mockService.findCurrentAppointments.mockResolvedValue(mockData);

      const result = await controller.findAll();
      expect(result).toEqual(mockData);
      expect(service.findCurrentAppointments).toHaveBeenCalledWith(100, 0);
    });

    it('should log debug messages for findAll', async () => {
      const mockData = [{ id: 1 }];
      mockService.findCurrentAppointments.mockResolvedValue(mockData);

      await controller.findAll('50', '10');

      expect(controller['logger'].debug).toHaveBeenCalledWith(
        expect.stringContaining('Fetching appointments'),
      );
      expect(controller['logger'].debug).toHaveBeenCalledWith(
        expect.stringContaining('Fetched 1 appointments'),
      );
    });

    it('should accept custom limit parameter', async () => {
      const mockData = [{ id: 1 }];
      mockService.findCurrentAppointments.mockResolvedValue(mockData);

      await controller.findAll('50', '0');
      expect(service.findCurrentAppointments).toHaveBeenCalledWith(50, 0);
    });

    it('should accept custom offset parameter', async () => {
      const mockData = [{ id: 1 }];
      mockService.findCurrentAppointments.mockResolvedValue(mockData);

      await controller.findAll('100', '10');
      expect(service.findCurrentAppointments).toHaveBeenCalledWith(100, 10);
    });

    it('should cap limit at 1000', async () => {
      const mockData = [];
      mockService.findCurrentAppointments.mockResolvedValue(mockData);

      await controller.findAll('5000', '0');
      expect(service.findCurrentAppointments).toHaveBeenCalledWith(1000, 0);
    });

    it('should set default limit for invalid limit value', async () => {
      const mockData = [];
      mockService.findCurrentAppointments.mockResolvedValue(mockData);

      await controller.findAll('invalid', '0');
      expect(service.findCurrentAppointments).toHaveBeenCalledWith(100, 0);
    });

    it('should set default limit for zero limit', async () => {
      const mockData = [];
      mockService.findCurrentAppointments.mockResolvedValue(mockData);

      await controller.findAll('0', '0');
      expect(service.findCurrentAppointments).toHaveBeenCalledWith(100, 0);
    });

    it('should set default offset for invalid offset value', async () => {
      const mockData = [];
      mockService.findCurrentAppointments.mockResolvedValue(mockData);

      await controller.findAll('100', 'invalid');
      expect(service.findCurrentAppointments).toHaveBeenCalledWith(100, 0);
    });

    it('should set default offset for negative offset', async () => {
      const mockData = [];
      mockService.findCurrentAppointments.mockResolvedValue(mockData);

      await controller.findAll('100', '-10');
      expect(service.findCurrentAppointments).toHaveBeenCalledWith(100, 0);
    });

    it('should handle both limit and offset parameters', async () => {
      const mockData = [{ id: 3 }, { id: 4 }];
      mockService.findCurrentAppointments.mockResolvedValue(mockData);

      const result = await controller.findAll('25', '50');
      expect(result).toEqual(mockData);
      expect(service.findCurrentAppointments).toHaveBeenCalledWith(25, 50);
    });

    it('should handle no parameters provided', async () => {
      const mockData = [{ id: 1 }];
      mockService.findCurrentAppointments.mockResolvedValue(mockData);

      await controller.findAll();
      expect(service.findCurrentAppointments).toHaveBeenCalledWith(100, 0);
    });

    it('should handle undefined parameters', async () => {
      const mockData = [{ id: 1 }];
      mockService.findCurrentAppointments.mockResolvedValue(mockData);

      await controller.findAll(undefined, undefined);
      expect(service.findCurrentAppointments).toHaveBeenCalledWith(100, 0);
    });
  });
});
