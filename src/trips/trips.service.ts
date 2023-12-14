import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, Trip } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';

@Injectable()
export class TripsService {
  constructor(private prisma: PrismaService) {}

  create(createTripDto: any) {
    return this.prisma.trip.create({
      data: createTripDto,
    });
  }

  findAll() {
    return this.prisma.trip.findMany();
  }

  find(
    tripWhereInput: Prisma.TripWhereInput,
    limit: number,
  ): Promise<Trip[] | null> {
    return this.prisma.trip.findMany({
      where: tripWhereInput,
      take: limit,
    });
  }

  async findAllByTripData(from: number[], to: number[], date: Date) {
    let [fromLongitude, fromLatitude] = from;
    let [toLongitude, toLatitude] = to;

    if (
      !fromLatitude ||
      !fromLongitude ||
      !toLatitude ||
      !toLongitude ||
      !date
    ) {
      return [];
    }

    fromLatitude = parseFloat(fromLatitude as any);
    fromLongitude = parseFloat(fromLongitude as any);
    toLatitude = parseFloat(toLatitude as any);
    toLongitude = parseFloat(toLongitude as any);

    const delta = 1;

    const minFromLatitude = fromLatitude - delta;
    const maxFromLatitude = fromLatitude + delta;
    const minFromLongitude = fromLongitude - delta;
    const maxFromLongitude = fromLongitude + delta;
    const minToLatitude = toLatitude - delta;
    const maxToLatitude = toLatitude + delta;
    const minToLongitude = toLongitude - delta;
    const maxToLongitude = toLongitude + delta;

    return this.prisma.trip.findMany({
      where: {
        fromLatitude: {
          gte: minFromLatitude,
          lte: maxFromLatitude,
        },
        fromLongitude: {
          gte: minFromLongitude,
          lte: maxFromLongitude,
        },
        toLatitude: {
          gte: minToLatitude,
          lte: maxToLatitude,
        },
        toLongitude: {
          gte: minToLongitude,
          lte: maxToLongitude,
        },
        departAt: {
          // max date is 1 week after the given date
          gte: date,
          lte: new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
        availableSeats: {
          gt: 0,
        },
        status: 'ACTIVE',
      },
    });
  }

  async findOne(
    tripWhereUniqueInput: Prisma.TripWhereUniqueInput,
  ): Promise<Trip | null> {
    return this.prisma.trip.findUnique({
      where: tripWhereUniqueInput,
    });
  }

  getPassengers(tripWhereUniqueInput: Prisma.TripWhereUniqueInput) {
    return this.prisma.trip
      .findUnique({
        where: tripWhereUniqueInput,
      })
      .passengers();
  }

  async joinTrip(tripWhereUniqueInput: Prisma.TripWhereUniqueInput, userId) {
    const trip = await this.prisma.trip.findUnique({
      where: tripWhereUniqueInput,
    });

    if (trip.availableSeats === 0) {
      throw new BadRequestException('No available seats');
    }

    const passengers = await this.getPassengers(tripWhereUniqueInput);

    if (passengers.find((passenger) => passenger.id === userId)) {
      throw new BadRequestException('User already joined');
    }

    const updatedTrip = this.prisma.trip.update({
      where: tripWhereUniqueInput,
      data: {
        availableSeats: trip.availableSeats - 1,
        passengers: {
          connect: {
            id: userId,
          },
        },
      },
      include: {
        passengers: true,
      },
    });

    return updatedTrip;
  }

  update(id: number, updateTripDto: UpdateTripDto) {
    return `This action updates a #${id} trip`;
  }

  remove(id: number) {
    return `This action removes a #${id} trip`;
  }
}
