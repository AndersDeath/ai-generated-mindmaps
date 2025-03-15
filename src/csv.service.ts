import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { AxiosRequestConfig } from 'axios';
import { lastValueFrom } from 'rxjs';
import { parse } from 'csv-parse';

interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

type CsvRow = {
  topic: string;
  subject: string;
};

@Injectable()
export class CsvService {
  constructor() {}

  parse(file: UploadedFile) {
    return new Promise((resolve, reject) => {
      try {
        parse(
          file.buffer,
          {
            delimiter: ',',
          },
          (error, result: CsvRow[]) => {
            if (error) {
              console.error(error);
            }
            result.shift(); // remove titles of csv file
            resolve(result);
          },
        );
      } catch (e: any) {
        reject(new Error(e));
      }
    });
  }
}
