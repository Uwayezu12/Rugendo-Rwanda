-- AlterTable
ALTER TABLE `companies` ADD COLUMN `dataSource` VARCHAR(191) NULL,
    ADD COLUMN `isVerifiedOperator` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `routes` ADD COLUMN `fareEffectiveFrom` DATETIME(3) NULL,
    ADD COLUMN `fareSource` VARCHAR(191) NULL,
    ADD COLUMN `officialFareRwf` DECIMAL(10, 2) NULL;
