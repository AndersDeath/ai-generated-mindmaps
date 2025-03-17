import { IsNotEmpty, IsString } from 'class-validator';

export class CsvRowDto {
  @IsNotEmpty()
  @IsString()
  subject: string;

  @IsNotEmpty()
  @IsString()
  topic: string;
}
