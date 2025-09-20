/*
  Warnings:

  - Added the required column `quantity` to the `StockEntry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `StockEntry` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BOMComponent" ADD COLUMN "cost" REAL;
ALTER TABLE "BOMComponent" ADD COLUMN "unit" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "bomLink" TEXT;
ALTER TABLE "Product" ADD COLUMN "category" TEXT;
ALTER TABLE "Product" ADD COLUMN "minStockAlert" INTEGER;
ALTER TABLE "Product" ADD COLUMN "unit" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_StockEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "change" REAL NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "sourceType" TEXT,
    "sourceId" TEXT,
    "balanceAfter" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StockEntry_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_StockEntry" ("balanceAfter", "change", "createdAt", "id", "productId", "sourceId", "sourceType") SELECT "balanceAfter", "change", "createdAt", "id", "productId", "sourceId", "sourceType" FROM "StockEntry";
DROP TABLE "StockEntry";
ALTER TABLE "new_StockEntry" RENAME TO "StockEntry";
CREATE TABLE "new_WorkOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "moId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "taskName" TEXT,
    "description" TEXT,
    "assignedToId" TEXT,
    "workCenterId" TEXT,
    "machineWorkCenter" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "estimatedTime" REAL,
    "actualTime" REAL,
    "startTime" DATETIME,
    "endTime" DATETIME,
    "durationMin" INTEGER,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkOrder_moId_fkey" FOREIGN KEY ("moId") REFERENCES "ManufacturingOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WorkOrder_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_WorkOrder" ("assignedToId", "createdAt", "description", "durationMin", "endTime", "id", "moId", "startTime", "status", "title", "updatedAt", "workCenterId") SELECT "assignedToId", "createdAt", "description", "durationMin", "endTime", "id", "moId", "startTime", "status", "title", "updatedAt", "workCenterId" FROM "WorkOrder";
DROP TABLE "WorkOrder";
ALTER TABLE "new_WorkOrder" RENAME TO "WorkOrder";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
