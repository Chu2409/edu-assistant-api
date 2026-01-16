
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreatePageFeedbackDto {
  @IsNumber()
  @IsNotEmpty()
  pageId: number;

  @IsString()
  @IsNotEmpty()
  feedback: string;
}
