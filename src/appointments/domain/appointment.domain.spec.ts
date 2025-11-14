import { BadRequestException } from '@nestjs/common';
import { AppointmentDomain } from './appointment.domain';

describe('AppointmentDomain', () => {
  describe('constructor', () => {
    it('should create an appointment domain with valid data', () => {
      const start = new Date('2020-10-10 20:20');
      const end = new Date('2020-10-10 20:30');
      const createdAt = new Date('2020-09-02 14:23:12');
      const updatedAt = new Date('2020-09-28 14:23:12');

      const domain = new AppointmentDomain(1, start, end, createdAt, updatedAt);

      expect(domain.id).toBe(1);
      expect(domain.start).toEqual(start);
      expect(domain.end).toEqual(end);
      expect(domain.createdAt).toEqual(createdAt);
      expect(domain.updatedAt).toEqual(updatedAt);
      expect(domain.version).toBe(1);
    });

    it('should throw BadRequestException when end is before start', () => {
      const start = new Date('2020-10-10 20:30');
      const end = new Date('2020-10-10 20:20');
      const createdAt = new Date('2020-09-02 14:23:12');
      const updatedAt = new Date('2020-09-28 14:23:12');

      expect(
        () =>
          new AppointmentDomain(1, start, end, createdAt, updatedAt),
      ).toThrow(BadRequestException);
    });

    it('should throw BadRequestException when end equals start', () => {
      const start = new Date('2020-10-10 20:30');
      const end = new Date('2020-10-10 20:30');
      const createdAt = new Date('2020-09-02 14:23:12');
      const updatedAt = new Date('2020-09-28 14:23:12');

      expect(
        () =>
          new AppointmentDomain(1, start, end, createdAt, updatedAt),
      ).toThrow(BadRequestException);
    });

    it('should throw BadRequestException when id is not positive', () => {
      const start = new Date('2020-10-10 20:20');
      const end = new Date('2020-10-10 20:30');
      const createdAt = new Date('2020-09-02 14:23:12');
      const updatedAt = new Date('2020-09-28 14:23:12');

      expect(
        () =>
          new AppointmentDomain(0, start, end, createdAt, updatedAt),
      ).toThrow(BadRequestException);

      expect(
        () =>
          new AppointmentDomain(-1, start, end, createdAt, updatedAt),
      ).toThrow(BadRequestException);
    });
  });

  describe('hasOverlap', () => {
    const baseStart = new Date('2020-10-10 20:20');
    const baseEnd = new Date('2020-10-10 20:30');
    const baseCreatedAt = new Date('2020-09-02 14:23:12');
    const baseUpdatedAt = new Date('2020-09-28 14:23:12');

    it('should return false when appointments do not overlap', () => {
      const appointment1 = new AppointmentDomain(
        1,
        baseStart,
        baseEnd,
        baseCreatedAt,
        baseUpdatedAt,
      );

      const appointment2 = new AppointmentDomain(
        2,
        new Date('2020-10-10 20:40'),
        new Date('2020-10-10 20:50'),
        baseCreatedAt,
        baseUpdatedAt,
      );

      expect(appointment1.hasOverlap(appointment2)).toBe(false);
      expect(appointment2.hasOverlap(appointment1)).toBe(false);
    });

    it('should return false when other appointment starts exactly when this ends', () => {
      const appointment1 = new AppointmentDomain(
        1,
        baseStart,
        baseEnd,
        baseCreatedAt,
        baseUpdatedAt,
      );

      const appointment2 = new AppointmentDomain(
        2,
        new Date('2020-10-10 20:30'),
        new Date('2020-10-10 20:40'),
        baseCreatedAt,
        baseUpdatedAt,
      );

      expect(appointment1.hasOverlap(appointment2)).toBe(false);
      expect(appointment2.hasOverlap(appointment1)).toBe(false);
    });

    it('should return true when appointments partially overlap', () => {
      const appointment1 = new AppointmentDomain(
        1,
        baseStart,
        baseEnd,
        baseCreatedAt,
        baseUpdatedAt,
      );

      const appointment2 = new AppointmentDomain(
        2,
        new Date('2020-10-10 20:25'),
        new Date('2020-10-10 20:35'),
        baseCreatedAt,
        baseUpdatedAt,
      );

      expect(appointment1.hasOverlap(appointment2)).toBe(true);
      expect(appointment2.hasOverlap(appointment1)).toBe(true);
    });

    it('should return true when one appointment is fully contained in another', () => {
      const appointment1 = new AppointmentDomain(
        1,
        baseStart,
        new Date('2020-10-10 20:50'),
        baseCreatedAt,
        baseUpdatedAt,
      );

      const appointment2 = new AppointmentDomain(
        2,
        new Date('2020-10-10 20:25'),
        new Date('2020-10-10 20:35'),
        baseCreatedAt,
        baseUpdatedAt,
      );

      expect(appointment1.hasOverlap(appointment2)).toBe(true);
      expect(appointment2.hasOverlap(appointment1)).toBe(true);
    });

    it('should return true when appointments are identical', () => {
      const appointment1 = new AppointmentDomain(
        1,
        baseStart,
        baseEnd,
        baseCreatedAt,
        baseUpdatedAt,
      );

      const appointment2 = new AppointmentDomain(
        2,
        baseStart,
        baseEnd,
        baseCreatedAt,
        baseUpdatedAt,
      );

      expect(appointment1.hasOverlap(appointment2)).toBe(true);
    });

    it('should return true when other appointment starts before this ends', () => {
      const appointment1 = new AppointmentDomain(
        1,
        baseStart,
        baseEnd,
        baseCreatedAt,
        baseUpdatedAt,
      );

      const appointment2 = new AppointmentDomain(
        2,
        new Date('2020-10-10 20:29'),
        new Date('2020-10-10 20:40'),
        baseCreatedAt,
        baseUpdatedAt,
      );

      expect(appointment1.hasOverlap(appointment2)).toBe(true);
      expect(appointment2.hasOverlap(appointment1)).toBe(true);
    });
  });

  describe('update', () => {
    it('should update appointment properties', () => {
      const appointment = new AppointmentDomain(
        1,
        new Date('2020-10-10 20:20'),
        new Date('2020-10-10 20:30'),
        new Date('2020-09-02 14:23:12'),
        new Date('2020-09-28 14:23:12'),
      );

      const newStart = new Date('2020-10-17 14:40');
      const newEnd = new Date('2020-10-17 15:30');
      const newCreatedAt = new Date('2020-03-02 19:23:12');
      const newUpdatedAt = new Date('2020-09-28 14:24:12');

      appointment.update({
        start: newStart,
        end: newEnd,
        createdAt: newCreatedAt,
        updatedAt: newUpdatedAt,
      });

      expect(appointment.start).toEqual(newStart);
      expect(appointment.end).toEqual(newEnd);
      expect(appointment.createdAt).toEqual(newCreatedAt);
      expect(appointment.updatedAt).toEqual(newUpdatedAt);
    });

    it('should increment version on update', () => {
      const appointment = new AppointmentDomain(
        1,
        new Date('2020-10-10 20:20'),
        new Date('2020-10-10 20:30'),
        new Date('2020-09-02 14:23:12'),
        new Date('2020-09-28 14:23:12'),
      );

      expect(appointment.version).toBe(1);

      appointment.update({
        start: new Date('2020-10-17 14:40'),
        end: new Date('2020-10-17 15:30'),
        createdAt: new Date('2020-03-02 19:23:12'),
        updatedAt: new Date('2020-09-28 14:24:12'),
      });

      expect(appointment.version).toBe(2);

      appointment.update({
        start: new Date('2020-10-18 14:40'),
        end: new Date('2020-10-18 15:30'),
        createdAt: new Date('2020-03-02 19:23:12'),
        updatedAt: new Date('2020-09-28 14:24:12'),
      });

      expect(appointment.version).toBe(3);
    });

    it('should throw BadRequestException when updated end is before start', () => {
      const appointment = new AppointmentDomain(
        1,
        new Date('2020-10-10 20:20'),
        new Date('2020-10-10 20:30'),
        new Date('2020-09-02 14:23:12'),
        new Date('2020-09-28 14:23:12'),
      );

      expect(() =>
        appointment.update({
          start: new Date('2020-10-17 15:30'),
          end: new Date('2020-10-17 14:40'),
          createdAt: new Date('2020-03-02 19:23:12'),
          updatedAt: new Date('2020-09-28 14:24:12'),
        }),
      ).toThrow(BadRequestException);
    });

    it('should update only provided properties', () => {
      const originalStart = new Date('2020-10-10 20:20');
      const originalEnd = new Date('2020-10-10 20:30');
      const originalCreatedAt = new Date('2020-09-02 14:23:12');
      const originalUpdatedAt = new Date('2020-09-28 14:23:12');

      const appointment = new AppointmentDomain(
        1,
        originalStart,
        originalEnd,
        originalCreatedAt,
        originalUpdatedAt,
      );

      const newStart = new Date('2020-10-17 14:40');
      const newEnd = new Date('2020-10-17 15:30');

      appointment.update({
        start: newStart,
        end: newEnd,
        createdAt: originalCreatedAt,
        updatedAt: originalUpdatedAt,
      });

      expect(appointment.start).toEqual(newStart);
      expect(appointment.end).toEqual(newEnd);
      expect(appointment.createdAt).toEqual(originalCreatedAt);
      expect(appointment.updatedAt).toEqual(originalUpdatedAt);
    });
  });

  describe('version tracking', () => {
    it('should initialize version to 1', () => {
      const appointment = new AppointmentDomain(
        1,
        new Date('2020-10-10 20:20'),
        new Date('2020-10-10 20:30'),
        new Date('2020-09-02 14:23:12'),
        new Date('2020-09-28 14:23:12'),
      );

      expect(appointment.version).toBe(1);
    });

    it('should track multiple updates', () => {
      const appointment = new AppointmentDomain(
        1,
        new Date('2020-10-10 20:20'),
        new Date('2020-10-10 20:30'),
        new Date('2020-09-02 14:23:12'),
        new Date('2020-09-28 14:23:12'),
      );

      for (let i = 0; i < 10; i++) {
        appointment.update({
          start: new Date(`2020-10-${15 + i} 20:20`),
          end: new Date(`2020-10-${15 + i} 20:30`),
          createdAt: new Date('2020-09-02 14:23:12'),
          updatedAt: new Date('2020-09-28 14:23:12'),
        });
      }

      expect(appointment.version).toBe(11);
    });
  });
});
