import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Put,
} from '@nestjs/common';
import { TripsService } from './trips.service';
import { UpdateTripDto } from './dto/update-trip.dto';
import { Public } from 'src/decorators/Public.decorator';

@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Public()
  @Post()
  create(@Body() createTripDto: any) {
    return this.tripsService.create(createTripDto);
  }

  @Get()
  findAll() {
    return this.tripsService.findAll();
  }

  @Public()
  @Get('search')
  find(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('date') date: string,
  ) {
    const fromCoordinates = JSON.parse(from);
    const toCoordinates = JSON.parse(to);

    return this.tripsService.findAllByTripData(
      fromCoordinates,
      toCoordinates,
      new Date(date),
    );
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tripsService.findOne({ id: +id });
  }

  @Public()
  @Get(':id/passengers')
  passengers(@Param('id') id: string) {
    return this.tripsService.getPassengers({ id: +id });
  }

  @Public()
  @Put('join')
  join(@Body() joinTripData: any) {
    const { tripId, userId } = joinTripData;
    return this.tripsService.joinTrip({ id: +tripId }, userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTripDto: UpdateTripDto) {
    return this.tripsService.update(+id, updateTripDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tripsService.remove(+id);
  }
}
