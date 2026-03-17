import { FtueScreen, GameState, getFtueSnapshot } from "@baseball-sim/game-core";

export function getFtueHref(screen: FtueScreen) {
  switch (screen) {
    case "dashboard":
      return "/" as const;
    case "intro":
      return "/intro" as const;
    case "scouting":
      return "/scouting" as const;
    case "promotion":
      return "/promotion" as const;
    case "lineup":
      return "/lineup" as const;
    case "roster":
      return "/roster" as const;
    case "finances":
      return "/finances" as const;
    case "inbox":
      return "/inbox" as const;
    case "saves":
      return "/saves" as const;
    case "results":
      return "/results" as const;
  }
}

export function getFtueRedirectScreen(game: GameState, screen: FtueScreen) {
  const ftue = getFtueSnapshot(game);
  if (!ftue.isActive || ftue.allowedScreens.includes(screen)) {
    return null;
  }
  return ftue.primaryScreen;
}
