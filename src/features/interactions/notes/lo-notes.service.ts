import { HttpStatus, Injectable } from '@nestjs/common'
import { BusinessException } from 'src/shared/exceptions/business.exception'
import { DBService } from 'src/core/database/database.service'
import { CreateLoNoteDto } from './dtos/req/create-lo-note.dto'
import { UpdateLoNoteDto } from './dtos/req/update-lo-note.dto'
import { NotesMapper } from './mappers/notes.mapper'
import { NoteDto } from './dtos/res/note.dto'

@Injectable()
export class LoNotesService {
  constructor(private readonly dbService: DBService) {}

  async create(
    userId: number,
    createLoNoteDto: CreateLoNoteDto,
  ): Promise<NoteDto> {
    const note = await this.dbService.note.create({
      data: {
        ...createLoNoteDto,
        userId,
      },
    })
    return NotesMapper.mapToDto(note)
  }

  async update(
    userId: number,
    noteId: number,
    updateLoNoteDto: UpdateLoNoteDto,
  ): Promise<NoteDto> {
    const existingNote = await this.dbService.note.findUnique({
      where: { id: noteId },
    })

    if (!existingNote || existingNote.userId !== userId) {
      throw new BusinessException(
        'No tienes permiso para actualizar esta nota.',
        HttpStatus.FORBIDDEN,
      )
    }

    const updatedNote = await this.dbService.note.update({
      where: { id: noteId },
      data: {
        content: updateLoNoteDto.content,
      },
    })

    return NotesMapper.mapToDto(updatedNote)
  }

  async delete(userId: number, noteId: number): Promise<void> {
    const existingNote = await this.dbService.note.findUnique({
      where: { id: noteId },
    })

    if (!existingNote || existingNote.userId !== userId) {
      throw new BusinessException(
        'No tienes permiso para eliminar esta nota.',
        HttpStatus.FORBIDDEN,
      )
    }

    await this.dbService.note.delete({
      where: { id: noteId },
    })
  }
}
