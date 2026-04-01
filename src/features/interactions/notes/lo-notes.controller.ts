import {
  Body,
  Controller,
  Delete,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common'
import { GetUser } from 'src/features/auth/decorators/get-user.decorator'
import { LoNotesService } from './lo-notes.service'
import { CreateLoNoteDto } from './dtos/req/create-lo-note.dto'
import { UpdateLoNoteDto } from './dtos/req/update-lo-note.dto'
import { NoteDto } from './dtos/res/note.dto'
import {
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { JwtAuth } from 'src/features/auth/decorators/jwt-auth.decorator'
import { Role } from 'src/core/database/generated/enums'

@ApiTags('Page Notes')
@Controller('pages/notes')
@JwtAuth(Role.STUDENT)
export class LoNotesController {
  constructor(private readonly pageNotesService: LoNotesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear nota personal' })
  @ApiResponse({
    status: 201,
    description: 'La nota ha sido creada exitosamente',
    type: NoteDto,
  })
  async create(
    @GetUser('id') userId: number,
    @Body() createPageNoteDto: CreateLoNoteDto,
  ): Promise<NoteDto> {
    return this.pageNotesService.create(userId, createPageNoteDto)
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar nota' })
  @ApiResponse({
    status: 200,
    description: 'La nota ha sido actualizada exitosamente',
    type: NoteDto,
  })
  @ApiForbiddenResponse({
    description: 'No tienes permiso para actualizar esta nota.',
  })
  @ApiNotFoundResponse({ description: 'Nota no encontrada.' })
  async update(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) noteId: number,
    @Body() updatePageNoteDto: UpdateLoNoteDto,
  ): Promise<NoteDto> {
    return this.pageNotesService.update(userId, noteId, updatePageNoteDto)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar nota' })
  @ApiResponse({
    status: 200,
    description: 'La nota ha sido eliminada exitosamente.',
  })
  @ApiForbiddenResponse({
    description: 'No tienes permiso para eliminar esta nota.',
  })
  @ApiNotFoundResponse({ description: 'Nota no encontrada.' })
  async delete(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) noteId: number,
  ): Promise<void> {
    return this.pageNotesService.delete(userId, noteId)
  }
}
