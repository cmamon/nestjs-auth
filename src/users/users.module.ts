import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { TripsService } from 'src/trips/trips.service';

@Module({
  imports: [PrismaModule],
  controllers: [UsersController],
  providers: [UsersService, TripsService],
  exports: [UsersService],
})
export class UsersModule {}
