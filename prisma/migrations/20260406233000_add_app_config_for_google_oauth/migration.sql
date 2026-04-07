-- CreateTable
CREATE TABLE "quiz_app_config" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "google_oauth_refresh_token" TEXT,
    "google_oauth_scope" TEXT,
    "google_oauth_connected_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quiz_app_config_pkey" PRIMARY KEY ("id")
);
