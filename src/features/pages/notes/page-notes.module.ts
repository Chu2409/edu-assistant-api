import { Module } from '@nestjs/common'
import { PageNotesController } from './page-notes.controller'
import { PageNotesService } from './page-notes.service'
import { CoreModule } from 'src/core/core.module'

@Module({
  imports: [CoreModule],
  controllers: [PageNotesController],
  providers: [PageNotesService],
})
export class PageNotesModule {}
