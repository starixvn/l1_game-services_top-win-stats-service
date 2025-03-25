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

const getBetLogCollectionName = (gameName: string) => {
  return `${gameName}_betlogs`;
};

const getTempBetLogCollectionName = (gameName: string) => {
  return `${gameName}_tmpbetlogs`;
};

const getTopRoundCollectionName = (gameName: string, timeFrame: string) => {
  return `${gameName}_top_round_${timeFrame}`;
};

const getTopCashoutPointCollectionName = (gameName: string, timeFrame: string) => {
  return `${gameName}_top_cashout_point_${timeFrame}`;
};

export {
  getRoundCollection,
  getResultCollection,
  getBetLogCollectionName,
  getTempBetLogCollectionName,
  getTopRoundCollectionName,
  getTopCashoutPointCollectionName,
  OperationType,
  getSupportedGames,
};
