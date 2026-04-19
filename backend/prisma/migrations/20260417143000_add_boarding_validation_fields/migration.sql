-- AlterTable
ALTER TABLE `bookings`
    ADD COLUMN `boardedById` INTEGER NULL,
    ADD COLUMN `boardingNote` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `bookings_boardedById_idx` ON `bookings`(`boardedById`);

-- AddForeignKey
ALTER TABLE `bookings`
    ADD CONSTRAINT `bookings_boardedById_fkey`
    FOREIGN KEY (`boardedById`) REFERENCES `users`(`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE;
