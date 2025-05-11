import Logger from '@tomjs/logger';
import { PLUGIN_NAME } from './constants';

export function createLogger() {
  return new Logger({
    prefix: `[${PLUGIN_NAME}]`,
    time: true,
  });
}
