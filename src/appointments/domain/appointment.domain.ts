import { BadRequestException } from '@nestjs/common';

export class AppointmentDomain {
  id: number;
  start: Date;
  end: Date;
  createdAt: Date;
  updatedAt: Date;
  version: number;

  constructor(
    id: number,
    start: Date,
    end: Date,
    createdAt: Date,
    updatedAt: Date,
    version: number = 1,
  ) {
    this.id = id;
    this.start = start;
    this.end = end;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.version = version;

    this.validate();
  }

  // Business rule: end > start, id > 0, updatedAt >= createdAt
  private validate(): void {
    if (this.id <= 0) {
      throw new BadRequestException('Appointment ID must be a positive integer');
    }
    if (this.end <= this.start) {
      throw new BadRequestException('End time must be after start time');
    }
    if (this.updatedAt < this.createdAt) {
      throw new BadRequestException('updatedAt cannot be earlier than createdAt');
    }
  }

  // Method to check overlap with another domain object
  hasOverlap(other: AppointmentDomain): boolean {
    return this.start < other.end && this.end > other.start;
  }

  // Method to update (with rules)
  update(newData: Partial<AppointmentDomain>): void {
    if (newData.updatedAt && newData.updatedAt < this.updatedAt) {
      throw new BadRequestException('New updatedAt cannot be earlier than current');
    }
    Object.assign(this, newData);
    this.version += 1;
    this.validate();
  }
}
