import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { DBService } from 'src/core/database/database.service'
import { OpenaiService } from 'src/providers/ai/services/openai.service'
import { FeedbackDataCollectorService } from './services/feedback-data-collector.service'
import { TeacherFeedbackMapper } from './mappers/teacher-feedback.mapper'
import { TeacherFeedbackDto } from './dtos/res/teacher-feedback.dto'
import { ListTeacherFeedbackDto } from './dtos/req/list-teacher-feedback.dto'
import { loFeedbackPrompt } from './prompts/lo-feedback.prompt'
import { moduleFeedbackPrompt } from './prompts/module-feedback.prompt'
import { MIN_STUDENTS_FOR_LO_FEEDBACK } from './constants/thresholds'
import type { AiFeedbackContent } from './interfaces/feedback-data.interface'
import type { ApiPaginatedRes } from 'src/shared/dtos/res/api-response.dto'
import { TeacherFeedbackScope } from 'src/core/database/generated/enums'

@Injectable()
export class TeacherFeedbackService {
  private readonly logger = new Logger(TeacherFeedbackService.name)

  constructor(
    private readonly dbService: DBService,
    private readonly openaiService: OpenaiService,
    private readonly dataCollector: FeedbackDataCollectorService,
  ) {}

  // ─── Lectura ──────────────────────────────────────────────

