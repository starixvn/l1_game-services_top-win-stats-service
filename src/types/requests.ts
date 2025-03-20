import GameConfig from "./game-config";

type LobbyRequestBody = {
  games: Array<GameConfig>;
};

export { LobbyRequestBody };
