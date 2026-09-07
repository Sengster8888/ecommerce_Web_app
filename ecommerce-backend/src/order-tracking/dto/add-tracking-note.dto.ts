import { IsNotEmpty, IsString, Length } from 'class-validator';

export class AddTrackingNoteDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 255, { message: 'Note must be between 3 and 255 characters long.' })
  note: string;
}
