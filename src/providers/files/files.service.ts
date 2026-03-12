import { Injectable } from '@nestjs/common'
import * as fs from 'fs'
import * as path from 'path'

@Injectable()
export class FilesService {
  /**
   * Generates the URL to access the uploaded file.
   * @param file - The uploaded file object from Multer
   * @returns An object containing the URL of the uploaded file
   */
  uploadFile(file: Express.Multer.File) {
    // Assuming the file is saved in the './uploads' directory configured in the module
    // The relative URL to access the file via the static file server
    const fileUrl = `/uploads/${file.filename}`

    return {
      url: fileUrl,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    }
  }

  /**
   * (Optional) Helper to delete a file if needed
   * @param filename
   */
  async deleteFile(filename: string): Promise<void> {
    const uploadDir = path.join(process.cwd(), 'uploads')
    const filePath = path.join(uploadDir, filename)

    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath)
    }
  }
}
