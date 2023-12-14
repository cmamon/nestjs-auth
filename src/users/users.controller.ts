import { Controller, Get, Param, Request } from '@nestjs/common';
import { Public } from 'src/decorators/Public.decorator';
import { TripsService } from 'src/trips/trips.service';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly userService: UsersService,
    private readonly tripsService: TripsService,
  ) {}

  @Get()
  async getUsers() {
    return this.userService.getUsers();
  }

  @Get('me')
  async getMe(@Request() req) {
    const user = await this.userService.findOne({ id: req.user.userId });

    delete user.password;
    delete user.refreshToken;

    return user;
  }

  @Get('me/trips')
  async getMyTrips(@Request() req) {
    const limit = req.query.limit ? parseInt(req.query.limit) : 5;
    const trips = await this.tripsService.find(
      {
        driverId: req.user.userId,
        status: 'COMPLETED',
      },
      limit,
    );

    return trips;
  }

  @Public()
  @Get(':id')
  async getUser(@Param('id') id: string) {
    return this.userService.findOne({ id: Number(id) });
  }

  @Public()
  @Get(':id/reviews')
  async getReviews(@Param('id') id: string) {
    return this.userService.getReviews({ userId: +id });
  }
}
