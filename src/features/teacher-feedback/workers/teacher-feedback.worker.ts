import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import { QUEUE_NAMES } from 'src/shared/constants/queues'
import { TeacherFeedbackService } from '../teacher-feedback.service'

@Processor(QUEUE_NAMES.TEACHER_FEEDBACK.NAME)
export class TeacherFeedbackWorker extends WorkerHost {
  private readonly logger = new Logger(TeacherFeedbackWorker.name)

  constructor(private readonly teacherFeedbackService: TeacherFeedbackService) {
    super()
  }

  async process(job: Job): Promise<unknown> {
    switch (job.name) {
      case QUEUE_NAMES.TEACHER_FEEDBACK.JOBS.GENERATE_ALL:
        return this.handleGenerateAll()
      case QUEUE_NAMES.TEACHER_FEEDBACK.JOBS.GENERATE_MODULE:
        return this.handleGenerateModule(job.data.moduleId)
      default:
        this.logger.warn(`Unknown job name: ${job.name}`)
    }
  }

  private async handleGenerateAll() {
    this.logger.log('Iniciando generación automática de feedback pedagógico...')

    try {
      await this.teacherFeedbackService.generateForAllModules()
      this.logger.log('Generación automática de feedback pedagógico completada')
      return { success: true }
    } catch (error) {
      this.logger.error(
        'Error en la generación automática de feedback pedagógico:',
        error,
      )
      throw error
    }
  }

  private async handleGenerateModule(moduleId: number) {
    this.logger.log(
      `Iniciando generación de feedback para módulo ${moduleId}...`,
    )

    try {
      await this.teacherFeedbackService.generateForModule(moduleId)
      this.logger.log(
        `Generación de feedback para módulo ${moduleId} completada`,
      )
      return { success: true, moduleId }
    } catch (error) {
      this.logger.error(
        `Error generando feedback para módulo ${moduleId}:`,
        error,
      )
      throw error
    }
  }
}
