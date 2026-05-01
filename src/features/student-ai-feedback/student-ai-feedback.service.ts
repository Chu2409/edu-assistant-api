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
import { StudentFeedbackDataCollectorService } from './services/student-feedback-data-collector.service'
import { StudentFeedbackMapper } from './mappers/student-feedback.mapper'
import { StudentFeedbackDto } from './dtos/res/student-feedback.dto'
import { ListStudentFeedbackDto } from './dtos/req/list-student-feedback.dto'
import { studentFeedbackPrompt } from './prompts/student-feedback.prompt'
import type { StudentAiFeedbackContent } from './interfaces/student-feedback-data.interface'
import type { ApiPaginatedRes } from 'src/shared/dtos/res/api-response.dto'
import { EMAIL_TEMPLATES } from 'src/shared/constants/email-templates'
import { CustomConfigService } from 'src/core/config/config.service'

@Injectable()
export class StudentAIFeedbackService {
  private readonly logger = new Logger(StudentAIFeedbackService.name)

  constructor(
    private readonly dbService: DBService,
    private readonly openaiService: OpenaiService,
    private readonly dataCollector: StudentFeedbackDataCollectorService,
    private readonly emailService: EmailService,
    private readonly configService: CustomConfigService,
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
      throw new NotFoundException(
        `Feedback with ID ${feedbackId} not found`,
      )
    }

    return StudentFeedbackMapper.toDto(feedback)
  }

  async generateForStudent(
    studentId: number,
    moduleId: number,
  ): Promise<StudentAiFeedbackContent | null> {
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
      this.logger.warn(`Student ${studentId} not enrolled in module ${moduleId}, skipping`)
      return null
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
      return null
    }

    const language = module.aiConfiguration?.language ?? 'es'
    const prompt = studentFeedbackPrompt({
      language,
      studentName: student.name || `Estudiante ${studentId}`,
      data: studentData,
    })

    try {
      const response = await this.openaiService.getResponse<StudentAiFeedbackContent>(prompt)
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

      // Send email with digest
      await this.emailService.sendWithTemplate(
        student.email,
        `Tu resumen semanal: ${module.title}`,
        EMAIL_TEMPLATES.STUDENT_FEEDBACK_DIGEST,
        {
          studentName: student.name || `Estudiante ${studentId}`,
          studentEmail: student.email,
          moduleTitle: module.title,
          moduleId,
          aiContent,
          baseUrl: this.configService.env.FRONTEND_URL || 'http://localhost:4200',
        },
      )

      this.logger.log(`Student AI feedback generated and email sent to ${student.email}`)
      return aiContent
    } catch (error) {
      this.logger.error(`Error generating feedback for student ${studentId}: ${error}`)
      return null
    }
  }

  async generateForAllStudents(): Promise<{ processed: number; sent: number; skipped: number }> {
    const enrollments = await this.dbService.enrollment.findMany({
      where: { isActive: true },
      include: {
        user: { select: { id: true, name: true, email: true } },
        module: { select: { id: true, title: true } },
      },
    })

    this.logger.log(`Starting AI feedback generation for ${enrollments.length} enrollments`)

    let processed = 0
    let sent = 0
    let skipped = 0

    for (const enrollment of enrollments) {
      try {
        const result = await this.generateForStudent(
          enrollment.user.id,
          enrollment.module.id,
        )

        processed++

        if (result) {
          sent++
        } else {
          skipped++
        }
      } catch (error) {
        this.logger.error(`Error processing student ${enrollment.user.id}: ${error}`)
        skipped++
      }
    }

    this.logger.log(`Student AI feedback completed. Processed: ${processed}, Sent: ${sent}, Skipped: ${skipped}`)

    return { processed, sent, skipped }
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
}