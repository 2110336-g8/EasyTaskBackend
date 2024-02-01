import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Service } from "typedi"; // Assuming you are using a dependency injection library like typedi
import dotenv from 'dotenv';

dotenv.config({ path: './config/config.env' });

interface IAWSS3Service {
  uploadFile(fileBuffer: Buffer, fileName: string, mimetype: string): Promise<any>;
  deleteFile(imageKey: string): Promise<any>;
  getObjectSignedUrl(imageKey: string): Promise<string>;
}

@Service()
export class AWSS3Service implements IAWSS3Service {
  private s3Client: S3Client;

  constructor() {
    const bucketName: string | undefined = process.env.AWS_BUCKET_NAME;
    const region: string | undefined = process.env.AWS_BUCKET_REGION;
    const accessKeyId: string | undefined = process.env.AWS_ACCESS_KEY;
    const secretAccessKey: string | undefined = process.env.AWS_SECRET_ACCESS_KEY;

    if (!bucketName || !region || !accessKeyId || !secretAccessKey) {
      throw new Error("One or more AWS environment variables are missing.");
    }

    this.s3Client = new S3Client({
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      region,
    });
  }

  async uploadFile(fileBuffer: Buffer, fileName: string, mimetype: string): Promise<any> {
    const uploadParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Body: fileBuffer,
      Key: fileName,
      ContentType: mimetype,
    };

    return this.s3Client.send(new PutObjectCommand(uploadParams));
  }

  async deleteFile(imageKey: string): Promise<any> {
    const deleteParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: imageKey,
    };

    return this.s3Client.send(new DeleteObjectCommand(deleteParams));
  }

  async getObjectSignedUrl(imageKey: string): Promise<string> {
    try {
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: imageKey,
      };

      console.log("URL is requested");

      const command = new GetObjectCommand(params);

      const seconds: number = parseInt(process.env.IMAGE_EXPIRE_TIME ?? "3600"); // if there isn't this var in env, it will set to 1 hour
      const url = await getSignedUrl(this.s3Client, command, { expiresIn: seconds });

      return url;
    } catch (error) {
      console.error(error);
      throw new Error('Error getting signed URL');
    }
  }
}

export default AWSS3Service;
