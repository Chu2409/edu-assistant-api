
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdatePageFeedbackDto {
  @IsString()
  @IsNotEmpty()
  feedback: string;
}
