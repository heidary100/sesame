// src/migrations/1763134122144-CreateAppointments.ts

import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAppointments1763134122144 implements MigrationInterface {
  name = 'CreateAppointments1763134122144';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create appointments table
    await queryRunner.query(`
      CREATE TABLE "appointments" (
        "id" integer NOT NULL,
        "start" TIMESTAMP WITH TIME ZONE NOT NULL,
        "end" TIMESTAMP WITH TIME ZONE NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "version" integer NOT NULL DEFAULT 1,
        CONSTRAINT "PK_appointments" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_appointments_end_after_start" CHECK ("end" > "start")
      )
    `);

    // 2. Index for overlap detection
    await queryRunner.query(`
      CREATE INDEX "idx_appointments_start_end" 
      ON "appointments" ("start", "end")
    `);

    // 3. Create history table
    await queryRunner.query(`
      CREATE TABLE "appointments_history" (
        "historyId" SERIAL NOT NULL,
        "appointmentId" integer NOT NULL,
        "start" TIMESTAMP WITH TIME ZONE NOT NULL,
        "end" TIMESTAMP WITH TIME ZONE NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "version" integer NOT NULL,
        "changedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_appointments_history" PRIMARY KEY ("historyId")
      )
    `);

    // 4. Index on FK
    await queryRunner.query(`
      CREATE INDEX "idx_appointments_history_appointmentId" 
      ON "appointments_history" ("appointmentId")
    `);

    // 5. Foreign Key
    await queryRunner.query(`
      ALTER TABLE "appointments_history"
      ADD CONSTRAINT "FK_appointments_history_appointment"
      FOREIGN KEY ("appointmentId") 
      REFERENCES "appointments"("id") 
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "appointments_history" DROP CONSTRAINT "FK_appointments_history_appointment"`);
    await queryRunner.query(`DROP INDEX "public"."idx_appointments_history_appointmentId"`);
    await queryRunner.query(`DROP TABLE "appointments_history"`);
    await queryRunner.query(`DROP INDEX "public"."idx_appointments_start_end"`);
    await queryRunner.query(`DROP TABLE "appointments"`);
  }
}