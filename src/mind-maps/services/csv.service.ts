import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';

import { ParserRow, write, parseString } from 'fast-csv';
import { createWriteStream } from 'fs';
import { EOL } from 'os';
import { join } from 'path';
import { CsvRowDto } from '../dto/csv-row.dto';
import { UploadedCsvFile } from '../models/files.model';

@Injectable()
export class CsvService {
  constructor() {}

  parse(
    file: UploadedCsvFile,
  ): Promise<{ results: CsvRowDto[]; errors: string[] }> {
    return new Promise((resolve, reject) => {
      try {
        const results: CsvRowDto[] = [];
        const errors: string[] = [];

        parseString(file.buffer.toString().split('\n').join(EOL), {
          headers: true,
        })
          .on('error', (error) => reject(error))
          .on('data', async (row: CsvRowDto) => {
            const rowDto = plainToInstance(CsvRowDto, row);

            const validationErrors = await validate(rowDto);
            if (validationErrors.length > 0) {
              errors.push(
                `Row ${JSON.stringify(row)} is invalid: ${validationErrors.reduce((acc: string, error: ValidationError) => acc + ' ' + error.toString() || '', '')}`,
              );
            } else {
              results.push(row);
            }
          })
          .on('end', () => resolve({ results, errors }));
      } catch (e: any) {
        reject(new Error(e));
      }
    });
  }

  generateCsv(data: ParserRow[]): Promise<string> {
    return new Promise((resolve) => {
      const filePath = join(__dirname, 'temp.csv');
      const writeStream = createWriteStream(filePath);
      write(data, { headers: true })
        .pipe(writeStream)
        .on('finish', () => {
          resolve(filePath);
        });
    });
  }
}
