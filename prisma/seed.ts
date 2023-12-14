import {
  PrismaClient,
  RequestStatus,
  TripStatus,
  UserRole,
} from '@prisma/client';
import { Faker, fr } from '@faker-js/faker';

const prisma = new PrismaClient();

const faker = new Faker({ locale: fr });

function createRandomUser() {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const email = faker.helpers.unique(faker.internet.email, [
    firstName,
    lastName,
  ]);

  return {
    firstName,
    lastName,
    email,
    avatarUrl: faker.image.avatar(),
    password: faker.internet.password(),
    phone: faker.phone.number(),
    isEmailVerified: faker.datatype.boolean(90),
    isPhoneVerified: faker.datatype.boolean(90),
    birthDate: faker.date.past({ years: 100 }), // users must be at least 18 years old
    role: faker.helpers.enumValue(UserRole),
  };
}

function createRandomCar(maxUserId: number) {
  return {
    make: faker.vehicle.manufacturer(),
    model: faker.vehicle.model(),
    ownerId: faker.number.int({ min: 1, max: maxUserId }),
    year: faker.date.past({ years: 15 }).getFullYear(),
    color: faker.vehicle.color(),
  };
}

function createRandomTrip(maxUserId: number, maxCarId: number) {
  const franceCoordinates: [latitude: number, longitude: number] = [
    46.227638, 2.213749,
  ];

  const fromLocation = faker.location.nearbyGPSCoordinate({
    origin: franceCoordinates,
    radius: 500,
    isMetric: true,
  });
  const toLocation = faker.location.nearbyGPSCoordinate({
    origin: franceCoordinates,
    radius: 500,
    isMetric: true,
  });

  return {
    driverId: faker.number.int({ min: 1, max: maxUserId }),
    carId: faker.number.int({ min: 1, max: maxCarId }),
    fromLocation: faker.location.streetAddress(),
    fromLatitude: fromLocation[0],
    fromLongitude: fromLocation[1],
    toLocation: faker.location.streetAddress(),
    toLatitude: toLocation[0],
    toLongitude: toLocation[1],
    departAt: faker.date.between({ from: '2023-01-01', to: '2023-12-31' }),
    arriveAt: faker.date.between({ from: '2023-01-01', to: '2023-12-31' }),
    price: faker.number.float({ min: 1, max: 100, precision: 2 }),
    availableSeats: faker.number.int({ min: 0, max: 5 }),
    totalSeats: faker.number.int({ min: 1, max: 5 }),
    status: faker.helpers.enumValue(TripStatus),
  };
}

function createRandomTripRequest(maxUserId: number, maxTripId: number) {
  return {
    tripId: faker.number.int({ min: 1, max: maxTripId }),
    passengerId: faker.number.int({ min: 1, max: maxUserId }),
    status: faker.helpers.enumValue(RequestStatus),
  };
}

const main = async () => {
  // drop all data from the database
  await prisma.tripRequest.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.car.deleteMany();
  await prisma.user.deleteMany();

  const users = Array.from({ length: 100 }).map(createRandomUser);

  await prisma.user.createMany({
    data: users,
  });

  const maxUserId = await prisma.user.count();

  const cars = Array.from({ length: 50 }).map(() => createRandomCar(maxUserId));

  await prisma.car.createMany({
    data: cars,
  });

  const maxCarId = await prisma.car.count();

  const trips = Array.from({ length: 500 }).map(() =>
    createRandomTrip(maxUserId, maxCarId),
  );

  await prisma.trip.createMany({
    data: trips,
  });

  const maxTripId = await prisma.trip.count();

  const tripRequests = Array.from({ length: 600 }).map(() =>
    createRandomTripRequest(maxUserId, maxTripId),
  );

  await prisma.tripRequest.createMany({
    data: tripRequests,
  });
};

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
