import { randomInt, randomUUID } from "node:crypto";
import ApiError from "./ApiError.js";

export const LOGIN_OTP_TTL_SECONDS = 120;

const challenges = new Map();

const removeExpiredChallenges = () => {
  const now = Date.now();
  for (const [challengeId, challenge] of challenges) {
    if (challenge.expiresAt <= now) challenges.delete(challengeId);
  }
};

export function issueLoginOtp(accountId, email) {
  removeExpiredChallenges();
  const challengeId = randomUUID();
  const code = String(randomInt(0, 1000000)).padStart(6, "0");
  const expiresAt = Date.now() + LOGIN_OTP_TTL_SECONDS * 1000;

  challenges.set(challengeId, { accountId, code, expiresAt });

  return {
    challengeId,
    code,
    email,
    expiresAt,
  };
}

export function verifyLoginOtp(challengeId, submittedCode) {
  const challenge = challenges.get(challengeId);
  if (!challenge) throw new ApiError(400, "This authentication code is invalid");

  if (challenge.expiresAt <= Date.now()) {
    challenges.delete(challengeId);
    throw new ApiError(410, "This authentication code has expired. Request a new one");
  }

  if (challenge.code !== submittedCode) {
    throw new ApiError(400, "This authentication code is invalid");
  }

  challenges.delete(challengeId);
  return challenge.accountId;
}

export function resendLoginOtp(challengeId) {
  const challenge = challenges.get(challengeId);
  if (!challenge) throw new ApiError(400, "This authentication session is invalid");

  if (challenge.expiresAt > Date.now()) {
    throw new ApiError(400, "You can request a new code after the current one expires");
  }

  challenges.delete(challengeId);
  return challenge.accountId;
}
