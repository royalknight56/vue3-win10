import { VtronFileInterface } from '@/packages/kernel/file/FIleInterface';
import { VtronFileSystem } from '@/packages/kernel/file/FileSystem';
import { Shell } from '@/packages/kernel/shell/Shell';
import { ShellInterface } from '@/packages/kernel/shell/ShellType';
import { initRootState, RootState } from '@/packages/kernel/state/Root';
import { FileSystemOperations } from '@/packages/kernel/system/fileSystemOperations/FileSystemOperations';
import { Notify, NotifyConstructorOptions } from '@/packages/services/notification/Notification';
import { systemStartup } from '@/packages/startup';
import { Dialog } from '@/packages/ui/dialog/Dialog';
import { Tray, TrayOptions } from '@/packages/ui/tray/Tary';
import { SystemStateEnum } from '@packages/type/enum';
import { Setting, SystemOptions, WinAppOptions } from '@packages/type/type';
import { BrowserWindow, BrowserWindowOption } from '@packages/ui/window/BrowserWindow';
import { markRaw } from 'vue';
import { version } from '../../../../package.json';
import { AppOperations } from './appOperations/AppOperations';
import { ConfigOperations } from './configOperations/ConfigOperations';
import { EventOperations } from './eventOperations/EventOperations';
import { FileOpener, FileOpenerOperations } from './fileOpenerOperations/FileOpenerOperations';
import { defaultConfig } from './initConfig';
import { PowerOperations } from './powerOperations/PowerOperations';

const logger = function (...args: any[]) {
  return;
  if (process.env.NODE_ENV !== 'development') return;
  console.log(...args);
};

export type VtronPlugin = (system: System) => void;

export class Bios {
  public static _onOpen: ((system: System) => void) | null = null;
  public static onOpen(func: (system: System) => void) {
    this._onOpen = func;
  }
  constructor() {
    //
  }
}

/**
 * @description: System 类，在初始化的过程中需要提供挂载点，以及一些配置
 */
export class System {
  public static GLOBAL_SYSTEM: System;

  readonly _options: SystemOptions;

  _rootState: RootState;

  private _ready: ((value: System) => void) | null = null;
  private _error: ((reason: unknown) => void) | null = null;
  version = version;
  isFirstRun = true;
  rootRef: HTMLElement | undefined = undefined;

  get fs() {
    return this.fileSystemOperations.fs;
  }
  _shell!: ShellInterface;

  private fileSystemOperations: FileSystemOperations;
  private appOperations: AppOperations;
  private powerOperations: PowerOperations;
  private configOperations: ConfigOperations;
  private eventOperations: EventOperations;
  private fileOpenerOperations: FileOpenerOperations;

  constructor(options?: SystemOptions) {
    logger('initOptions');
    this._options = this.initOptions(options);

    this.fileSystemOperations = new FileSystemOperations(this._options);
    this.appOperations = new AppOperations(this);
    this.powerOperations = new PowerOperations(this);
    this.configOperations = new ConfigOperations(this);
    this.eventOperations = new EventOperations(this);
    this.fileOpenerOperations = new FileOpenerOperations(this);

    logger('initRootState');
    this._rootState = this.initRootState();
    logger('mountGlobalSystem');
    System.GLOBAL_SYSTEM = this; // 挂载全局系统
    Bios._onOpen && Bios._onOpen(this);

    logger('initSystem');
    this.initSystem();
    logger('firstRun');
    this.firstRun();
  }

  /**
   * @description: pure 初始化配置选项
   */
  private initOptions(options?: SystemOptions) {
    const tempOptions = Object.assign({}, defaultConfig, options);
    return tempOptions;
  }
  /**
   * @description: 获取系统配置
   */
  private initRootState(): RootState {
    return initRootState(this._options);
  }
  /**
   * @description: 初始化系统
   */
  private async initSystem() {
    /**
     * 过程：激活屏幕，桥接事件。
     */
    this._rootState.systemState = SystemStateEnum.opening;

    logger('initFileSystem');
    // await this.initFileSystem(); // 初始化文件系统
    await this.fileSystemOperations.initFileSystem(); // 初始化文件系统
    logger('initSavedConfig');
    await this.configOperations.initSavedConfig(); // 初始化保存的配置
    logger('initShell');
    await this.initShell(); // 初始化shell
    logger('initAppFileFromOption');
    this.appOperations.initAppFileFromOption(); // 初始化配置应用到app文件夹中
    logger('refershApp');
    this.appOperations.refershApp(); // 刷新app文件夹，展示应用
    logger('isLogin');
    this.powerOperations.isLogin(); // 判断是否登录
    logger('initEventListener');
    this.eventOperations.initEventer(); // 初始化事件

    this._ready && this._ready(this);
    logger('runPlugin');
    this.runPlugin(this); // 运行fs中插件

    systemStartup(this); // 系统应用启动

    logger('start');
    this.emit('start');
  }

  replaceFileSystem(fs: VtronFileInterface) {
    // this.fs = fs;
    // this.appOperations.refershApp();
    this.fileSystemOperations.replaceFileSystem(fs);
  }
  mountVolume(path: string, fs: VtronFileInterface) {
    if (this.fs instanceof VtronFileSystem) {
      this.fs.mountVolume(path, fs);
    } else {
      console.error('自定义文件系统不支持挂载卷');
    }
  }
  private async initShell() {
    if (this._options.shell) {
      this._shell = this._options.shell;
    } else {
      this._shell = new Shell(this, '/', 'root');
    }
  }

