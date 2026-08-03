import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import dotenv from "dotenv";

dotenv.config();

const { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = process.env;
if (!AWS_REGION) {
  throw new Error("AWS_REGION must be set");
}

// Use explicit keys if provided (local dev); otherwise fall back to the default
// AWS credential chain — i.e. the EC2 instance role when running on Elastic
// Beanstalk. This avoids storing long-lived keys in the environment.
const dynamoDbClient = new DynamoDBClient({
  region: AWS_REGION,
  ...(AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY
    ? { credentials: { accessKeyId: AWS_ACCESS_KEY_ID, secretAccessKey: AWS_SECRET_ACCESS_KEY } }
    : {}),
});

export const ddbClient = DynamoDBDocumentClient.from(dynamoDbClient)