  async listByModule(
    moduleId: number,
    teacherId: number,
    query: ListTeacherFeedbackDto,
  ): Promise<ApiPaginatedRes<TeacherFeedbackDto>> {
    await this.validateModuleOwnership(moduleId, teacherId)

    const where = {
      moduleId,
      ...(query.scope ? { scope: query.scope as TeacherFeedbackScope } : {}),
    }

    const skip = (query.page - 1) * query.limit

    const [total, feedbacks] = await Promise.all([
      this.dbService.teacherAiFeedback.count({ where }),
      this.dbService.teacherAiFeedback.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.limit,
      }),
    ])

    return {
      records: feedbacks.map((f) => TeacherFeedbackMapper.toDto(f)),
      total,
      limit: query.limit,
      page: query.page,
      pages: Math.ceil(total / query.limit),
    }
  }

  async findOne(
    moduleId: number,
    feedbackId: number,
    teacherId: number,
  ): Promise<TeacherFeedbackDto> {
    await this.validateModuleOwnership(moduleId, teacherId)

    const feedback = await this.dbService.teacherAiFeedback.findFirst({
      where: { id: feedbackId, moduleId },
    })

    if (!feedback) {
      throw new NotFoundException(
        `Feedback con ID ${feedbackId} no encontrado en el módulo ${moduleId}`,
      )
    }

    return TeacherFeedbackMapper.toDto(feedback)
  }

  // ─── Generación ───────────────────────────────────────────

  /**
   * Genera feedbacks para un módulo específico: primero por cada LO y luego uno global.
   */
  async generateForModule(moduleId: number): Promise<void> {
    const mod = await this.dbService.module.findUnique({
      where: { id: moduleId },
      include: {
        learningObjects: {
          where: { isPublished: true },
          select: { id: true, title: true },
          orderBy: { orderIndex: 'asc' },
        },
        aiConfiguration: true,
      },
    })

    if (!mod) {
      this.logger.warn(`Módulo ${moduleId} no encontrado, se omite`)
      return
    }

    const language = mod.aiConfiguration?.language ?? 'es'
    const loFeedbackSummaries: { loTitle: string; summary: string }[] = []

    // 1. Generar feedback por cada LO
    for (const lo of mod.learningObjects) {
      try {
        const summary = await this.generateLoFeedback(lo.id, language)
        if (summary) {
          loFeedbackSummaries.push({ loTitle: lo.title, summary })
        }
      } catch (error) {
        this.logger.error(`Error generando feedback para LO ${lo.id}: ${error}`)
      }
    }

    // 2. Generar meta-feedback del módulo
    try {
      await this.generateModuleFeedback(moduleId, language, loFeedbackSummaries)
    } catch (error) {
      this.logger.error(
        `Error generando feedback del módulo ${moduleId}: ${error}`,
      )
    }
  }

  /**
   * Genera feedback para todos los módulos activos.
   * Usado por el cron job.
   */
  async generateForAllModules(): Promise<void> {
    const modules = await this.dbService.module.findMany({
      where: { isActive: true },
      select: { id: true, title: true },
    })

    this.logger.log(
      `Iniciando generación de feedback para ${modules.length} módulos activos`,
    )

    for (const mod of modules) {
      try {
        this.logger.log(`Procesando módulo: ${mod.title} (ID: ${mod.id})`)
        await this.generateForModule(mod.id)
      } catch (error) {
        this.logger.error(
          `Error procesando módulo ${mod.id} (${mod.title}): ${error}`,
        )
      }
    }

    this.logger.log('Generación de feedback completada')
  }

  // ─── Helpers internos ─────────────────────────────────────

  /**
   * Genera feedback para un LO individual.
   * Retorna el summary si se generó, null si no hubo suficientes datos.
   */
  private async generateLoFeedback(
    learningObjectId: number,
    language: string,
  ): Promise<string | null> {
    const data = await this.dataCollector.collectLoData(learningObjectId)

    // Verificar umbral mínimo
    if (data.totalStudentsInteracted < MIN_STUDENTS_FOR_LO_FEEDBACK) {
      this.logger.log(
        `LO ${learningObjectId} ("${data.loTitle}") tiene ${data.totalStudentsInteracted} estudiantes (mínimo: ${MIN_STUDENTS_FOR_LO_FEEDBACK}). Se omite.`,
      )
      return null
    }

    // Obtener el moduleId del LO
    const lo = await this.dbService.learningObject.findUniqueOrThrow({
      where: { id: learningObjectId },
      select: { moduleId: true },
    })

    const prompt = loFeedbackPrompt({ language, data })
    const aiResponse =
      await this.openaiService.getResponse<AiFeedbackContent>(prompt)

    await this.dbService.teacherAiFeedback.create({
      data: {
        scope: TeacherFeedbackScope.LEARNING_OBJECT,
        moduleId: lo.moduleId,
        learningObjectId,
        content: aiResponse.content as object,
      },
    })

    return aiResponse.content.summary
  }

  private async generateModuleFeedback(
    moduleId: number,
    language: string,
    loFeedbackSummaries: { loTitle: string; summary: string }[],
  ): Promise<void> {
    const data = await this.dataCollector.collectModuleData(
      moduleId,
      loFeedbackSummaries,
    )

    // Si no hay feedbacks de LO ni preguntas, no generar feedback de módulo vacío
    if (
      loFeedbackSummaries.length === 0 &&
      data.topForumQuestions.length === 0
    ) {
      this.logger.log(
        `Módulo ${moduleId} no tiene datos suficientes para meta-feedback`,
      )
      return
    }

    const prompt = moduleFeedbackPrompt({ language, data })
    const aiResponse =
      await this.openaiService.getResponse<AiFeedbackContent>(prompt)

    await this.dbService.teacherAiFeedback.create({
      data: {
        scope: TeacherFeedbackScope.MODULE,
        moduleId,
        content: aiResponse.content as object,
      },
    })
  }

  private async validateModuleOwnership(
    moduleId: number,
    teacherId: number,
  ): Promise<void> {
    const mod = await this.dbService.module.findUnique({
      where: { id: moduleId },
      select: { teacherId: true },
    })

    if (!mod) {
      throw new NotFoundException(`Módulo con ID ${moduleId} no encontrado`)
    }

    if (mod.teacherId !== teacherId) {
      throw new ForbiddenException(
        'No tienes permisos para ver los feedbacks de este módulo',
      )
    }
  }
}
