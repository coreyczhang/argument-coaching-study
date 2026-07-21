// migrate-anonymize.ts
// Run ONCE from project root: npx ts-node migrate-anonymize.ts
// Scans Users table, assigns each user a UUID, writes email->UUID
// into UserEmailMap, then removes email from Users.

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

dotenv.config();

const { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = process.env;
if (!AWS_REGION || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
  throw new Error("Missing AWS credentials in .env");
}

const ddbClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({
    region: AWS_REGION,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
  })
);

const USERS_TABLE = "Users";
const MAP_TABLE = "UserEmailMap";

async function run() {
  let ExclusiveStartKey: Record<string, any> | undefined;
  let migrated = 0;
  let skipped = 0;

  do {
    const page = await ddbClient.send(
      new ScanCommand({
        TableName: USERS_TABLE,
        ProjectionExpression: "userId, email",
      })
    );

    for (const item of page.Items ?? []) {
      const userId = item.userId;
      const email = item.email;

      if (!userId) { console.warn("Item missing userId, skipping:", item); skipped++; continue; }
      if (!email)  { console.log(`userId ${userId} already has no email, skipping`); skipped++; continue; }

      const anonId = uuidv4();

      // 1. Write to isolated mapping table
      try {
        await ddbClient.send(
          new PutCommand({
            TableName: MAP_TABLE,
            Item: { email, userId, anonId },
            ConditionExpression: "attribute_not_exists(email)",
          })
        );
      } catch (e: any) {
        if (e.name === "ConditionalCheckFailedException") {
          console.log(`Mapping already exists for ${email}, skipping map write`);
        } else {
          throw e;
        }
      }

      // 2. Remove email from Users row
      await ddbClient.send(
        new UpdateCommand({
          TableName: USERS_TABLE,
          Key: { userId },
          UpdateExpression: "REMOVE #email",
          ExpressionAttributeNames: { "#email": "email" },
        })
      );

      console.log(`Migrated: ${email} -> userId ${userId}, anonId ${anonId}`);
      migrated++;
    }

    ExclusiveStartKey = page.LastEvaluatedKey;
  } while (ExclusiveStartKey);

  console.log(`\nDone. Migrated: ${migrated}, Skipped: ${skipped}`);
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
