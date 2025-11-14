import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateAppointmentDto } from '../dto/create-appointment.dto';

describe('CreateAppointmentDto Validators', () => {
  describe('date format validation', () => {
    it('should accept valid date format YYYY-MM-DD HH:MM:SS', async () => {
      const dto = plainToInstance(CreateAppointmentDto, {
        id: 1,
        start: '2020-10-10 20:20:30',
        end: '2020-10-10 20:30:30',
        createdAt: '2020-09-02 14:23:12',
        updatedAt: '2020-09-28 14:23:12',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should accept valid date format YYYY-MM-DD HH:MM', async () => {
      const dto = plainToInstance(CreateAppointmentDto, {
        id: 1,
        start: '2020-10-10 20:20',
        end: '2020-10-10 20:30',
        createdAt: '2020-09-02 14:23',
        updatedAt: '2020-09-28 14:23',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject invalid date format', async () => {
      const dto = plainToInstance(CreateAppointmentDto, {
        id: 1,
        start: '2020/10/10 20:20',
        end: '2020-10-10 20:30',
        createdAt: '2020-09-02 14:23:12',
        updatedAt: '2020-09-28 14:23:12',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('start');
    });

    it('should reject invalid date', async () => {
      const dto = plainToInstance(CreateAppointmentDto, {
        id: 1,
        start: '2020-13-45 25:70',
        end: '2020-10-10 20:30',
        createdAt: '2020-09-02 14:23:12',
        updatedAt: '2020-09-28 14:23:12',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('end after start validation', () => {
    it('should pass when end is after start', async () => {
      const dto = plainToInstance(CreateAppointmentDto, {
        id: 1,
        start: '2020-10-10 20:20',
        end: '2020-10-10 20:30',
        createdAt: '2020-09-02 14:23:12',
        updatedAt: '2020-09-28 14:23:12',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail when end is before start', async () => {
      const dto = plainToInstance(CreateAppointmentDto, {
        id: 5,
        start: '2020-10-12 12:27',
        end: '2020-10-10 12:27',
        createdAt: '2020-09-11 10:23:12',
        updatedAt: '2020-09-28 14:23:12',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'end')).toBe(true);
    });

    it('should fail when end equals start', async () => {
      const dto = plainToInstance(CreateAppointmentDto, {
        id: 1,
        start: '2020-10-10 20:20',
        end: '2020-10-10 20:20',
        createdAt: '2020-09-02 14:23:12',
        updatedAt: '2020-09-28 14:23:12',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('id validation', () => {
    it('should accept positive integer id', async () => {
      const dto = plainToInstance(CreateAppointmentDto, {
        id: 1,
        start: '2020-10-10 20:20',
        end: '2020-10-10 20:30',
        createdAt: '2020-09-02 14:23:12',
        updatedAt: '2020-09-28 14:23:12',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject zero id', async () => {
      const dto = plainToInstance(CreateAppointmentDto, {
        id: 0,
        start: '2020-10-10 20:20',
        end: '2020-10-10 20:30',
        createdAt: '2020-09-02 14:23:12',
        updatedAt: '2020-09-28 14:23:12',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('id');
    });

    it('should reject negative id', async () => {
      const dto = plainToInstance(CreateAppointmentDto, {
        id: -1,
        start: '2020-10-10 20:20',
        end: '2020-10-10 20:30',
        createdAt: '2020-09-02 14:23:12',
        updatedAt: '2020-09-28 14:23:12',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('id');
    });

    it('should convert string id to number', async () => {
      const dto = plainToInstance(CreateAppointmentDto, {
        id: '1',
        start: '2020-10-10 20:20',
        end: '2020-10-10 20:30',
        createdAt: '2020-09-02 14:23:12',
        updatedAt: '2020-09-28 14:23:12',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(typeof dto.id).toBe('number');
      expect(dto.id).toBe(1);
    });
  });

  describe('missing fields validation', () => {
    it('should reject when id is missing', async () => {
      const dto = plainToInstance(CreateAppointmentDto, {
        start: '2020-10-10 20:20',
        end: '2020-10-10 20:30',
        createdAt: '2020-09-02 14:23:12',
        updatedAt: '2020-09-28 14:23:12',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('id');
    });

    it('should reject when start is missing', async () => {
      const dto = plainToInstance(CreateAppointmentDto, {
        id: 1,
        end: '2020-10-10 20:30',
        createdAt: '2020-09-02 14:23:12',
        updatedAt: '2020-09-28 14:23:12',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('start');
    });

    it('should reject when end is missing', async () => {
      const dto = plainToInstance(CreateAppointmentDto, {
        id: 1,
        start: '2020-10-10 20:20',
        createdAt: '2020-09-02 14:23:12',
        updatedAt: '2020-09-28 14:23:12',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('end');
    });

    it('should reject when createdAt is missing', async () => {
      const dto = plainToInstance(CreateAppointmentDto, {
        id: 1,
        start: '2020-10-10 20:20',
        end: '2020-10-10 20:30',
        updatedAt: '2020-09-28 14:23:12',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('createdAt');
    });

    it('should reject when updatedAt is missing', async () => {
      const dto = plainToInstance(CreateAppointmentDto, {
        id: 1,
        start: '2020-10-10 20:20',
        end: '2020-10-10 20:30',
        createdAt: '2020-09-02 14:23:12',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('updatedAt');
    });
  });

  describe('full DTO validation', () => {
    it('should validate complete valid DTO', async () => {
      const dto = plainToInstance(CreateAppointmentDto, {
        id: 6,
        start: '2020-10-12 12:00',
        end: '2020-10-12 13:30',
        createdAt: '2020-08-02 13:23:12',
        updatedAt: '2020-09-28 14:23:12',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should handle all test cases from job requirements', async () => {
      const testCases = [
        {
          id: 1,
          start: '2020-10-10 20:20',
          end: '2020-10-10 20:30',
          createdAt: '2020-09-02 14:23:12',
          updatedAt: '2020-09-28 14:23:12',
        },
        {
          id: 2,
          start: '2019-10-10 20:20',
          end: '2020-10-10 20:30',
          createdAt: '2018-10-02 16:23:12',
          updatedAt: '2020-09-28 14:23:12',
        },
        {
          id: 3,
          start: '2020-10-10 20:25',
          end: '2020-10-10 20:35',
          createdAt: '2020-10-01 13:23:12',
          updatedAt: '2020-09-28 14:23:12',
        },
        {
          id: 4,
          start: '2020-10-11 10:00',
          end: '2020-10-11 11:30',
          createdAt: '2020-10-01 11:23:12',
          updatedAt: '2020-09-28 14:23:12',
        },
        {
          id: 6,
          start: '2020-10-12 12:00',
          end: '2020-10-12 13:30',
          createdAt: '2020-08-02 13:23:12',
          updatedAt: '2020-09-28 14:23:12',
        },
      ];

      for (const testCase of testCases) {
        const dto = plainToInstance(CreateAppointmentDto, testCase);
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      }
    });

    it('should reject invalid test case (end before start)', async () => {
      const dto = plainToInstance(CreateAppointmentDto, {
        id: 5,
        start: '2020-10-12 11:27',
        end: '2020-10-10 12:27',
        createdAt: '2020-09-11 10:23:12',
        updatedAt: '2020-09-28 14:23:12',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});
