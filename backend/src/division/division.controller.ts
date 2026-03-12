import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { DivisionService } from './division.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('divisions')
export class DivisionController {
  constructor(private readonly divisionService: DivisionService) {}

  @Get()
  async findAll() {
    return this.divisionService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.divisionService.findOne(parseInt(id));
  }
}
