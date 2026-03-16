import { Controller, Post, Get, Body, UseGuards, Query, ParseIntPipe, BadRequestException } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { SendMessageDto } from './dtos/send-message.dto';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('send')
  async sendMessage(
    @GetUser() user: any,
    @Body() sendMessageDto: SendMessageDto,
  ) {
    if (!['ADMIN', 'FACULTY', 'STUDENT'].includes(user.role)) {
      throw new BadRequestException('Invalid user role for chat');
    }
    return this.chatService.sendMessage(user.id, user.role, sendMessageDto);
  }

  @Get('messages')
  async getMessages(
    @GetUser() user: any,
    @Query('departmentId') departmentId?: string,
    @Query('semesterId') semesterId?: string,
    @Query('divisionId') divisionId?: string,
    @Query('skip') skip?: string,
    @Query('limit') limit?: string,
  ) {
    const filters = {
      departmentId: departmentId ? parseInt(departmentId, 10) : undefined,
      semesterId: semesterId ? parseInt(semesterId, 10) : undefined,
      divisionId: divisionId ? parseInt(divisionId, 10) : undefined,
      skip: skip ? parseInt(skip, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    };
    return this.chatService.getMessages(user.role, filters);
  }
}
