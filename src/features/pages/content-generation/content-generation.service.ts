import { Injectable } from '@nestjs/common'
import { DBService } from 'src/core/database/database.service'

@Injectable()
export class ContentGenerationService {
  constructor(private readonly dbService: DBService) {}
}
