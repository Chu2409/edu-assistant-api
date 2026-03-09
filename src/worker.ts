import { NestFactory } from '@nestjs/core'
import { Logger } from '@nestjs/common'
import { WorkerModule } from './worker.module'

async function bootstrapWorker() {
  await NestFactory.createApplicationContext(WorkerModule)

  Logger.log('Worker started', 'Worker')
}

void bootstrapWorker()
