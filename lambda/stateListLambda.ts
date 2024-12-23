import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const BUCKET_NAME = process.env.BUCKET_NAME;
const REGION = process.env.AWS_REGION || 'us-east-1';

if (!BUCKET_NAME) {
    throw new Error('Environment variable BUCKET_NAME is not defined');
}

// Create an S3 client
const s3Client = new S3Client({ region: REGION });

export const handler = async (event: any, context: any) => {
    try {
        console.log('Bucket Name:', BUCKET_NAME);
        console.log('AWS Region:', REGION);
        console.log("event : ",event);
        console.log('context:', context);
        console.log('RequestId:', context.awsRequestId);

        // Fetch data from API
        const response = await axios.get('https://jsonplaceholder.typicode.com/posts/1/comments');
        const stateList = response.data;

        // Prepare upload parameters
        const params = {
            Bucket: BUCKET_NAME,
            Key: 'stateList.json',
            Body: JSON.stringify(stateList),
            ContentType: 'application/json',
        };

        // Upload file to S3
        const upload = new Upload({
            client: s3Client,
            params,
        });

        await upload.done();
        console.log('File uploaded to S3');
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
};
