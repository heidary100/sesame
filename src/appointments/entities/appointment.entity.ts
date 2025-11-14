import { Entity, PrimaryColumn, Column, Index } from 'typeorm';

@Entity('appointments')
@Index(['start', 'end'])
export class Appointment {
    @PrimaryColumn({ type: 'int' })
    id: number;

    @Column({ type: 'timestamptz' })
    start: Date;

    @Column({ type: 'timestamptz' })
    end: Date;

    @Column({ type: 'timestamptz' })
    createdAt: Date;

    @Column({ type: 'timestamptz' })
    updatedAt: Date;

    @Column({ type: 'int', default: 1 })
    version: number;
}