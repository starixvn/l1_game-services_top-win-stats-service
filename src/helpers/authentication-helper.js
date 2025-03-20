import Axios from "axios";
import { logger } from "sc-common";

import BearerAuthenticator from "./bearer-authenticator";

let authenticationConfigs;
let bearerAuthenticator;

const init = async (configs) => {
  authenticationConfigs = configs;
  bearerAuthenticator = new BearerAuthenticator(configs);

  await bearerAuthenticator.autoUpdateToken();
};

const getRequestConfig = () => {
  if (!bearerAuthenticator) {
    logger.logError("authentication-helper has not been initialized properly.");

    return undefined;
  }

  const defaultRequestTimeout = 2500;
  const { useAuthenticate, requestTimeout } = authenticationConfigs;
  const requestConfigs = {
    timeout: requestTimeout || defaultRequestTimeout,
    headers: {},
  };

  if (useAuthenticate) {
    requestConfigs.headers.Authorization = bearerAuthenticator.token;
  }

  return requestConfigs;
};

const post = async (endpoint, params) => {
  const requestConfigs = getRequestConfig();

  if (!requestConfigs) {
    return {};
  }

  return (await Axios.post(endpoint, params, requestConfigs)).data;
};

const get = async (endpoint) => {
  const requestConfigs = getRequestConfig();

  if (!requestConfigs) {
    return {};
  }

  return (await Axios.get(endpoint, requestConfigs)).data;
};

export default { init, post, get };
