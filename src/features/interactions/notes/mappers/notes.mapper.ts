import { Note } from 'src/core/database/generated/client'
import { NoteDto } from '../dtos/res/note.dto'

export class NotesMapper {
  static mapToDto(note: Note): NoteDto {
    return {
      id: note.id,
      learningObjectId: note.learningObjectId,
      userId: note.userId,
      content: note.content,
      createdAt: note.createdAt,
    }
  }
}
