import { Injectable } from '@nestjs/common';

import { parse } from 'csv-parse';
import { ParserRow, write } from 'fast-csv';
import { createWriteStream } from 'fs';
import { join } from 'path';

interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

@Injectable()
export class CsvService {
  constructor() {}

  parse(file: UploadedFile): Promise<{ subject: string; topic: string }[]> {
    // TODO: Rewrite parser to fast-csv
    return new Promise((resolve, reject) => {
      try {
        parse(
          file.buffer,
          {
            delimiter: ',',
          },
          (error, result: string[]) => {
            if (error) {
              console.error(error);
            }
            result.shift(); // remove titles of csv file

            resolve(
              result.reduce(
                (acc, strArr) => {
                  acc.push({ subject: strArr[0], topic: strArr[1] });
                  return acc;
                },
                [] as { subject: string; topic: string }[],
              ),
            );
          },
        );
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
