import { NetscriptPort, NS } from '@ns';

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'EPOCH';
export class Logger {
  public logPort: number;
  protected ns: NS;
  protected name?: string;
  protected _epoch: string;
  constructor(ns: NS, logName: string = '') {
    this.ns = ns;
    this.logPort = 20;
    this.name = logName ? logName : '';
    this._epoch = '';
  }
  get epoch() {
    this._epoch = Date.now().toString();
    return `${this.colors.CYAN}${this._epoch}${this.colors.RESET}`;
  }
  protected colors = {
    BLACK: '\u001b[30m',
    WHITE: '\u001B[37m',
    RED: '\u001B[31m',
    GREEN: '\u001b[32m',
    MAGENTA: '\u001b[35m',
    CYAN: '\u001b[36m',
    YELLOW: '\u001B[33m',
    BLUE: '\u001B[34m',
    GREY: '\x1b[38;5;15m',
    SLATE_BLUE: '\x1b[38;5;33m',
    DEFAULT_GREEN: '\x1b[38;5;40m',
    DARK_BROWN: '\x1b[38;5;100m',
    RED_BG: '\x1b[41m',
    RESET: '\u001B[0m',
  };
  /**
   *
   * @param level The log level to add color to
   *
   * Level corresponds to the {@link colors} object.
   * @returns A formatted string containing the log level with the designated color applied, depending on the level
   *
   * Example: {red_background}[ERROR]{color_reset}
   */
  protected colorByLevel(level: string): string {
    let color: string = '';
    switch (level) {
      case 'info': {
        color = this.colors.BLUE;
        break;
      }
      case 'warn': {
        color = this.colors.YELLOW;
        break;
      }
      case 'error': {
        color = this.colors.RED;
        break;
      }
      case 'debug': {
        color = this.colors.CYAN;
        break;
      }
      default: {
        color = this.colors.DEFAULT_GREEN;
        break;
      }
    }
    return color;
  }
  /**
   *
   * @returns Generated timestamp and UNIX timestamp for logging purposes.
   */
  protected ts() {
    const today: Date = new Date();
    const year: string = today.getFullYear().toString().padStart(4, '0');
    const month: string = `${today.getMonth() + 1}`.toString().padStart(2, '0');
    const day: string = today.getDate().toString().padStart(2, '0');
    const hour: string = today.getHours().toString().padStart(2, '0');
    const minute: string = today.getMinutes().toString().padStart(2, '0');
    const second: string = today.getSeconds().toString().padStart(2, '0');
    const millis: string = today.getMilliseconds().toString().padStart(3, '0');
    return `> ${year}-${month}-${day} ${hour}:${minute}:${second}.${millis} - `;
  }
  protected msg(level: LogLevel, _msg: string) {
    const logTsFormat = this.ts();

    const logTsFormatStr: string = `${this.colors.GREY}${logTsFormat}`;
    const logLevelFormatStr: string = `${this.colorByLevel(level.toLowerCase())}[${level}]`;
    const logNameFormatStr: string = this.name?.length ? ` ${this.colors.YELLOW}(${this.name})` : ``;
    const logMsgFormatStr: string = ` ${this.colors.WHITE}${_msg}`;
    const ptrFormatStr: string = `${this.colors.WHITE}> `;

    return `${logTsFormatStr}${logLevelFormatStr}${logNameFormatStr}${ptrFormatStr}${logMsgFormatStr}${this.colors.RESET}`;
  }
  protected log(level: LogLevel, msg: string, args: Array<object | string>): void {
    const port: NetscriptPort = this.ns.getPortHandle(this.logPort);
    for (let i = 0; i < args.length; i++) {
      if (!Array.isArray(args[i])) {
        args[i] = `${this.colors.SLATE_BLUE}${JSON.stringify(args[i], null, 4)}`;
      } else {
        args[i] = `${this.colors.SLATE_BLUE}${JSON.stringify(args[i], null, 2)}`;
      }
      msg = `${msg}\n${args[i]}`;
    }
    const data: string = this.msg(level, msg);
    port.tryWrite(data);
  }
  info(msg: string, ...args: Array<object | string>): void {
    this.log('INFO', msg, args);
  }
  warn(msg: string, ...args: Array<object | string>): void {
    this.log('WARN', msg, args);
  }
  error(msg: string, ...args: Array<object | string>): void {
    this.log('ERROR', msg, args);
  }
  debug(msg: string, ...args: Array<object | string>): void {
    this.log('DEBUG', msg, args);
  }
}
