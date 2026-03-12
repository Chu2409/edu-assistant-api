import { Controller, Post, UseInterceptors, UploadedFile } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { FilesService } from './files.service'
import { ApiTags, ApiConsumes, ApiBody, ApiOperation } from '@nestjs/swagger'
import { ApiStandardResponse } from 'src/shared/decorators/api-standard-response.decorator'
import { UploadedFileDto } from './dtos/uploaded-file.dto'

@ApiTags('Files')
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload a file (e.g., an image)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  @ApiStandardResponse(UploadedFileDto)
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.filesService.uploadFile(file)
  }
}
