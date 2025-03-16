import { Injectable } from '@nestjs/common';

import { parse } from 'csv-parse';
import { write } from 'fast-csv';
import { createWriteStream } from 'fs';
import { join } from 'path';
import fs from 'fs';
interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

// type CsvRow = {
//   topic: string;
//   subject: string;
// };

@Injectable()
export class CsvService {
  constructor() {}

  parse(file: UploadedFile): Promise<{ subject: string; topic: string }[]> {
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

  generateCsv(res: any) {
    const data = [
      { name: 'John Doe', email: 'john@example.com' },
      { name: 'Jane Doe', email: 'jane@example.com' },
    ];

    const filePath = join(__dirname, 'temp.csv');
    const writeStream = createWriteStream(filePath);

    write(data, { headers: true })
      .pipe(writeStream)
      .on('finish', () => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        res.download(filePath, 'data.csv', (err) => {
          if (err) {
            console.error('Error downloading file:', err);
          }
          fs.unlinkSync(filePath);
        });
      });
  }
}
