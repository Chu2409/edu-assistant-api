import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { GetUser } from 'src/features/auth/decorators/get-user.decorator';
import { PageFeedbacksService } from './page-feedbacks.service';
import { CreatePageFeedbackDto } from './dtos/req/create-page-feedback.dto';
import { UpdatePageFeedbackDto } from './dtos/req/update-page-feedback.dto';
import { JwtAuth } from 'src/features/auth/decorators/jwt-auth.decorator';

@Controller('page-feedbacks')
@JwtAuth()
export class PageFeedbacksController {
  constructor(private readonly pageFeedbacksService: PageFeedbacksService) {}

  @Post()
  create(
    @GetUser('id') userId: number,
    @Body() createPageFeedbackDto: CreatePageFeedbackDto,
  ) {
    return this.pageFeedbacksService.create(userId, createPageFeedbackDto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @GetUser('id') userId: number,
    @Body() updatePageFeedbackDto: UpdatePageFeedbackDto,
  ) {
    return this.pageFeedbacksService.update(+id, userId, updatePageFeedbackDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetUser('id') userId: number) {
    return this.pageFeedbacksService.delete(+id, userId);
  }
}