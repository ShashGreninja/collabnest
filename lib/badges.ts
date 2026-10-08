import { DifficultyTag, Role } from "@/types/leaderboard";

// Status is read as Prisma writes it (IN_PROGRESS), which does not match the
// spelling in types/leaderboard.ts, so only CLOSED is ever compared here.
type BadgeProject = {
  status: string;
  difficultyTag: DifficultyTag;
  requirementTags: string[];
};

export type BadgeCtx = {
  role: Role;
  applications: { id: string }[];
  projectCreated: { status: string }[];
  projectsParticipated: { project: BadgeProject }[];
  messageCount: number;
  assignedSubtaskCount: number;
  memberScores: number[];
  isRankOne: boolean;
};

export type BadgeResult = {
  key: string;
  name: string;
  description: string;
  earned: boolean;
  awardedAt?: string;
  progress?: { current: number; target: number };
};

type BadgeRule = {
  key: string;
  name: string;
  description: string;
  tier?: number;
  transient?: boolean;
  evaluate: (ctx: BadgeCtx) => boolean;
  progress?: (ctx: BadgeCtx) => { current: number; target: number };
};

const COMMUNICATOR_MESSAGES = 20;
const CONSISTENT_SCORE = 8;
const CONSISTENT_PROJECTS = 3;

const COMPLETION_TIERS = [
  { key: "soldier", name: "Soldier", count: 1 },
  { key: "knight", name: "Knight", count: 2 },
  { key: "commander", name: "Commander", count: 3 },
  { key: "master", name: "Master", count: 5 },
  { key: "grandmaster", name: "Grandmaster", count: 10 },
];

const DOMAINS = [
  { key: "ml", name: "ML Enthusiast", tags: ["AI", "ML", "DataScience"] },
  { key: "dev", name: "Dev Enthusiast", tags: ["WebDev", "MobileDev", "Design"] },
  {
    key: "research",
    name: "Research Enthusiast",
    tags: ["Robotics", "Embedded", "IoT", "Networking", "Cybersecurity", "Blockchain"],
  },
];

function completed(ctx: BadgeCtx) {
  return ctx.projectsParticipated.filter((p) => p.project.status === "CLOSED");
}

const completionRules: BadgeRule[] = COMPLETION_TIERS.map((tier, index) => ({
  key: tier.key,
  name: tier.name,
  description:
    tier.count === 1
      ? "Finished a project successfully"
      : `Finished ${tier.count} projects successfully`,
  tier: index,
  evaluate: (ctx) => completed(ctx).length >= tier.count,
  progress: (ctx) => ({ current: completed(ctx).length, target: tier.count }),
}));

const domainRules: BadgeRule[] = DOMAINS.map((domain) => ({
  key: domain.key,
  name: domain.name,
  description: `Completed a project tagged ${domain.tags.slice(0, 2).join(" or ")}`,
  evaluate: (ctx) =>
    completed(ctx).some((p) =>
      p.project.requirementTags.some((tag) => domain.tags.includes(tag))
    ),
}));

export const BADGES: BadgeRule[] = [
  ...completionRules,
  ...domainRules,
  {
    key: "deep-diver",
    name: "Deep Diver",
    description: "Completed an advanced project",
    evaluate: (ctx) => completed(ctx).some((p) => p.project.difficultyTag === "ADVANCED"),
  },
  {
    key: "newcomer",
    name: "Not so new!",
    description: "Applied to a project",
    evaluate: (ctx) => ctx.applications.length > 0,
  },
  {
    key: "mentor",
    name: "Mentor Apprentice",
    description: "Mentored a project to completion",
    evaluate: (ctx) =>
      ctx.role === "PROFESSOR" && ctx.projectCreated.some((p) => p.status === "CLOSED"),
  },
  {
    key: "novice",
    name: "Novice",
    description: "Assigned to a project task",
    evaluate: (ctx) => ctx.assignedSubtaskCount > 0,
  },
  {
    key: "flawless",
    name: "Flawless",
    description: "Scored a perfect 10 on a project",
    evaluate: (ctx) => ctx.memberScores.includes(10),
  },
  {
    key: "consistent",
    name: "Consistent",
    description: `Scored ${CONSISTENT_SCORE} or above on ${CONSISTENT_PROJECTS} projects`,
    evaluate: (ctx) =>
      ctx.memberScores.filter((score) => score >= CONSISTENT_SCORE).length >=
      CONSISTENT_PROJECTS,
    progress: (ctx) => ({
      current: ctx.memberScores.filter((score) => score >= CONSISTENT_SCORE).length,
      target: CONSISTENT_PROJECTS,
    }),
  },
  {
    key: "top-dawg",
    name: "Top Dawg!",
    description: "Ranked first on the contributor leaderboard",
    // Stops being true the moment someone overtakes, so it is never persisted.
    transient: true,
    evaluate: (ctx) => ctx.isRankOne,
  },
  {
    key: "communicator",
    name: "Communicator",
    description: `Sent ${COMMUNICATOR_MESSAGES} messages in project chats`,
    evaluate: (ctx) => ctx.messageCount >= COMMUNICATOR_MESSAGES,
    progress: (ctx) => ({
      current: ctx.messageCount,
      target: COMMUNICATOR_MESSAGES,
    }),
  },
];

function toBadge(
  rule: BadgeRule,
  ctx: BadgeCtx,
  awardedAt: Record<string, string>
): BadgeResult {
  return {
    key: rule.key,
    name: rule.name,
    description: rule.description,
    earned: rule.evaluate(ctx),
    awardedAt: awardedAt[rule.key],
    progress: rule.progress?.(ctx),
  };
}

// Transient badges are left out so a stored award never contradicts the rule.
export function earnedBadgeKeys(ctx: BadgeCtx): string[] {
  return BADGES.filter((rule) => !rule.transient && rule.evaluate(ctx)).map(
    (rule) => rule.key
  );
}

export function evaluateBadges(
  ctx: BadgeCtx,
  awardedAt: Record<string, string> = {}
): BadgeResult[] {
  const tiered = BADGES.filter((rule) => rule.tier !== undefined).map((rule) =>
    toBadge(rule, ctx, awardedAt)
  );
  const rest = BADGES.filter((rule) => rule.tier === undefined).map((rule) =>
    toBadge(rule, ctx, awardedAt)
  );

  // Only the highest tier reached is worth showing, otherwise Grandmaster sits
  // next to Soldier and means nothing. With none earned, show the first as a target.
  const earnedTiers = tiered.filter((badge) => badge.earned);
  const currentTier = earnedTiers.length ? earnedTiers[earnedTiers.length - 1] : tiered[0];

  return [currentTier, ...rest].sort((a, b) => Number(b.earned) - Number(a.earned));
}
