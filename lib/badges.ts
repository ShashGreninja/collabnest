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
  isRankOne: boolean;
};

export type BadgeResult = {
  key: string;
  name: string;
  description: string;
  earned: boolean;
  progress?: { current: number; target: number };
};

type BadgeRule = {
  key: string;
  name: string;
  description: string;
  tier?: number;
  evaluate: (ctx: BadgeCtx) => boolean;
  progress?: (ctx: BadgeCtx) => { current: number; target: number };
};

const COMMUNICATOR_MESSAGES = 20;

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
    key: "top-dawg",
    name: "Top Dawg!",
    description: "Ranked first on the contributor leaderboard",
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

function toBadge(rule: BadgeRule, ctx: BadgeCtx): BadgeResult {
  return {
    key: rule.key,
    name: rule.name,
    description: rule.description,
    earned: rule.evaluate(ctx),
    progress: rule.progress?.(ctx),
  };
}

export function evaluateBadges(ctx: BadgeCtx): BadgeResult[] {
  const tiered = BADGES.filter((rule) => rule.tier !== undefined).map((rule) =>
    toBadge(rule, ctx)
  );
  const rest = BADGES.filter((rule) => rule.tier === undefined).map((rule) =>
    toBadge(rule, ctx)
  );

  // Only the highest tier reached is worth showing, otherwise Grandmaster sits
  // next to Soldier and means nothing. With none earned, show the first as a target.
  const earnedTiers = tiered.filter((badge) => badge.earned);
  const currentTier = earnedTiers.length ? earnedTiers[earnedTiers.length - 1] : tiered[0];

  return [currentTier, ...rest].sort((a, b) => Number(b.earned) - Number(a.earned));
}
