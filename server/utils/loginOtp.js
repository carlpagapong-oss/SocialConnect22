import { randomInt, randomUUID } from "node:crypto";
import ApiError from "./ApiError.js";

export const LOGIN_OTP_TTL_SECONDS = 120;
export const MAX_LOGIN_OTP_RESENDS = 3;
export const LOGIN_OTP_RESEND_COOLDOWN_SECONDS = 300;

const challenges = new Map();

const removeExpiredChallenges = () => {
  const now = Date.now();
  for (const [challengeId, challenge] of challenges) {
    if (challenge.expiresAt <= now) challenges.delete(challengeId);
  }
};

export function issueLoginOtp(accountId, email, resendCount = 0) {
  removeExpiredChallenges();
  const challengeId = randomUUID();
  const code = String(randomInt(0, 1000000)).padStart(6, "0");
  const expiresAt = Date.now() + LOGIN_OTP_TTL_SECONDS * 1000;
  const cooldownUntil =
    resendCount >= MAX_LOGIN_OTP_RESENDS
      ? Date.now() + LOGIN_OTP_RESEND_COOLDOWN_SECONDS * 1000
      : null;

  challenges.set(challengeId, { accountId, code, expiresAt, resendCount, cooldownUntil });

  return {
    challengeId,
    code,
    email,
    expiresAt,
    resendCount,
    resendsRemaining: MAX_LOGIN_OTP_RESENDS - resendCount,
    cooldownUntil,
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
  if (challenge.resendCount >= MAX_LOGIN_OTP_RESENDS) {
    const retryAfter = Math.max(0, Math.ceil((challenge.cooldownUntil - Date.now()) / 1000));
    if (retryAfter > 0) {
      throw new ApiError(
        429,
        "You have reached the maximum of 3 code requests. Try again in 5 minutes",
        { retryAfter },
      );
    }
  }

  challenges.delete(challengeId);
  return {
    accountId: challenge.accountId,
    resendCount:
      challenge.resendCount >= MAX_LOGIN_OTP_RESENDS ? 1 : challenge.resendCount + 1,
  };
}
