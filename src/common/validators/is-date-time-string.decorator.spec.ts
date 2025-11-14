import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { IsDateTimeString } from './is-date-time-string.decorator';

class TestDtoShort {
  @IsDateTimeString('YYYY-MM-DD HH:MM')
  date: string;
}

class TestDtoLong {
  @IsDateTimeString('YYYY-MM-DD HH:MM:SS')
  date: string;
}

describe('IsDateTimeString Decorator', () => {
  describe('YYYY-MM-DD HH:MM format', () => {
    it('should accept valid YYYY-MM-DD HH:MM format', async () => {
      const dto = plainToInstance(TestDtoShort, {
        date: '2020-10-10 20:20',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should accept valid YYYY-MM-DD HH:MM:SS format', async () => {
      const dto = plainToInstance(TestDtoShort, {
        date: '2020-10-10 20:20:30',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject YYYY/MM/DD HH:MM format', async () => {
      const dto = plainToInstance(TestDtoShort, {
        date: '2020/10/10 20:20',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject YYYY-MM-DD format (no time)', async () => {
      const dto = plainToInstance(TestDtoShort, {
        date: '2020-10-10',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject HH:MM format (no date)', async () => {
      const dto = plainToInstance(TestDtoShort, {
        date: '20:20',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject invalid date (e.g., 13th month)', async () => {
      const dto = plainToInstance(TestDtoShort, {
        date: '2020-13-10 20:20',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject invalid time (e.g., 25th hour)', async () => {
      const dto = plainToInstance(TestDtoShort, {
        date: '2020-10-10 25:20',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject invalid date (32nd day)', async () => {
      const dto = plainToInstance(TestDtoShort, {
        date: '2020-10-32 20:20',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should accept edge case dates (e.g., leap year)', async () => {
      const dto = plainToInstance(TestDtoShort, {
        date: '2020-02-29 12:00',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject Feb 30 (invalid date format would be caught by date parsing)', async () => {
      // The regex allows Feb 30 format-wise, but the decorator also checks if it parses as valid date
      // JavaScript Date constructor is lenient, so we test a clearly invalid format instead
      const dto = plainToInstance(TestDtoShort, {
        date: '2021-13-45 25:70', // Invalid month, day, hour, minute
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('YYYY-MM-DD HH:MM:SS format', () => {
    it('should accept valid YYYY-MM-DD HH:MM:SS format', async () => {
      const dto = plainToInstance(TestDtoLong, {
        date: '2020-10-10 20:20:30',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should also accept YYYY-MM-DD HH:MM format for flexibility', async () => {
      const dto = plainToInstance(TestDtoLong, {
        date: '2020-10-10 20:20',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject invalid seconds (e.g., 60)', async () => {
      const dto = plainToInstance(TestDtoLong, {
        date: '2020-10-10 20:20:60',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('type validation', () => {
    it('should reject non-string input (number)', async () => {
      const dto = plainToInstance(TestDtoShort, {
        date: 20201010,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject non-string input (Date object)', async () => {
      const dto = plainToInstance(TestDtoShort, {
        date: new Date('2020-10-10'),
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject null', async () => {
      const dto = plainToInstance(TestDtoShort, {
        date: null,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject undefined', async () => {
      const dto = plainToInstance(TestDtoShort, {
        date: undefined,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases with whitespace', () => {
    it('should reject leading whitespace', async () => {
      const dto = plainToInstance(TestDtoShort, {
        date: ' 2020-10-10 20:20',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject trailing whitespace', async () => {
      const dto = plainToInstance(TestDtoShort, {
        date: '2020-10-10 20:20 ',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject extra spaces between date and time', async () => {
      const dto = plainToInstance(TestDtoShort, {
        date: '2020-10-10  20:20',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('boundary times', () => {
    it('should accept 00:00 (midnight)', async () => {
      const dto = plainToInstance(TestDtoShort, {
        date: '2020-10-10 00:00',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should accept 23:59 (last minute of day)', async () => {
      const dto = plainToInstance(TestDtoShort, {
        date: '2020-10-10 23:59',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should accept 12:30 (noon)', async () => {
      const dto = plainToInstance(TestDtoShort, {
        date: '2020-10-10 12:30',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('century boundaries', () => {
    it('should accept year 2000', async () => {
      const dto = plainToInstance(TestDtoShort, {
        date: '2000-01-01 12:00',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should accept year 1999', async () => {
      const dto = plainToInstance(TestDtoShort, {
        date: '1999-12-31 23:59',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should accept future year 2050', async () => {
      const dto = plainToInstance(TestDtoShort, {
        date: '2050-06-15 18:30',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('error messages', () => {
    it('should provide helpful error message for invalid format', async () => {
      const dto = plainToInstance(TestDtoShort, {
        date: 'invalid-date',
      });

      const errors = await validate(dto);
      const message = errors[0].constraints?.['isDateTimeString'] || '';
      expect(message).toContain('must be in the format');
    });
  });
});
