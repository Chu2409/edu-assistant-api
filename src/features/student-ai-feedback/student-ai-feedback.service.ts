import {
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { BusinessException } from 'src/shared/exceptions/business.exception'
import { DBService } from 'src/core/database/database.service'
import { OpenaiService } from 'src/providers/ai/services/openai.service'
import { EmailService } from 'src/providers/email/email.service'
import { EmailDailyLimitService } from 'src/providers/email/services/email-daily-limit.service'
import { StudentFeedbackDataCollectorService } from './services/student-feedback-data-collector.service'
import { StudentFeedbackMapper } from './mappers/student-feedback.mapper'
import { StudentFeedbackDto } from './dtos/res/student-feedback.dto'
import { ListStudentFeedbackDto } from './dtos/req/list-student-feedback.dto'
import { studentFeedbackPrompt } from './prompts/student-feedback.prompt'
import type { StudentAiFeedbackContent } from './interfaces/student-feedback-data.interface'
import type { ApiPaginatedRes } from 'src/shared/dtos/res/api-response.dto'
import { EMAIL_TEMPLATES } from 'src/shared/constants/email-templates'
import { CustomConfigService } from 'src/core/config/config.service'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import { QUEUE_NAMES } from 'src/shared/constants/queues'

@Injectable()
export class StudentAIFeedbackService {
  private readonly logger = new Logger(StudentAIFeedbackService.name)

  constructor(
    private readonly dbService: DBService,
    private readonly openaiService: OpenaiService,
    private readonly dataCollector: StudentFeedbackDataCollectorService,
    private readonly emailService: EmailService,
    private readonly emailDailyLimitService: EmailDailyLimitService,
    private readonly configService: CustomConfigService,
    @InjectQueue(QUEUE_NAMES.STUDENT_AI_FEEDBACK.NAME)
    private readonly feedbackQueue: Queue,
  ) {}

  async listByModule(
    studentId: number,
    query: ListStudentFeedbackDto,
  ): Promise<ApiPaginatedRes<StudentFeedbackDto>> {
    const where = {
      studentId,
      ...(query.scope ? { scope: query.scope } : {}),
    }

    const skip = (query.page - 1) * query.limit

    const [total, feedbacks] = await Promise.all([
      this.dbService.studentAiFeedback.count({ where }),
      this.dbService.studentAiFeedback.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.limit,
      }),
    ])

    return {
      records: feedbacks.map((f) => StudentFeedbackMapper.toDto(f)),
      total,
      limit: query.limit,
      page: query.page,
      pages: Math.ceil(total / query.limit),
    }
  }

  async findOne(
    studentId: number,
    feedbackId: number,
  ): Promise<StudentFeedbackDto> {
    const feedback = await this.dbService.studentAiFeedback.findFirst({
      where: { id: feedbackId, studentId },
    })

    if (!feedback) {
      throw new NotFoundException(`Feedback with ID ${feedbackId} not found`)
    }

    return StudentFeedbackMapper.toDto(feedback)
  }

  async generateForStudent(
    studentId: number,
    moduleId: number,
  ): Promise<{ content: StudentAiFeedbackContent | null; emailSent: boolean; emailQueued: boolean }> {
    // Validate student is enrolled in this module
    const enrollment = await this.dbService.enrollment.findFirst({
      where: {
        userId: studentId,
        moduleId,
        isActive: true,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        module: {
          select: { id: true, title: true, aiConfiguration: true },
        },
      },
    })

    if (!enrollment) {
      this.logger.warn(
        `Student ${studentId} not enrolled in module ${moduleId}, skipping`,
      )
      return { content: null, emailSent: false, emailQueued: false }
    }

    const student = enrollment.user
    const module = enrollment.module

    // Week boundaries for the digest
    const weekEnd = new Date()
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - 7)

    // Collect student data for AI
    const studentData = await this.dataCollector.collectStudentData(
      studentId,
      moduleId,
      weekStart,
      weekEnd,
    )

    // If no activity, skip
    if (studentData.totalAttempts === 0) {
      this.logger.log(`Student ${studentId}: no activity this week, skipping`)
      return { content: null, emailSent: false, emailQueued: false }
    }

    const language = module.aiConfiguration?.language ?? 'es'
    const prompt = studentFeedbackPrompt({
      language,
      studentName: student.name || `Estudiante ${studentId}`,
      data: studentData,
    })

    try {
      const response =
        await this.openaiService.getResponse<StudentAiFeedbackContent>(prompt)
      const aiContent = response.content

      // Save to database
      await this.dbService.studentAiFeedback.create({
        data: {
          scope: 'WEEKLY_DIGEST',
          studentId,
          moduleId,
          content: aiContent as object,
        },
      })

      // Send email with digest (respecting daily limit)
      const emailResult = await this.sendFeedbackEmailWithLimit(
        student,
        module.id,
        module.title,
        aiContent,
      )

      this.logger.log(
        `Student AI feedback generated for student ${studentId} (email: sent=${emailResult.sent}, queued=${emailResult.queued})`,
      )
      return { content: aiContent, emailSent: emailResult.sent, emailQueued: emailResult.queued }
    } catch (error) {
      this.logger.error(
        `Error generating feedback for student ${studentId}: ${error}`,
      )
      return { content: null, emailSent: false, emailQueued: false }
    }
  }

  async generateForAllStudents(): Promise<{
    processed: number
    sent: number
    skipped: number
    emailSent: number
    emailQueued: number
  }> {
    const enrollments = await this.dbService.enrollment.findMany({
      where: { isActive: true },
      include: {
        user: { select: { id: true, name: true, email: true } },
        module: { select: { id: true, title: true } },
      },
    })

    this.logger.log(
      `Starting AI feedback generation for ${enrollments.length} enrollments`,
    )

    let processed = 0
    let sent = 0
    let skipped = 0
    let emailSent = 0
    let emailQueued = 0

    for (const enrollment of enrollments) {
      try {
        const result = await this.generateForStudent(
          enrollment.user.id,
          enrollment.module.id,
        )

        processed++

        if (result.content) {
          sent++
        } else {
          skipped++
        }

        if (result.emailSent) {
          emailSent++
        } else if (result.emailQueued) {
          emailQueued++
        }
      } catch (error) {
        this.logger.error(
          `Error processing student ${enrollment.user.id}: ${error}`,
        )
        skipped++
      }
    }

    this.logger.log(
      `Student AI feedback completed. Processed: ${processed}, Sent: ${sent}, Skipped: ${skipped}, EmailSent: ${emailSent}, EmailQueued: ${emailQueued}`,
    )

    return { processed, sent, skipped, emailSent, emailQueued }
  }

  async validateEnrollment(studentId: number, moduleId: number): Promise<void> {
    const enrollment = await this.dbService.enrollment.findFirst({
      where: {
        userId: studentId,
        moduleId,
        isActive: true,
      },
    })

    if (!enrollment) {
      throw new BusinessException(
        'No estás inscrito en este módulo',
        HttpStatus.FORBIDDEN,
      )
    }
  }

  /**
   * Helper to get milliseconds until next day 9 AM for scheduled email retry
   */
  private getMillisecondsUntilNextDayMorning(): number {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(9, 0, 0, 0) // 9:00 AM
    return tomorrow.getTime() - now.getTime()
  }

  /**
   * Send feedback email respecting daily limit
   * If limit reached, enqueue for next day
   */
  private async sendFeedbackEmailWithLimit(
    student: { id: number; name: string; email: string },
    moduleId: number,
    moduleTitle: string,
    aiContent: StudentAiFeedbackContent,
  ): Promise<{ sent: boolean; queued: boolean }> {
    const canSend = await this.emailDailyLimitService.canSendEmail()

    if (canSend) {
      await this.emailService.sendWithTemplate(
        student.email,
        `Tu resumen semanal: ${moduleTitle}`,
        EMAIL_TEMPLATES.STUDENT_FEEDBACK_DIGEST,
        {
          studentName: student.name || `Estudiante ${student.id}`,
          studentEmail: student.email,
          moduleTitle,
          moduleId,
          aiContent,
          baseUrl:
            this.configService.env.FRONTEND_URL || 'http://localhost:4200',
        },
      )

      this.logger.log(`Email sent to ${student.email}`)
      return { sent: true, queued: false }
    }

    // Limit reached - enqueue for tomorrow
    this.logger.warn(
      `Daily email limit reached. Enqueueing email for ${student.email} for tomorrow`,
    )

    await this.feedbackQueue.add(
      QUEUE_NAMES.STUDENT_AI_FEEDBACK.JOBS.SEND_STUDENT_EMAIL,
      {
        studentId: student.id,
        studentName: student.name,
        studentEmail: student.email,
        moduleId,
        moduleTitle,
        aiContent,
      },
      {
        jobId: `send-email-${student.id}-${moduleId}-${Date.now()}`,
        delay: this.getMillisecondsUntilNextDayMorning(),
        attempts: 3,
        backoff: {
          type: 'exponential' as const,
          delay: 60000,
        },
      },
    )

    return { sent: false, queued: true }
  }

  /**
   * Send a delayed student email (called by worker when retrying after limit exceeded)
   */
  async sendDelayedStudentEmail(data: {
    studentId: number
    studentName: string
    studentEmail: string
    moduleId: number
    moduleTitle: string
    aiContent: StudentAiFeedbackContent
  }): Promise<{ sent: boolean; queued: boolean }> {
    const { studentId, studentName, studentEmail, moduleId, moduleTitle, aiContent } = data

    const canSend = await this.emailDailyLimitService.canSendEmail()

    if (canSend) {
      await this.emailService.sendWithTemplate(
        studentEmail,
        `Tu resumen semanal: ${moduleTitle}`,
        EMAIL_TEMPLATES.STUDENT_FEEDBACK_DIGEST,
        {
          studentName: studentName || `Estudiante ${studentId}`,
          studentEmail,
          moduleTitle,
          moduleId,
          aiContent,
          baseUrl:
            this.configService.env.FRONTEND_URL || 'http://localhost:4200',
        },
      )

      this.logger.log(`Delayed email sent to ${studentEmail}`)
      return { sent: true, queued: false }
    }

    // Still over limit - re-enqueue for next day
    this.logger.warn(
      `Still over daily limit for ${studentEmail}. Re-enqueueing for tomorrow`,
    )

    await this.feedbackQueue.add(
      QUEUE_NAMES.STUDENT_AI_FEEDBACK.JOBS.SEND_STUDENT_EMAIL,
      data,
      {
        jobId: `send-email-${studentId}-${moduleId}-${Date.now()}`,
        delay: this.getMillisecondsUntilNextDayMorning(),
        attempts: 3,
        backoff: {
          type: 'exponential' as const,
          delay: 60000,
        },
      },
    )

    return { sent: false, queued: true }
  }
}
