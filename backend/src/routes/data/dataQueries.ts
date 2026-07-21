import { Request, Response } from "express";
import { ddbClient } from "../../dbClient";
import { ScanCommand } from "@aws-sdk/client-dynamodb";

/* =========================
   Shared helpers  (unchanged)
   ========================= */

const isAttrVal = (v: any) =>
  v &&
  typeof v === "object" &&
  (v.S !== undefined ||
    v.N !== undefined ||
    v.M !== undefined ||
    v.L !== undefined ||
    v.BOOL !== undefined ||
    v.NULL !== undefined);

const decodeAttr = (v: any): any => {
  if (v == null) return v;
  if (!isAttrVal(v)) return v;
  if (v.S !== undefined) return v.S;
  if (v.N !== undefined) return Number(v.N);
  if (v.BOOL !== undefined) return Boolean(v.BOOL);
  if (v.NULL) return null;
  if (v.L !== undefined) return v.L.map(decodeAttr);
  if (v.M !== undefined) {
    const out: Record<string, any> = {};
    for (const k of Object.keys(v.M)) out[k] = decodeAttr(v.M[k]);
    return out;
  }
  return v;
};

const getS = (v: any): string | null => {
  if (!v && v !== 0) return null;
  if (!isAttrVal(v)) return typeof v === "string" ? v : String(v);
  if (v.S !== undefined) return v.S;
  if (v.N !== undefined) return String(v.N);
  return null;
};

const getM = (v: any): Record<string, any> | null => (v && v.M ? v.M : null);

const parseDateMs = (v: any): number => {
  const raw = isAttrVal(v)
    ? v.S ?? (v.N !== undefined ? String(v.N) : null)
    : v;
  if (raw == null) return 0;
  const t = new Date(String(raw)).getTime();
  return Number.isFinite(t) ? t : 0;
};

const toChicago = (ms: number): string => {
  if (!Number.isFinite(ms) || ms <= 0) return "";
  const d = new Date(ms);
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Chicago",
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZoneName: "short",
    }).format(d);
  } catch {
    return d.toISOString();
  }
};

/* =========================
   Users: GET /users/sorted-lightweight
   Returns: userId (anonymous), affiliation, reason, createdAt, gameHistory
   NOTE: email is no longer stored in this table after migration.
         Identifying info lives exclusively in UserEmailMap table.
   ========================= */
export const queryUsers = async (req: Request, res: Response) => {
  // FIND-01: defence-in-depth admin check (middleware already verifies auth)
  if (!req.user || (req.user as any).role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  try {
    const TableName = "Users";

    // email intentionally excluded — use queryEmailMap (admin only) if needed
    const ProjectionExpression =
      "#uid, #createdAt, #gameHistory, surveyData.affiliation, surveyData.reason";
    const ExpressionAttributeNames = {
      "#uid": "userId",
      "#createdAt": "createdAt",
      "#gameHistory": "gameHistory",
    };

    const items: any[] = [];
    let ExclusiveStartKey: Record<string, any> | undefined;

    do {
      const page = await ddbClient.send(
        new ScanCommand({
          TableName,
          ProjectionExpression,
          ExpressionAttributeNames,
          ExclusiveStartKey,
        })
      );
      if (page.Items) items.push(...page.Items);
      ExclusiveStartKey = page.LastEvaluatedKey;
    } while (ExclusiveStartKey);

    const shaped = items
      .map((it) => {
        const survey = getM(it.surveyData);
        const createdMs = parseDateMs(it.createdAt);

        return {
          userId: getS(it.userId),           // anonymous ID only
          affiliation: survey ? getS(survey.affiliation) : null,
          reason: survey ? getS(survey.reason) : null,
          createdAt: createdMs ? toChicago(createdMs) : null,
          gameHistory: decodeAttr(it.gameHistory) ?? [],
          _sortKey: createdMs,
        };
      })
      .sort((a, b) => b._sortKey - a._sortKey)
      .map(({ _sortKey, ...rest }) => rest);

    res.json(shaped);
  } catch (err) {
    console.error("Failed to fetch users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

/* =========================
   Email Map: GET /admin/email-map
   Returns: userId -> email mapping from the isolated UserEmailMap table.
   IMPORTANT: This route must be protected by admin auth middleware.
              It should never be exposed to research data consumers.
   ========================= */
export const queryEmailMap = async (_req: Request, res: Response) => {
  try {
    const TableName = "UserEmailMap";

    const items: any[] = [];
    let ExclusiveStartKey: Record<string, any> | undefined;

    do {
      const page = await ddbClient.send(
        new ScanCommand({ TableName, ExclusiveStartKey })
      );
      if (page.Items) items.push(...page.Items);
      ExclusiveStartKey = page.LastEvaluatedKey;
    } while (ExclusiveStartKey);

    const shaped = items.map((it) => ({
      email: getS(it.email),
      userId: getS(it.userId),
    }));

    res.json(shaped);
  } catch (err) {
    console.error("Failed to fetch email map:", err);
    res.status(500).json({ error: "Failed to fetch email map" });
  }
};

/* =========================
   Games: GET /games/sorted  (unchanged)
   ========================= */
export const queryGames = async (req: Request, res: Response) => {
  // FIND-01: defence-in-depth admin check (middleware already verifies auth)
  if (!req.user || (req.user as any).role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  try {
    const TableName = "Games";

    const ProjectionExpression =
      "#gid, #code, #date, #players, #topic, #gameLog, #aiEvaluations";
    const ExpressionAttributeNames = {
      "#gid": "gameId",
      "#code": "code",
      "#date": "date",
      "#players": "players",
      "#topic": "topic",
      "#gameLog": "gameLog",
      "#aiEvaluations": "aiEvaluations",
    };

    const items: any[] = [];
    let ExclusiveStartKey: Record<string, any> | undefined;

    do {
      const page = await ddbClient.send(
        new ScanCommand({
          TableName,
          ProjectionExpression,
          ExpressionAttributeNames,
          ExclusiveStartKey,
        })
      );
      if (page.Items) items.push(...page.Items);
      ExclusiveStartKey = page.LastEvaluatedKey;
    } while (ExclusiveStartKey);

    const shaped = items
      .map((it) => {
        const createdMs = parseDateMs(it.date);
        return {
          gameId: getS(it.gameId),
          gameCode: getS(it.code),
          date: createdMs ? toChicago(createdMs) : null,
          players: decodeAttr(it.players) ?? [],
          topic: decodeAttr(it.topic) ?? null,
          gameLog: decodeAttr(it.gameLog) ?? [],
          aiEvaluations: decodeAttr(it.aiEvaluations) ?? [],
          _sortKey: createdMs,
        };
      })
      .sort((a, b) => b._sortKey - a._sortKey)
      .map(({ _sortKey, ...rest }) => rest);

    res.json(shaped);
  } catch (err) {
    console.error("Failed to fetch games:", err);
    res.status(500).json({ error: "Failed to fetch games" });
  }
};
