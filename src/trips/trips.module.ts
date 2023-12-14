import { Module } from '@nestjs/common';
import { TripsService } from './trips.service';
import { TripsController } from './trips.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [TripsController],
  providers: [PrismaService, TripsService],
})
export class TripsModule {}