  setConfig: ConfigOperations['setConfig'] = (key: string, value: any) => {
    return this.configOperations.setConfig(key, value);
  };
  getConfig: ConfigOperations['getConfig'] = (key: string) => {
    return this.configOperations.getConfig(key);
  };

  /**
   * @description: 添加应用
   * force 表示强制，在每次启动时都会添加
   */
  addApp(options: WinAppOptions, force = false) {
    return this.appOperations.addApp(options, force);
  }
  addMagnet(options: WinAppOptions, force = false) {
    return this.appOperations.addMagnet(options, force);
  }
  addMenuList(options: WinAppOptions, force = false) {
    return this.appOperations.addMenuList(options, force);
  }
  refershApp() {
    return this.appOperations.refershApp();
  }

  addBuiltInApp(options: WinAppOptions) {
    this._rootState.windowMap['Builtin'].set(options.name, options);
  }

  createShell(): ShellInterface {
    if (this._options.shell) {
      return this._options.shell;
    } else {
      return new Shell(this, '/', 'root');
    }
  }
  async shell(cmd: string) {
    const shello = this.createShell();
    const cmdArr = cmd.split('\n');
    for (let i = 0; i < cmdArr.length; i++) {
      await shello.exec(cmdArr[i]);
    }
  }
  whenReady(): Promise<System> {
    return new Promise<System>((resolve, reject) => {
      this._ready = resolve;
      this._error = reject;
    });
  }
  firstRun() {
    if (localStorage.getItem('vtronFirstRun')) {
      this.isFirstRun = false;
      return false;
    } else {
      this.isFirstRun = true;
      localStorage.setItem('vtronFirstRun', 'true');
      this.emit('firstRun');
      return true;
    }
  }

  shutdown() {
    return this.powerOperations.shutdown();
  }
  reboot() {
    return this.powerOperations.reboot();
  }
  recover() {
    return this.powerOperations.recover();
  }

  getEventer() {
    return this.eventOperations.getEventer();
  }
  emit(event: string, ...args: any[]) {
    return this.eventOperations.emit(event, ...args);
  }
  emitEvent(event: string, ...args: any[]) {
    return this.eventOperations.emitEvent(event, ...args);
  }
  on(event: string, callback: (...args: any[]) => void): void {
    return this.eventOperations.on(event, callback);
  }
  mountEvent(event: string | string[], callback: (...args: any[]) => void) {
    return this.eventOperations.mountEvent(event, callback);
  }

  offEvent(event?: string, callback?: (...args: any[]) => void): void {
    return this.eventOperations.offEvent(event, callback);
  }

  /** 注册文件打开器 */
  registerFileOpener(type: string | string[], opener: FileOpener) {
    return this.fileOpenerOperations.registerFileOpener(type, opener);
  }
  getOpener(type: string) {
    return this.fileOpenerOperations.getOpener(type);
  }
  getAllFileOpener() {
    return this.fileOpenerOperations.getAllFileOpener();
  }
  /**打开vtron 文件系统的文件 */
  openFile(path: string) {
    return this.fileOpenerOperations.openFile(path);
  }

  /** 注册设置app的设置页面 */
  registerSettingPanel(setting: Setting) {
    const temp = {
      ...setting,
      content: markRaw(setting.content),
    };
    this._rootState.settings?.push(temp);
  }

  // 插件系统
  use(func: VtronPlugin): void {
    return func(this);
  }

  async runPlugin(system: System) {
    const pluginsFile = await this.fs.readdir(`${this._options.systemLocation}plugs`);
    if (pluginsFile) {
      await Promise.all(
        pluginsFile.map(async (file) => {
          const fileContent = await this.fs.readFile(file.path);
          if (file.isFile) {
            const content = fileContent;
            if (content) {
              new Shell(system, '/', 'root').exec('node ' + file.path);
            }
          }
        })
      );
    }
  }
  // 状态序列化和反序列化
  async serializeState(): Promise<string> {
    const serializeFile = await this.fs.serializeFileSystem();
    return JSON.stringify(serializeFile);
  }
  deserializeState(state: string) {
    this.fs.deserializeFileSystem(JSON.parse(state));
  }

  outerFileDropCallback:
    | ((path: string, list: FileList | undefined, process: (path: string) => void) => void)
    | null = null;
  // 当从外部拖入文件时
  onOuterFileDrop(func: (path: string, list: FileList | undefined, process: (path: string) => void) => void) {
    this.outerFileDropCallback = func;
  }
  /** 方便的通过system创建window */
  createWindow(options: BrowserWindowOption) {
    const win = new BrowserWindow(options);
    return win;
  }
  /** 方便的通过system创建notify */
  createNotify(options: NotifyConstructorOptions) {
    return new Notify(options);
  }
  /** 方便的通过system创建Dialog */
  createDialog() {
    return Dialog;
  }
  /** 方便的通过system创建Tray */
  createTray(options: TrayOptions) {
    return new Tray(options);
  }

  errorHandler = 0;
  emitError(error: string) {
    this._error && this._error(error);
    this._rootState.error = error;
    this.errorHandler = Date.now();
    setTimeout(() => {
      if (Date.now() - this.errorHandler > 1000 * 3) {
        this._rootState.error = '';
      }
    }, 1000 * 4);
  }
}
export function useSystem() {
  return System.GLOBAL_SYSTEM!;
}
