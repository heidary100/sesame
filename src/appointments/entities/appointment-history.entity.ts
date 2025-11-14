import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Appointment } from './appointment.entity';

@Entity('appointments_history')
@Index(['appointmentId'])
export class AppointmentHistory {
  @PrimaryGeneratedColumn()
  historyId: number;

  @Column({ type: 'int' })
  appointmentId: number;

  @Column({ type: 'timestamptz' })
  start: Date;

  @Column({ type: 'timestamptz' })
  end: Date;

  @Column({ type: 'timestamptz' })
  createdAt: Date;

  @Column({ type: 'timestamptz' })
  updatedAt: Date;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  changedAt: Date;

  @Column({ type: 'int' })
  version: number;

  @ManyToOne(() => Appointment)
  @JoinColumn({ name: 'appointmentId' })
  appointment: Appointment;
}