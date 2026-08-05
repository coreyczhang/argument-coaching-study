// src/sockets/gameplay.ts
import { Server, Socket } from "socket.io";
import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddbClient } from "../dbClient";
import { Tile } from "../models/Tile";
import type { AiEvaluationRecord, GameActionType } from "../models/Game";
import { placeScriptedAiReply, AI_USER_ID } from "./aiCoplayer";

async function updateWithOptionalLog(opts: {
  gameId: string;
  // if provided, append to gameLog; if omitted, no logging
  log?: { type: GameActionType; actorRole: string };
  aiEvaluation?: AiEvaluationRecord;
  setClauses?: string[]; // e.g. ["gameBoard.#t.#txt = :txt"]
  names?: Record<string, string>; // ExpressionAttributeNames
  values?: Record<string, any>; // ExpressionAttributeValues
}) {
  const { gameId, log, aiEvaluation, setClauses = [], names = {}, values = {} } = opts;

  const setParts: string[] = [...setClauses];

  if (log) {
    setParts.push(
      "gameLog = list_append(if_not_exists(gameLog, :empty), :logEntry)"
    );
  }

  if (aiEvaluation) {
    setParts.push(
      "aiEvaluations = list_append(if_not_exists(aiEvaluations, :empty), :aiEvaluationEntry)"
    );
  }

  if (setParts.length === 0) {
    return;
  }

  const updateCommand: any = {
    TableName: "Games",
    Key: { gameId },
    UpdateExpression: `SET ${setParts.join(", ")}`,
    ExpressionAttributeValues: {
      ":empty": [],
      ...(log ? { ":logEntry": [log] } : {}),
      ...(aiEvaluation ? { ":aiEvaluationEntry": [aiEvaluation] } : {}),
      ...values,
    },
  };

  if (Object.keys(names).length > 0) {
    updateCommand.ExpressionAttributeNames = names;
  }

  await ddbClient.send(new UpdateCommand(updateCommand));
}

async function fetchGameSnapshot(gameId: string) {
  const response = await ddbClient.send(
    new GetCommand({
      TableName: "Games",
      Key: { gameId },
    })
  );

  return response.Item as
    | {
        topic?: { text?: string };
        gameBoard?: Record<string, Tile>;
        aiConfig?: { enabled?: boolean; condition?: string };
      }
    | undefined;
}

async function requestAiFeedback(tile: Tile, gameId: string) {
  const game = await fetchGameSnapshot(gameId);
  const gameBoard = game?.gameBoard ?? {};
  const topic = game?.topic?.text ?? "";
  const aiEnabled = game?.aiConfig?.enabled ?? true;

  if (!aiEnabled || !tile.text.trim() || !topic.trim()) {
    return null;
  }

  try {
    const response = await fetch("http://127.0.0.1:8000/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tile, game_board: gameBoard, topic }),
      signal: AbortSignal.timeout(45000),
    });

    if (response.ok) return response.json();
  } catch {
    // Python service unavailable — fall through to mock
  }

  // Mock feedback for demo / when Python service is not running
  const mockResponses = [
    {
      errors_found: true,
      display_feedback: true,
      feedback: "Your argument is on the right track! Try adding a concrete example or statistic to make it more convincing.",
      suggestion: tile.text + " — for example, studies show that...",
      first_wave_categories: ["needs_more_detail"],
      error_types: ["clarification_needed"],
      schema_version: "mock-1.0",
      model_name: "demo-mock",
      pipeline_mode: "mock",
      prompt_versions: {},
    },
    {
      errors_found: true,
      display_feedback: true,
      feedback: "Good point! Consider narrowing the scope — broad claims are harder to defend than specific ones.",
      suggestion: "In many cases, " + tile.text.charAt(0).toLowerCase() + tile.text.slice(1),
      first_wave_categories: ["too_broad"],
      error_types: ["overgeneralization"],
      schema_version: "mock-1.0",
      model_name: "demo-mock",
      pipeline_mode: "mock",
      prompt_versions: {},
    },
    {
      errors_found: true,
      display_feedback: true,
      feedback: "Strong start — try connecting this more directly to the real-world impact so it's harder to dismiss.",
      suggestion: tile.text + ", which directly affects everyday people.",
      first_wave_categories: ["needs_clearer_connection"],
      error_types: ["irrelevant_rebuttal"],
      schema_version: "mock-1.0",
      model_name: "demo-mock",
      pipeline_mode: "mock",
      prompt_versions: {},
    },
  ];
  return mockResponses[Math.floor(Math.random() * mockResponses.length)];
}

