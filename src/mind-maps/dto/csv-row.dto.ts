// import { Transform, TransformFnParams } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';
// import { sanitizeHtml } from 'sanitize-html';

export class CsvRowDto {
  @IsNotEmpty()
  @IsString()
  // @Transform((params: TransformFnParams): string => sanitizeHtml(params.value))
  subject: string;

  @IsNotEmpty()
  @IsString()
  // @Transform((params: TransformFnParams): string => sanitizeHtml(params.value))
  topic: string;
}
