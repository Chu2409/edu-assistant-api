import { Module } from '@nestjs/common'
import { LoTypesService } from './lo-types.service'
import { LoTypesController } from './lo-types.controller'
import { AuthModule } from 'src/features/auth/auth.module'

@Module({
  imports: [AuthModule],
  controllers: [LoTypesController],
  providers: [LoTypesService],
  exports: [LoTypesService],
})
export class LoTypesModule {}
