export class AppointmentHistoryDomain {
  historyId?: number;
  appointmentId: number;
  start: Date;
  end: Date;
  createdAt: Date;
  updatedAt: Date;
  changedAt: Date;
  version: number;

  constructor(
    appointmentId: number,
    start: Date,
    end: Date,
    createdAt: Date,
    updatedAt: Date,
    version: number,
    changedAt: Date = new Date(),
  ) {
    this.appointmentId = appointmentId;
    this.start = start;
    this.end = end;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.version = version;
    this.changedAt = changedAt;
  }
}