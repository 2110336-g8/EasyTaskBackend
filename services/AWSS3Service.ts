import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from 'dotenv';

dotenv.config({path :'./config/config.env'});

const bucketName: string | undefined = process.env.AWS_BUCKET_NAME;
const region: string | undefined = process.env.AWS_BUCKET_REGION;
const accessKeyId: string | undefined = process.env.AWS_ACCESS_KEY;
const secretAccessKey: string | undefined = process.env.AWS_SECRET_ACCESS_KEY;

if (!bucketName || !region || !accessKeyId || !secretAccessKey) {
  throw new Error("One or more AWS environment variables are missing.");
}

const s3Client = new S3Client({
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  region,
});


export async function uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    mimetype: string
  ): Promise<any> {
    const uploadParams = {
      Bucket: bucketName,
      Body: fileBuffer,
      Key: fileName,
      ContentType: mimetype,
    };
  
    return s3Client.send(new PutObjectCommand(uploadParams));
  }
  
  export async function deleteFile(imageKey: string): Promise<any> {
    const deleteParams = {
      Bucket: bucketName,
      Key: imageKey,
    };
  
    return s3Client.send(new DeleteObjectCommand(deleteParams));
  }
  
  
export async function getObjectSignedUrl(imageKey: string): Promise<string> {
    try {
        const params = {
            Bucket: bucketName,
            Key: imageKey,
        };

        console.log("URL is requested");
        
        const command = new GetObjectCommand(params);

        const seconds: number = parseInt(process.env.IMAGE_EXPIRE_TIME ?? "3600"); // if there isn't this var in env, it will set to 1 hour
        const url = await getSignedUrl(s3Client, command, { expiresIn: seconds });

        return url;
    } catch (error) {
        console.error(error);
        throw new Error('Error getting signed URL');
    }
}

export default { uploadFile, deleteFile, getObjectSignedUrl };
