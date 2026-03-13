export const startingLeague = {
  id: "league_arl",
  name: "Atlantic Regional League",
  shortName: "ARL",
  tier: 4,
  region: "Atlantic",
};

export const startingTeams = [
  { id: "team_harbor_city", name: "Harbor City Mariners", nickname: "Mariners", city: "Harbor City" },
  { id: "team_iron_valley", name: "Iron Valley Miners", nickname: "Miners", city: "Iron Valley" },
  { id: "team_bayport", name: "Bayport Sharks", nickname: "Sharks", city: "Bayport" },
  { id: "team_redwood", name: "Redwood Lumberjacks", nickname: "Lumberjacks", city: "Redwood Falls" },
  { id: "team_capital_city", name: "Capital City Senators", nickname: "Senators", city: "Capital City" },
  { id: "team_dockside", name: "Dockside Gulls", nickname: "Gulls", city: "Dockside" },
  { id: "team_pine_ridge", name: "Pine Ridge Rangers", nickname: "Rangers", city: "Pine Ridge" },
  { id: "team_lakefront", name: "Lakefront Waves", nickname: "Waves", city: "Lakefront" }
] as const;
