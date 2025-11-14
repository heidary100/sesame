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

  // Business rule: end > start
  private validate(): void {
    if (this.end <= this.start) {
      throw new Error('End must be after start');
    }
    if (this.updatedAt < this.createdAt) {
      throw new Error('updatedAt cannot be earlier than createdAt');
    }
  }

  // Method to check overlap with another domain object
  hasOverlap(other: AppointmentDomain): boolean {
    return this.start < other.end && this.end > other.start;
  }

  // Method to update (with rules)
  update(newData: Partial<AppointmentDomain>): void {
    if (newData.updatedAt && newData.updatedAt < this.updatedAt) {
      throw new Error('New updatedAt cannot be earlier than current');
    }
    Object.assign(this, newData);
    this.version += 1;
    this.validate();
  }
}