export type RequirementMode = 'solo' | 'team';
export type TeamNeedType = 'players' | 'opponent';
export type PlayerRole = 'batter' | 'bowler' | 'spinner' | 'all_rounder' | 'wicket_keeper';

export type PublishedRequirement = {
  id: string;
  mode: RequirementMode;
  city?: string;
  availableDays?: string[];
  availableTime?: string;
  createdAt: string;
  soloRole?: PlayerRole;
  soloNote?: string;
  teamName?: string;
  teamNeedType?: TeamNeedType;
  matchDate?: string;
  matchTime?: string;
  matchLocation?: string;
  playersNeeded?: number;
  requiredRoles?: PlayerRole[];
  teamNote?: string;
};

const publishedRequirements: PublishedRequirement[] = [];

export const addRequirement = (requirement: PublishedRequirement) => {
  publishedRequirements.unshift(requirement);
};

export const getRequirements = () => {
  return [...publishedRequirements];
};
