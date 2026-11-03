import { randomInt, randomUUID } from "node:crypto";
import ApiError from "./ApiError.js";

export const LOGIN_OTP_TTL_SECONDS = 120;
export const MAX_LOGIN_OTP_RESENDS = 3;
export const LOGIN_OTP_RESEND_COOLDOWN_SECONDS = 300;

const challenges = new Map();
const accountChallenges = new Map();

const removeExpiredChallenges = () => {
  const now = Date.now();
  for (const [challengeId, challenge] of challenges) {
    if (challenge.expiresAt <= now && (!challenge.cooldownUntil || challenge.cooldownUntil <= now)) {
      challenges.delete(challengeId);
      if (accountChallenges.get(challenge.accountId) === challengeId) {
        accountChallenges.delete(challenge.accountId);
      }
    }
  }
};

export function issueLoginOtp(accountId, email, resendCount = 0) {
  removeExpiredChallenges();
  const existingChallengeId = accountChallenges.get(accountId);
  const existingChallenge = challenges.get(existingChallengeId);
  const now = Date.now();
  if (
    existingChallenge &&
    (existingChallenge.expiresAt > now ||
      (existingChallenge.cooldownUntil && existingChallenge.cooldownUntil > now))
  ) {
    return {
      challengeId: existingChallengeId,
      code: existingChallenge.code,
      email,
      expiresAt: existingChallenge.expiresAt,
      resendCount: existingChallenge.resendCount,
      resendsRemaining: MAX_LOGIN_OTP_RESENDS - existingChallenge.resendCount,
      cooldownUntil: existingChallenge.cooldownUntil,
    };
  }

  const challengeId = randomUUID();
  const code = String(randomInt(0, 1000000)).padStart(6, "0");
  const expiresAt = now + LOGIN_OTP_TTL_SECONDS * 1000;
  const cooldownUntil =
    resendCount >= MAX_LOGIN_OTP_RESENDS
      ? now + LOGIN_OTP_RESEND_COOLDOWN_SECONDS * 1000
      : null;

  challenges.set(challengeId, { accountId, code, expiresAt, resendCount, cooldownUntil });
  accountChallenges.set(accountId, challengeId);

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
    if (!challenge.cooldownUntil || challenge.cooldownUntil <= Date.now()) {
      challenges.delete(challengeId);
      if (accountChallenges.get(challenge.accountId) === challengeId) {
        accountChallenges.delete(challenge.accountId);
      }
    }
    throw new ApiError(410, "This authentication code has expired. Request a new one");
  }

  if (challenge.code !== submittedCode) {
    throw new ApiError(400, "This authentication code is invalid");
  }

  challenges.delete(challengeId);
  if (accountChallenges.get(challenge.accountId) === challengeId) {
    accountChallenges.delete(challenge.accountId);
  }
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
  if (accountChallenges.get(challenge.accountId) === challengeId) {
    accountChallenges.delete(challenge.accountId);
  }
  return {
    accountId: challenge.accountId,
    resendCount:
      challenge.resendCount >= MAX_LOGIN_OTP_RESENDS ? 1 : challenge.resendCount + 1,
  };
}
