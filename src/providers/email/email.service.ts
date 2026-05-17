import { Injectable, Logger } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import { CustomConfigService } from '../../core/config/config.service'
import { lastValueFrom } from 'rxjs'
import { SendEmailOptions } from './interfaces/send-email-options'
import { EmailSendResult } from './interfaces/email-result.interface'
import { QueuedEmailJob } from './interfaces/queued-email-job.interface'
import { EmailDailyLimitService } from './services/email-daily-limit.service'
import { QUEUE_NAMES } from 'src/shared/constants/queues'
import * as ejs from 'ejs'
import * as path from 'path'

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name)
  private readonly templatesPath = path.join(
    __dirname,
    '../../../shared/templates/email',
  )

  constructor(
    private readonly configService: CustomConfigService,
    private readonly httpService: HttpService,
    private readonly dailyLimitService: EmailDailyLimitService,
    @InjectQueue(QUEUE_NAMES.EMAIL_QUEUE.NAME)
    private readonly emailQueue: Queue,
  ) {}

  private async renderTemplate(
    templateName: string,
    data?: Record<string, any>,
  ): Promise<string> {
    const layoutPath = path.join(this.templatesPath, 'layout.ejs')
    const templatePath = path.join(this.templatesPath, `${templateName}.ejs`)

    const templateData = {
      ...data,
      year: new Date().getFullYear(),
      subject: data?.subject || 'Notificación de EduAssistant',
      baseUrl:
        (this.configService.env.FRONTEND_URL || '').replace(/\/$/, '') ||
        'http://localhost:4200',
    }

    try {
      const content = await ejs.renderFile(templatePath, templateData)

      return await ejs.renderFile(layoutPath, {
        ...templateData,
        content,
      })
    } catch (error: any) {
      this.logger.error(`Error renderizando plantilla ${templateName}`, error)
      throw new Error(`No se pudo renderizar el correo: ${error.message}`)
    }
  }

  async sendWithTemplate(
    to: string,
    subject: string,
    template: string,
    data: any,
  ): Promise<EmailSendResult> {
    if (!this.configService.env.ENABLE_EMAIL_NOTIFICATIONS) {
      this.logger.log(
        `Notificación de correo omitida para ${to} (ENABLE_EMAIL_NOTIFICATIONS=false)`,
      )
      return { sent: false, queued: false }
    }

    // Check global daily email limit
    const canSend = await this.dailyLimitService.canSendEmail()
    if (!canSend) {
      this.logger.warn(
        `Límite diario alcanzado. Encolando correo para ${to} para el siguiente día.`,
      )
      await this.enqueueForNextDay({ to, subject, template, data })
      return { sent: false, queued: true }
    }

    const htmlBody = await this.renderTemplate(template, { ...data, subject })

    await this.sendEmail({
      to,
      subject,
      body: htmlBody,
      isHtml: true,
    })

    return { sent: true, queued: false }
  }

  /**
   * Enqueue an email to be sent the next day at 9 AM
   * when the daily limit has been reached.
   */
  private async enqueueForNextDay(params: {
    to: string
    subject: string
    template: string
    data: Record<string, any>
    retryCount?: number
  }): Promise<void> {
    const jobData: QueuedEmailJob = {
      to: params.to,
      subject: params.subject,
      template: params.template,
      data: params.data,
      originalTimestamp: Date.now(),
      retryCount: (params.retryCount ?? 0) + 1,
    }

    await this.emailQueue.add(
      QUEUE_NAMES.EMAIL_QUEUE.JOBS.SEND_EMAIL,
      jobData,
      {
        jobId: `email-${params.to}-${Date.now()}`,
        delay: this.getMillisecondsUntilNextDayMorning(),
        attempts: 3,
        backoff: {
          type: 'exponential' as const,
          delay: 60000,
        },
      },
    )

    this.logger.log(
      `Email encolado para ${params.to} (intento #${jobData.retryCount}, programado para mañana 9 AM)`,
    )
  }

  /**
   * Get milliseconds until next day 9 AM for scheduled email retry
   */
  private getMillisecondsUntilNextDayMorning(): number {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(9, 0, 0, 0) // 9:00 AM
    return tomorrow.getTime() - now.getTime()
  }

  private async getAccessToken(): Promise<string> {
    const tenantId = this.configService.env.MICROSOFT_TENANT
    const clientId = this.configService.env.MICROSOFT_CLIENT_ID
    const clientSecret = this.configService.env.MICROSOFT_CLIENT_SECRET

    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`

    const data = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials',
    })

    try {
      const response = await lastValueFrom(
        this.httpService.post(tokenUrl, data.toString(), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }),
      )

      return response.data.access_token
    } catch (error: any) {
      this.logger.error(
        'Error obteniendo el token de Microsoft Graph',
        error.response?.data || error.message,
      )
      throw new Error(
        'No se pudo obtener el token de acceso para enviar correos',
      )
    }
  }

  async sendEmail(options: SendEmailOptions): Promise<void> {
    const token = await this.getAccessToken()
    const sender = this.configService.env.MICROSOFT_EMAIL_SENDER

    const sendMailUrl = `https://graph.microsoft.com/v1.0/users/${sender}/sendMail`

    const emailData = {
      message: {
        subject: options.subject,
        body: {
          contentType: options.isHtml !== false ? 'HTML' : 'Text',
          content: options.body,
        },
        toRecipients: [
          {
            emailAddress: {
              address: options.to,
            },
          },
        ],
      },
      saveToSentItems: 'false',
    }

    try {
      await lastValueFrom(
        this.httpService.post(sendMailUrl, emailData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
      )
      this.logger.log(`Correo enviado exitosamente a ${options.to}`)
    } catch (error: any) {
      this.logger.error(
        `Error enviando correo a ${options.to}`,
        error.response?.data || error.message,
      )
      throw new Error('Fallo al enviar el correo a través de Microsoft Graph')
    }
  }
}
