import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { Readable } from 'stream';

@Injectable()
export class R2Service {
  private s3: S3Client;
  private bucket: string;
  private publicUrl: string;

  constructor(private config: ConfigService) {
    this.s3 = new S3Client({
      region: 'auto',
      endpoint: config.get<string>('R2_ENDPOINT')!,
      credentials: {
        accessKeyId: config.get<string>('R2_ACCESS_KEY_ID')!,
        secretAccessKey: config.get<string>('R2_SECRET_ACCESS_KEY')!,
      },
    });
    this.bucket = config.get<string>('R2_BUCKET_NAME')!;
    this.publicUrl = config.get<string>('R2_PUBLIC_URL')!;
  }

  async uploadFile(key: string, buffer: Buffer, mimeType: string): Promise<string> {
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      }),
    );
    return `${this.publicUrl}/${key}`;
  }

  async deleteFile(key: string): Promise<void> {
    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }

  async getFileStream(key: string): Promise<Readable> {
    const response = await this.s3.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
    return response.Body as Readable;
  }
}
