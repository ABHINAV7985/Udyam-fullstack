-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "aadhaar" TEXT,
    "aadhaarName" TEXT,
    "mobile" TEXT,
    "captcha" TEXT,
    "otp" TEXT,
    "panNumber" TEXT,
    "panName" TEXT,
    "pinCode" TEXT,
    "district" TEXT,
    "state" TEXT,
    "orgType" TEXT,
    "payload" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
