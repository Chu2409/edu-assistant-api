import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreatePageFeedbackDto {
  @ApiProperty({
    description: 'El ID de la página a la que pertenece el feedback',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  pageId: number;

  @ApiProperty({
    description: 'El contenido del feedback',
    example: 'Este es un feedback de prueba',
  })
  @IsString()
  @IsNotEmpty()
  feedback: string;
}