export default function gameplayHandlers(io: Server, socket: Socket) {
  const gameCode = socket.data.gameCode as string;
  const gameId = socket.data.gameId as string;
  const userId = socket.data.user.userId as string;
  const actorRole: string =
    (socket.data.user && (socket.data.user.role as string)) ||
    (socket.data.role as string) ||
    "unknown";

  // PLACE_TILE
  socket.on("placeTile", async (tile: Tile) => {
    try {
      await updateWithOptionalLog({
        gameId,
        log: { type: "PLACE_TILE", actorRole },
        setClauses: [
          "gameBoard.#new = :tile",
          "gameBoard.#parent.children = list_append(gameBoard.#parent.children, :childId)",
        ],
        names: {
          "#new": tile.tileId,
          "#parent": tile.parentId!,
        },
        values: {
          ":tile": tile,
          ":childId": [tile.tileId],
        },
      });

      io.in(gameCode).emit("placeTile", { userId, tile });
    } catch (err) {
      console.error("placeTile error:", err);
      socket.emit("error", { message: "Could not place tile" });
    }
  });

  // REMOVE_TILE — delete an empty, unconfirmed child tile so it stops blocking a branch
  socket.on("removeTile", async ({ tileId }: { tileId: string }) => {
    try {
      // Never allow removing the root (0) or the four fixed reason tiles (1–4)
      if (["0", "1", "2", "3", "4"].includes(tileId)) return;

      const game = await fetchGameSnapshot(gameId);
      const board = (game?.gameBoard ?? {}) as Record<string, Tile>;
      const tile = board[tileId];
      if (!tile) return;
      // Only remove if it's genuinely empty, unconfirmed, and has no children
      if (tile.confirmed || (tile.text && tile.text.trim()) || (tile.children && tile.children.length)) {
        return;
      }

      const parentId = tile.parentId;
      const parent = parentId ? board[parentId] : undefined;
      const newChildren = (parent?.children ?? []).filter((c) => c !== tileId);

      await ddbClient.send(
        new UpdateCommand({
          TableName: "Games",
          Key: { gameId },
          UpdateExpression: parentId
            ? "REMOVE gameBoard.#t SET gameBoard.#parent.children = :children"
            : "REMOVE gameBoard.#t",
          ExpressionAttributeNames: parentId
            ? { "#t": tileId, "#parent": parentId }
            : { "#t": tileId },
          ...(parentId ? { ExpressionAttributeValues: { ":children": newChildren } } : {}),
        })
      );

      io.in(gameCode).emit("removeTile", { userId, tileId, parentId });
    } catch (err) {
      console.error("removeTile error:", err);
    }
  });

  // typingTile (NOT in GameActionType) => no log, just emit (no DB writes needed)
  socket.on(
    "typingTile",
    async ({
      tileId,
      partialText,
    }: {
      tileId: string;
      partialText: string;
    }) => {
      try {
        io.in(gameCode).emit("typingTile", {
          userId,
          tileId,
          partialText,
        });
      } catch (err) {
        console.error("typingTile error:", err);
      }
    }
  );

  // CONFIRM_TILE
  socket.on(
    "confirmTile",
    async ({ tileId, text }: { tileId: string; text: string }) => {
      try {
        const normalizedText = text.trim();
        await updateWithOptionalLog({
          gameId,
          log: { type: "CONFIRM_TILE", actorRole },
          setClauses: [
            "gameBoard.#t.#txt = :txt",
            "gameBoard.#t.#conf = :confTrue",
          ],
          names: {
            "#t": tileId,
            "#txt": "text",
            "#conf": "confirmed",
          },
          values: {
            ":txt": normalizedText,
            ":confTrue": true,
          },
        });

        io.in(gameCode).emit("confirmTile", {
          userId,
          tileId,
          text: normalizedText,
        });

        try {
          const game = await fetchGameSnapshot(gameId);
          const confirmedTile = game?.gameBoard?.[tileId];
          if (!confirmedTile) {
            socket.emit("aiFeedback", { errors_found: false, display_feedback: false });
            return;
          }
          const parentTile = confirmedTile.parentId
            ? game?.gameBoard?.[confirmedTile.parentId]
            : undefined;

          const aiFeedback = await requestAiFeedback(confirmedTile, gameId);
          if (aiFeedback) {
            await updateWithOptionalLog({
              gameId,
              log: { type: "AI_FEEDBACK", actorRole },
              aiEvaluation: {
                tileId,
                tileText: confirmedTile.text,
                parentText: parentTile?.text ?? null,
                userId,
                actorRole,
                topic: game?.topic?.text ?? null,
                schemaVersion: aiFeedback.schema_version ?? undefined,
                modelName: aiFeedback.model_name ?? null,
                pipelineMode: aiFeedback.pipeline_mode ?? null,
                promptVersions: aiFeedback.prompt_versions ?? {},
                errorTypes: aiFeedback.error_types ?? [],
                firstWaveCategories: aiFeedback.first_wave_categories ?? [],
                errorsFound: Boolean(aiFeedback.errors_found),
                feedback: aiFeedback.feedback ?? null,
                suggestion: aiFeedback.suggestion ?? null,
                suggestionSource: aiFeedback.suggestion_source ?? null,
                suggestionConfidence: aiFeedback.suggestion_confidence ?? null,
                suggestionPreservesStance:
                  typeof aiFeedback.suggestion_preserves_stance === "boolean"
                    ? aiFeedback.suggestion_preserves_stance
                    : null,
                feedbackShown: Boolean(aiFeedback.display_feedback ?? aiFeedback.errors_found),
                experimentCondition: game?.aiConfig?.condition ?? null,
                structure: aiFeedback.structure ?? {},
                reasoning: aiFeedback.reasoning ?? {},
                clarify: aiFeedback.clarify ?? {},
                createdAt: new Date().toISOString(),
              },
            });
            socket.emit("aiFeedback", aiFeedback);
          } else {
            socket.emit("aiFeedback", { errors_found: false, display_feedback: false });
          }
        } catch (aiErr) {
          console.error("ai evaluation error:", aiErr);
          // Always resolve the reading indicator even on error
          socket.emit("aiFeedback", { errors_found: false, display_feedback: false });
        }

        // Scripted AI co-player: in a solo-vs-AI round, reply to the human's tile
        // with a canned rebuttal so the round feels interactive without the agent.
        // (When the agent is funded, the live co-player does this instead.)
        try {
          if (userId !== AI_USER_ID) {
            const game = await fetchGameSnapshot(gameId);
            const board = (game?.gameBoard ?? {}) as Record<string, Tile>;
            const humanTile = board[tileId];
            if ((game as any)?.isAiGame && humanTile?.player) {
              const aiRole = humanTile.player === "plus" ? "minus" : "plus";
              await placeScriptedAiReply({
                io, gameCode, gameId, board, humanTileId: tileId, aiRole,
              });
            }
          }
        } catch (coErr) {
          console.error("scripted co-player error:", coErr);
        }
      } catch (err) {
        console.error("confirmTile error:", err);
        socket.emit("error", { message: "Could not save tile text" });
      }
    }
  );

  // PLACE_EMOJI
  socket.on(
    "placeEmoji",
    async ({ tileId, emoji }: { tileId: string; emoji: string }) => {
      try {
        await updateWithOptionalLog({
          gameId,
          log: { type: "PLACE_EMOJI", actorRole },
          setClauses: ["gameBoard.#t.#emoji = :emoji"],
          names: {
            "#t": tileId,
            "#emoji": "emoji",
          },
          values: {
            ":emoji": emoji,
          },
        });

        io.in(gameCode).emit("placeEmoji", { userId, tileId, emoji });
      } catch (err) {
        console.error("placeEmoji error:", err);
        socket.emit("error", { message: "Could not place emoji" });
      }
    }
  );

  // UNDO PLACE EMOJI
  socket.on(
    "undoPlaceEmoji",
    async ({ tileId }: { tileId: string }) => {
      try {
        await updateWithOptionalLog({
          gameId,
          log: { type: "UNDO_PLACE_EMOJI", actorRole },
          setClauses: ["gameBoard.#t.#emoji = :emoji"],
          names: {
            "#t": tileId,
            "#emoji": "emoji",
          },
          values: {
            ":emoji": null,
          },
        });

        io.in(gameCode).emit("undoPlaceEmoji", { userId, tileId });
      } catch (err) {
        console.error("undoPlaceEmoji error:", err);
        socket.emit("error", { message: "Could not undo place emoji" });
      }
    }
  );

  // REVISE_TOPIC_PROPOSAL (no DB state change; just log the intent)
  socket.on("reviseTopicProposal", async (topic: string) => {
    try {
      await updateWithOptionalLog({
        gameId,
        log: { type: "REVISE_TOPIC_PROPOSAL", actorRole },
      });

      io.in(gameCode).emit("reviseTopicProposal", { userId, topic });
    } catch (err) {
      console.error("reviseTopicProposal error:", err);
      socket.emit("error", { message: "Could not revise topic proposal" });
    }
  });

  // REJECT_TOPIC_PROPOSAL (no DB state change; just log)
  socket.on("rejectTopicProposal", async () => {
    try {
      await updateWithOptionalLog({
        gameId,
        log: { type: "REJECT_TOPIC_PROPOSAL", actorRole },
      });

      io.in(gameCode).emit("rejectTopicProposal", { userId });
    } catch (err) {
      console.error("rejectTopicProposal error:", err);
      socket.emit("error", { message: "Could not reject topic proposal" });
    }
  });

  // REVISE_TOPIC
  socket.on("reviseTopic", async (topic: string) => {
    try {
      await updateWithOptionalLog({
        gameId,
        log: { type: "REVISE_TOPIC", actorRole },
        setClauses: ["topic = :topic"],
        values: {
          ":topic": {
            text: topic,
            revised: true,
          },
        },
      });

      // (Your client currently expects just the string)
      io.in(gameCode).emit("reviseTopic", topic);
    } catch (err) {
      console.error("reviseTopic error:", err);
      socket.emit("error", { message: "Could not revise topic" });
    }
  });

  socket.on(
    "emojiResolutionOpened",
    ({
      userId,
      tileId,
      emoji,
    }: {
      userId: string;
      tileId: string;
      emoji: string;
    }) => {
      try {
        socket.to(gameCode).emit("emojiResolutionOpened", {
          userId,
          tileId,
          emoji,
        });
      } catch (err) {
        console.error("emojiResolutionOpened error:", err);
      }
    }
  );

  socket.on(
    "emojiResolutionTyping",
    ({
      userId,
      tileId,
      emoji,
    }: {
      userId: string;
      tileId: string;
      emoji: string;
    }) => {
      try {
        socket.to(gameCode).emit("emojiResolutionTyping", {
          userId,
          tileId,
          emoji,
        });
      } catch (err) {
        console.error("emojiResolutionTyping error:", err);
      }
    }
  );

  socket.on(
    "emojiResolutionSubmit",
    ({
      userId,
      tileId,
      emoji,
      submission,
    }: {
      userId: string;
      tileId: string;
      emoji: string;
      submission: string;
    }) => {
      try {
        socket.to(gameCode).emit("emojiResolutionSubmit", {
          userId,
          tileId,
          emoji,
          submission,
        });
      } catch (err) {
        console.error("emojiResolutionSubmit error:", err);
      }
    }
  );

  socket.on(
    "emojiResolutionClosed",
    ({
      userId,
      tileId,
      emoji,
    }: {
      userId: string;
      tileId: string;
      emoji: string;
    }) => {
      try {
        socket.to(gameCode).emit("emojiResolutionClosed", {
          userId,
          tileId,
          emoji,
        });
      } catch (err) {
        console.error("emojiResolutionClosed error:", err);
      }
    }
  );

  socket.on(
    "emojiResolutionRejected",
    ({
      userId,
      tileId,
      emoji,
    }: {
      userId: string;
      tileId: string;
      emoji: string;
    }) => {
      try {
        socket.to(gameCode).emit("emojiResolutionRejected", {
          userId,
          tileId,
          emoji,
        });
      } catch (err) {
        console.error("emojiResolutionRejected error:", err);
      }
    }
  );

  //* PLACE_RULE_CARD
  // socket.on(
  //   "placeRuleCard",
  //   async ({ tileId, card }: { tileId: string; card: string }) => {
  //     try {
  //       await updateWithOptionalLog({
  //         gameId,
  //         log: { type: "PLACE_RULE_CARD", actorRole },
  //         setClauses: [
  //           "gameBoard.#t.#card = :card",
  //           "gameBoard.#t.revised = :revised",
  //           "gameBoard.#t.#conf = :confFalse",
  //         ],
  //         names: {
  //           "#t": tileId,
  //           "#card": "ruleCard",
  //           "#conf": "confirmed",
  //         },
  //         values: {
  //           ":card": card,
  //           ":revised": false,
  //           ":confFalse": false,
  //         },
  //       });

  //       io.in(gameCode).emit("placeRuleCard", { userId, tileId, card });
  //     } catch (err) {
  //       console.error("placeRuleCard error:", err);
  //       socket.emit("error", { message: "Could not place rule card" });
  //     }
  //   }
  // );

  //* REVISE_TILE
  // socket.on(
  //   "reviseTile",
  //   async ({ tileId, text }: { tileId: string; text: string }) => {
  //     try {
  //       await updateWithOptionalLog({
  //         gameId,
  //         log: { type: "REVISE_TILE", actorRole },
  //         setClauses: [
  //           "gameBoard.#t.#txt = :txt",
  //           "gameBoard.#t.revised = :revised",
  //           "gameBoard.#t.#conf = :confTrue",
  //         ],
  //         names: {
  //           "#t": tileId,
  //           "#txt": "text",
  //           "#conf": "confirmed",
  //         },
  //         values: {
  //           ":txt": text,
  //           ":revised": true,
  //           ":confTrue": true,
  //         },
  //       });

  //       io.in(gameCode).emit("reviseTile", { userId, tileId, text });
  //     } catch (err) {
  //       console.error("editTile error:", err);
  //       socket.emit("error", { message: "Could not edit tile" });
  //     }
  //   }
  // );
}
