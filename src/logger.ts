import dayjs from 'dayjs';
import { blue, gray, green, red, yellow } from 'kolorist';
import { PLUGIN_NAME } from './constants';

/**
 * 日志
 */
export class Logger {
  private tag = PLUGIN_NAME;
  private withTime = true;

  constructor(tag: string, withTime?: boolean) {
    this.tag = `[${tag}]`;
    this.withTime = withTime ?? true;
  }

  private getTime() {
    return `${this.withTime ? dayjs().format('HH:mm:ss') : ''} `;
  }

  /**
   * 调试
   */
  debug(msg: any, ...rest: unknown[]) {
    console.log(`${this.getTime()}${gray(this.tag)}`, msg, ...rest);
  }

  /**
   *  调试日志 等同 debug
   */
  log(msg: any, ...rest: unknown[]) {
    this.debug(msg, ...rest);
  }

  info(msg: any, ...rest: unknown[]) {
    console.log(`${this.getTime()}${blue(this.tag)}`, msg, ...rest);
  }

  warn(msg: string, ...rest: unknown[]) {
    console.log(`${this.getTime()}${yellow(this.tag)}`, msg, ...rest);
  }

  error(msg: any, ...rest: unknown[]) {
    console.log(`${this.getTime()}${red(this.tag)}`, msg, ...rest);
  }

  success(msg: any, ...rest: unknown[]) {
    console.log(`${this.getTime()}${green(this.tag)}`, msg, ...rest);
  }
}

export const createLogger = (tag?: string) => {
  return new Logger(tag || PLUGIN_NAME, true);
};
