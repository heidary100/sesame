import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { ConflictException, BadRequestException } from '@nestjs/common';

describe('AppointmentsController', () => {
  let controller: AppointmentsController;
  let service: AppointmentsService;

  const mockService = {
    createOrUpdate: jest.fn(),
    findAll: jest.fn(),
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
      mockService.createOrUpdate.mockResolvedValue({ message: 'created' });

      const result = await controller.create(dto);
      expect(result).toEqual({ message: 'created' });
      expect(service.createOrUpdate).toHaveBeenCalledWith(dto);
    });

    it('should bubble validation errors (400)', async () => {
      mockService.createOrUpdate.mockRejectedValue(new BadRequestException());

      await expect(controller.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('should bubble conflict errors (409)', async () => {
      mockService.createOrUpdate.mockRejectedValue(new ConflictException());

      await expect(controller.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return all appointments', async () => {
      const mockData = [{ id: 1 }];
      mockService.findAll.mockResolvedValue(mockData);

      expect(await controller.findAll()).toEqual(mockData);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });
  });
});
