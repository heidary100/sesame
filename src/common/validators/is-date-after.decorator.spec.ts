import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { IsDateAfter } from './is-date-after.decorator';

class TestDto {
  @IsDateAfter('start')
  end: string | Date;

  start: string | Date;
}

describe('IsDateAfter Decorator', () => {
  describe('string date validation', () => {
    it('should validate when end is after start (ISO strings)', async () => {
      const dto = plainToInstance(TestDto, {
        start: '2020-10-10T20:20:00Z',
        end: '2020-10-10T20:30:00Z',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate when end is after start (datetime strings)', async () => {
      const dto = plainToInstance(TestDto, {
        start: '2020-10-10 20:20',
        end: '2020-10-10 20:30',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail when end is before start', async () => {
      const dto = plainToInstance(TestDto, {
        start: '2020-10-10 20:30',
        end: '2020-10-10 20:20',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('end');
      expect(errors[0].constraints).toHaveProperty('IsDateAfter');
    });

    it('should fail when end equals start', async () => {
      const dto = plainToInstance(TestDto, {
        start: '2020-10-10 20:20',
        end: '2020-10-10 20:20',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail when end is far before start', async () => {
      const dto = plainToInstance(TestDto, {
        start: '2020-10-10 20:20',
        end: '2019-01-01 10:00',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('Date object validation', () => {
    it('should validate when end Date is after start Date', async () => {
      const dto = plainToInstance(TestDto, {
        start: new Date('2020-10-10T20:20:00Z'),
        end: new Date('2020-10-10T20:30:00Z'),
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail when end Date is before start Date', async () => {
      const dto = plainToInstance(TestDto, {
        start: new Date('2020-10-10T20:30:00Z'),
        end: new Date('2020-10-10T20:20:00Z'),
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('mixed type validation (string and Date)', () => {
    it('should validate when end (string) is after start (Date)', async () => {
      const dto = plainToInstance(TestDto, {
        start: new Date('2020-10-10T20:20:00Z'),
        end: '2020-10-11 20:30', // Next day so definitely after
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate when end (Date) is after start (string)', async () => {
      const dto = plainToInstance(TestDto, {
        start: '2020-10-10 20:20',
        end: new Date('2020-10-10T20:30:00Z'),
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('invalid input handling', () => {
    it('should fail when start is invalid (number)', async () => {
      const dto = plainToInstance(TestDto, {
        start: 12345,
        end: '2020-10-10 20:30',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail when end is invalid (number)', async () => {
      const dto = plainToInstance(TestDto, {
        start: '2020-10-10 20:20',
        end: 67890,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail when start is null', async () => {
      const dto = plainToInstance(TestDto, {
        start: null,
        end: '2020-10-10 20:30',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail when end is null', async () => {
      const dto = plainToInstance(TestDto, {
        start: '2020-10-10 20:20',
        end: null,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail when start is undefined', async () => {
      const dto = plainToInstance(TestDto, {
        start: undefined,
        end: '2020-10-10 20:30',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should validate with very close timestamps', async () => {
      const dto = plainToInstance(TestDto, {
        start: '2020-10-10T20:20:00.000Z',
        end: '2020-10-10T20:20:00.001Z',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate across multiple days', async () => {
      const dto = plainToInstance(TestDto, {
        start: '2020-10-10 20:20',
        end: '2020-10-15 10:30',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate across months', async () => {
      const dto = plainToInstance(TestDto, {
        start: '2020-09-25 20:20',
        end: '2020-10-10 10:30',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate across years', async () => {
      const dto = plainToInstance(TestDto, {
        start: '2019-12-31 23:59',
        end: '2020-01-01 00:00',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('error messages', () => {
    it('should provide helpful error message', async () => {
      const dto = plainToInstance(TestDto, {
        start: '2020-10-10 20:30',
        end: '2020-10-10 20:20',
      });

      const errors = await validate(dto);
      const message = errors[0].constraints?.['IsDateAfter'] || '';
      expect(message).toContain('end');
      expect(message).toContain('start');
    });
  });
});
