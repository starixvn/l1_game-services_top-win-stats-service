const getSupportedGames = () => {
  return [{ id: 113, name: "rocketx" }];
};

const OperationType: { [key: string]: string } = {
  INSERT: "insert" as const,
};

const getRoundCollection = (gameName: string) => {
  return `${gameName}_rounds`;
};

const getResultCollection = (gameName: string) => {
  return `${gameName}_results`;
};

const getBetLogCollection = (gameName: string) => {
  return `${gameName}_betlogs`;
};

const getTopRoundCollectionName = (gameName: string, timeFrame: string) => {
  return `${gameName}_top_round_${timeFrame}`;
};

const getTopResultArchiveCollection = (gameName: string, timeFrame: string) => {
  return `${gameName}_top_result_archive_${timeFrame}`;
};

export {
  getRoundCollection,
  getResultCollection,
  getBetLogCollection,
  getTopRoundCollectionName,
  getTopResultArchiveCollection,
  OperationType,
  getSupportedGames,
};
