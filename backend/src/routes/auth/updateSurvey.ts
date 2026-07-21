import { Request, Response } from "express";
import { ddbClient } from "../../dbClient";
import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

export const updateSurvey: any = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const surveyData = req.body.surveyData;

    if (!surveyData || typeof surveyData !== 'object') {
      return res.status(400).json({ 
        message: "Invalid survey data. Must provide 'surveyData' as an object." 
      });
    }

    const getCommand = new GetCommand({
      TableName: "Users",
      Key: {
        userId: userId
      }
    });

    const getUserResponse = await ddbClient.send(getCommand);
    
    if (getUserResponse.Item?.surveyData) {
      return res.status(409).json({ 
        message: "Survey data already exists for this user. Cannot overwrite existing survey.",
        existingSurveyData: getUserResponse.Item.surveyData
      });
    }

    const updateCommand = new UpdateCommand({
      TableName: "Users",
      Key: {
        userId: userId
      },
      UpdateExpression: "SET surveyData = :surveyData",
      ConditionExpression: "attribute_not_exists(surveyData)",
      ExpressionAttributeValues: {
        ":surveyData": surveyData
      },
      ReturnValues: "ALL_NEW"
    });

    const response = await ddbClient.send(updateCommand);

    return res.status(200).json({ 
      message: "Survey data saved successfully",
      user: response.Attributes
    });

  } catch (error: any) {
    if (error.name === 'ConditionalCheckFailedException') {
      return res.status(409).json({ 
        message: "Survey data already exists for this user. Cannot overwrite existing survey."
      });
    }
    return res.status(500).json({ message: error.message });
  }
};

