import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { DBService } from 'src/core/database/database.service'
import { SYSTEM_CONFIG_KEYS } from 'src/shared/constants/configurations'

@Injectable()
export class AuthConfigService implements OnModuleInit {
  private readonly logger = new Logger(AuthConfigService.name)
  private teacherEmails: string[] = []

  constructor(private dbService: DBService) {}

  async onModuleInit() {
    try {
      const setting = await this.dbService.systemSetting.findUnique({
        where: { key: SYSTEM_CONFIG_KEYS.TEACHER_EMAILS },
      })
      if (setting && setting.value) {
        this.teacherEmails = setting.value as string[]
      } else {
        await this.dbService.systemSetting.create({
          data: {
            key: SYSTEM_CONFIG_KEYS.TEACHER_EMAILS,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            value: [] as any,
            description: 'Lista global de correos de profesores',
          },
        })
      }
    } catch (e) {
      this.logger.error('Error loading TEACHER_EMAILS config from DB', e)
    }
  }

  getTeacherEmails(): string[] {
    return [...this.teacherEmails]
  }

  async setTeacherEmails(emails: string[]): Promise<string[]> {
    const normalized = emails
      .map((e) => e.toLowerCase().trim())
      .filter((e) => !!e)

    this.teacherEmails = Array.from(new Set(normalized))

    await this.dbService.systemSetting.upsert({
      where: { key: SYSTEM_CONFIG_KEYS.TEACHER_EMAILS },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      update: { value: this.teacherEmails as any },
      create: {
        key: SYSTEM_CONFIG_KEYS.TEACHER_EMAILS,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        value: this.teacherEmails as any,
        description: 'Lista global de correos de profesores',
      },
    })

    return this.getTeacherEmails()
  }
}
