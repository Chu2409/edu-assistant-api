import { Module } from '@nestjs/common'
import { MulterModule } from '@nestjs/platform-express'
import { diskStorage } from 'multer'
import { extname } from 'path'
import * as fs from 'fs'
import { FilesController } from './files.controller'
import { FilesService } from './files.service'
import { v4 as uuidv4 } from 'uuid'

@Module({
  imports: [
    MulterModule.registerAsync({
      useFactory: () => {
        const uploadDir = './uploads'

        // Create the uploads directory if it does not exist
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true })
        }

        return {
          storage: diskStorage({
            destination: (req, file, cb) => {
              cb(null, uploadDir)
            },
            filename: (req, file, cb) => {
              // Generate a unique filename using UUID and preserve the original extension
              const uniqueSuffix = uuidv4()
              const ext = extname(file.originalname)
              cb(null, `${uniqueSuffix}${ext}`)
            },
          }),
          // Optional: limits and fileFilter can be added here
          limits: {
            fileSize: 10 * 1024 * 1024, // 10MB limit
          },
        }
      },
    }),
  ],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}
