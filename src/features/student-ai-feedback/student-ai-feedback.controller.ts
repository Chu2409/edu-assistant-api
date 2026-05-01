import {
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common'
import { BusinessException } from 'src/shared/exceptions/business.exception'
import {
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import { GetUser } from 'src/features/auth/decorators/get-user.decorator'
import { JwtAuth } from 'src/features/auth/decorators/jwt-auth.decorator'
import { Role } from 'src/core/database/generated/enums'
import { QUEUE_NAMES } from 'src/shared/constants/queues'
import { StudentAIFeedbackService } from './student-ai-feedback.service'
import { StudentFeedbackDto } from './dtos/res/student-feedback.dto'
import { ListStudentFeedbackDto } from './dtos/req/list-student-feedback.dto'

@ApiTags('Student AI Feedback')
@Controller('modules/:moduleId/student-feedback')
@JwtAuth(Role.STUDENT)
export class StudentAIFeedbackController {
  constructor(
    private readonly studentAIFeedbackService: StudentAIFeedbackService,
    @InjectQueue(QUEUE_NAMES.STUDENT_AI_FEEDBACK.NAME)
    private readonly feedbackQueue: Queue,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List AI feedbacks generated for the student in this module',
  })
  @ApiResponse({ status: 200, type: [StudentFeedbackDto] })
  @ApiForbiddenResponse({ description: 'Not enrolled in this module' })
  list(
    @Param('moduleId', ParseIntPipe) moduleId: number,
    @GetUser('id') studentId: number,
    @Query() query: ListStudentFeedbackDto,
  ) {
    return this.studentAIFeedbackService.listByModule(studentId, query)
  }

  @Get(':id')
  @ApiOperation({ summary: 'View a specific AI feedback' })
  @ApiResponse({ status: 200, type: StudentFeedbackDto })
  @ApiNotFoundResponse({ description: 'Feedback not found' })
  @ApiForbiddenResponse({ description: 'Not your feedback' })
  findOne(
    @Param('moduleId', ParseIntPipe) moduleId: number,
    @Param('id', ParseIntPipe) id: number,
    @GetUser('id') studentId: number,
  ) {
    return this.studentAIFeedbackService.findOne(studentId, id)
  }

  @Post('generate')
  @ApiOperation({
    summary: 'Manually trigger AI feedback generation for this module',
  })
  @ApiResponse({ status: 202, description: 'Generation started' })
  @ApiForbiddenResponse({ description: 'Not enrolled in this module' })
  async generate(
    @Param('moduleId', ParseIntPipe) moduleId: number,
    @GetUser('id') studentId: number,
  ) {
    // Validate enrollment
    await this.studentAIFeedbackService.validateEnrollment(studentId, moduleId)

    // Enqueue with unique jobId per student+module to avoid concurrent executions
    const jobId = `generate-student-${studentId}-module-${moduleId}`

    const existingJob = await this.feedbackQueue.getJob(jobId)
    if (existingJob) {
      const state = await existingJob.getState()
      if (state === 'active' || state === 'waiting' || state === 'delayed') {
        throw new BusinessException(
          `Feedback generation already in progress for this module`,
          HttpStatus.CONFLICT,
        )
      }
      await existingJob.remove()
    }

    await this.feedbackQueue.add(
      QUEUE_NAMES.STUDENT_AI_FEEDBACK.JOBS.GENERATE_STUDENT,
      { studentId, moduleId },
      { jobId },
    )

    return { message: 'Feedback generation started' }
  }
}