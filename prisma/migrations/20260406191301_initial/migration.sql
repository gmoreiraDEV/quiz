-- CreateEnum
CREATE TYPE "QuizSubmissionStatus" AS ENUM ('COMPLETED', 'INVALID');

-- CreateEnum
CREATE TYPE "QuizSDRSessionStatus" AS ENUM ('READY', 'COLLECTING_INFO', 'READY_TO_SCHEDULE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "QuizSDRMessageRole" AS ENUM ('ASSISTANT', 'USER', 'SYSTEM');

-- CreateEnum
CREATE TYPE "QuizBookingStatus" AS ENUM ('PENDING', 'READY', 'REDIRECTED', 'SCHEDULED');

-- CreateTable
CREATE TABLE "quiz_leads" (
    "id" TEXT NOT NULL,
    "lead_token" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "phone_number" TEXT,
    "utm_source" TEXT,
    "utm_medium" TEXT,
    "utm_campaign" TEXT,
    "utm_term" TEXT,
    "utm_content" TEXT,
    "gclid" TEXT,
    "fbclid" TEXT,
    "referrer_code" TEXT,
    "first_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quiz_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_submissions" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "external_submission_id" TEXT,
    "typebot_result_id" TEXT,
    "status" "QuizSubmissionStatus" NOT NULL DEFAULT 'COMPLETED',
    "respondent_name" TEXT,
    "email" TEXT,
    "phone_number" TEXT,
    "total_score" INTEGER,
    "max_score" INTEGER,
    "percentage" INTEGER,
    "profile_name" TEXT,
    "profile_code" TEXT,
    "profile_summary" TEXT,
    "strongest_pillar_name" TEXT,
    "weakest_pillar_name" TEXT,
    "answers" JSONB,
    "variables" JSONB,
    "metadata" JSONB,
    "raw_payload" JSONB,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quiz_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_sdr_sessions" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "submission_id" TEXT,
    "status" "QuizSDRSessionStatus" NOT NULL DEFAULT 'READY',
    "booking_status" "QuizBookingStatus" NOT NULL DEFAULT 'PENDING',
    "booking_url" TEXT,
    "stage_key" TEXT,
    "summary" TEXT,
    "last_user_message_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quiz_sdr_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_sdr_messages" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "role" "QuizSDRMessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quiz_sdr_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "quiz_leads_lead_token_key" ON "quiz_leads"("lead_token");

-- CreateIndex
CREATE UNIQUE INDEX "quiz_submissions_external_submission_id_key" ON "quiz_submissions"("external_submission_id");

-- CreateIndex
CREATE UNIQUE INDEX "quiz_sdr_sessions_lead_id_submission_id_key" ON "quiz_sdr_sessions"("lead_id", "submission_id");

-- AddForeignKey
ALTER TABLE "quiz_submissions" ADD CONSTRAINT "quiz_submissions_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "quiz_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_sdr_sessions" ADD CONSTRAINT "quiz_sdr_sessions_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "quiz_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_sdr_sessions" ADD CONSTRAINT "quiz_sdr_sessions_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "quiz_submissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_sdr_messages" ADD CONSTRAINT "quiz_sdr_messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "quiz_sdr_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
