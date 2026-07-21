import express from "express";
const router = express.Router();

import { adminLogin, cognitoLogin } from "./routes/auth/login";
import { batchCreateAccounts, register } from "./routes/auth/register";
import { requiresAuth } from "./routes/auth/requiresAuth";
import { createGame } from "./routes/games/createGame";
import { joinGame } from "./routes/games/joinGame";
import { startGame } from "./routes/games/startGame";
import { fetchGame } from "./routes/games/fetchGame";
import { verifyAdminSession, verifySession } from "./routes/auth/sessions";
import { setGlobalHash } from "./routes/auth/setPassword";
import { updateRole } from "./routes/auth/updateRole";
import { updateSurvey } from "./routes/auth/updateSurvey";
import { queryGames, queryUsers, queryEmailMap } from "./routes/data/dataQueries";
import { queryGamesCsvStyle } from "./routes/data/csvQueries";
import { fetchProfile } from "./routes/user/fetchProfile";
import { updateStances } from "./routes/user/updateStances";
import { requiresStudyAuth } from "./routes/auth/requiresStudyAuth";
import { createStudyGame } from "./routes/games/createStudyGame";
import { joinStudyGame } from "./routes/games/joinStudyGame";
import { fetchStudyGame } from "./routes/games/fetchStudyGame";

// * ROUTES

//* Games
router.post('/games', requiresAuth, createGame)
router.post('/games/:gameCode/players', requiresAuth, joinGame)
router.patch('/games/:gameCode', requiresAuth, startGame)
router.get('/games/:gameCode', requiresAuth, fetchGame)

//* Study routes — no Cognito auth, pid supplied via X-Study-Pid header
router.post('/study/games', requiresStudyAuth, createStudyGame)
router.post('/study/games/:gameCode/players', requiresStudyAuth, joinStudyGame)
router.get('/study/games/:gameCode', requiresStudyAuth, fetchStudyGame)
router.post('/survey', async (req, res) => {
  try {
    const { ddbClient } = await import('./dbClient');
    const { PutCommand } = await import('@aws-sdk/lib-dynamodb');
    const pid = req.headers['x-study-pid'] as string || req.body?.surveyData?.pid || 'unknown';
    await ddbClient.send(new PutCommand({
      TableName: 'StudySurveys',
      Item: { pid, ...req.body.surveyData, savedAt: new Date().toISOString() },
    }));
    res.status(200).json({ message: 'saved' });
  } catch (e: any) {
    // Don't fail the participant — just log
    console.error('survey save error:', e.message);
    res.status(200).json({ message: 'ok' });
  }
})

//* Auth
router.post('/sessions', cognitoLogin)
router.post('/users', register)
router.get('/session', requiresAuth, verifySession)
router.post('/users/survey', requiresAuth, updateSurvey)

//* User profile
router.get('/users/profile', requiresAuth, fetchProfile)
router.patch('/users/stances', requiresAuth, updateStances)

//* Admin routes
router.get('/admin/session', requiresAuth, verifyAdminSession)
router.post('/admin/sessions', adminLogin)
router.patch('/admin/passphrase', requiresAuth, setGlobalHash)
router.patch('/admin/users', requiresAuth, updateRole)
router.post('/admin/users', requiresAuth, batchCreateAccounts)

//* Data queries — admin only (FIND-01: require auth + admin role)
router.get('/data/users', requiresAuth, queryUsers)
router.get('/data/games', requiresAuth, queryGames)
router.get('/data/games/csv', requiresAuth, queryGamesCsvStyle)
router.get('/admin/email-map', requiresAuth, queryEmailMap)

//* AI proxy — forwards browser requests to the local Python agent
router.post('/ai/evaluate', async (req, res) => {
  try {
    const response = await fetch('http://127.0.0.1:8000/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    if (!response.ok) {
      res.status(response.status).json({ error: 'AI service error' });
      return;
    }
    res.json(await response.json());
  } catch {
    res.status(503).json({ error: 'AI service unavailable' });
  }
});

export {router}