import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import { QUEUE_NAMES } from 'src/shared/constants/queues'
import { StudentAIFeedbackService } from '../student-ai-feedback.service'
import type { StudentAiFeedbackContent } from '../interfaces/student-feedback-data.interface'

@Processor(QUEUE_NAMES.STUDENT_AI_FEEDBACK.NAME)
export class StudentAIFeedbackWorker extends WorkerHost {
  private readonly logger = new Logger(StudentAIFeedbackWorker.name)

  constructor(
    private readonly studentAIFeedbackService: StudentAIFeedbackService,
  ) {
    super()
  }

  async process(job: Job): Promise<unknown> {
    switch (job.name) {
      case QUEUE_NAMES.STUDENT_AI_FEEDBACK.JOBS.GENERATE_ALL:
        return this.handleGenerateAll()
      case QUEUE_NAMES.STUDENT_AI_FEEDBACK.JOBS.GENERATE_STUDENT:
        return this.handleGenerateStudent(job.data.studentId, job.data.moduleId)
      case QUEUE_NAMES.STUDENT_AI_FEEDBACK.JOBS.SEND_STUDENT_EMAIL:
        return this.handleSendStudentEmail(job.data)
      default:
        this.logger.warn(`Unknown job name: ${job.name}`)
    }
  }

  private async handleGenerateAll() {
    this.logger.log('Starting AI feedback generation for all students...')

    try {
      const result =
        await this.studentAIFeedbackService.generateForAllStudents()
      this.logger.log(
        `Student AI feedback completed: ${JSON.stringify(result)}`,
      )
      return { success: true, ...result }
    } catch (error) {
      this.logger.error('Error in student AI feedback generation:', error)
      throw error
    }
  }

  private async handleGenerateStudent(studentId: number, moduleId: number) {
    this.logger.log(
      `Starting AI feedback generation for student ${studentId}, module ${moduleId}`,
    )

    try {
      const result = await this.studentAIFeedbackService.generateForStudent(
        studentId,
        moduleId,
      )
      this.logger.log(`Student AI feedback generated for student ${studentId}`)
      return { success: true, studentId, moduleId, result: !!result }
    } catch (error) {
      this.logger.error(
        `Error generating feedback for student ${studentId}:`,
        error,
      )
      throw error
    }
  }

  private async handleSendStudentEmail(data: {
    studentId: number
    studentName: string
    studentEmail: string
    moduleId: number
    moduleTitle: string
    aiContent: StudentAiFeedbackContent
  }) {
    this.logger.log(
      `Sending delayed email to student ${data.studentId} (${data.studentEmail})`,
    )

    try {
      const result =
        await this.studentAIFeedbackService.sendDelayedStudentEmail(data)
      this.logger.log(
        `Delayed email result for ${data.studentEmail}: ${JSON.stringify(result)}`,
      )
      return { success: true, ...result }
    } catch (error) {
      this.logger.error(
        `Error sending delayed email to student ${data.studentId}:`,
        error,
      )
      throw error
    }
  }
}
