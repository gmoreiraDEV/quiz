-- AlterTable
ALTER TABLE "quiz_sdr_sessions"
ADD COLUMN "scheduled_for" TIMESTAMP(3),
ADD COLUMN "scheduled_until" TIMESTAMP(3),
ADD COLUMN "booking_confirmed_at" TIMESTAMP(3),
ADD COLUMN "google_calendar_event_id" TEXT,
ADD COLUMN "google_calendar_event_url" TEXT,
ADD COLUMN "google_calendar_meeting_url" TEXT,
ADD COLUMN "booking_metadata" JSONB;
