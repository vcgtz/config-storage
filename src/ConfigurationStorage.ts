import os from 'os';
import path from 'path';
import fsPromises from 'fs/promises'

interface Configuration {
  [key: string]: any;
}

class ConfigurationStorage {
  private homedirPath: string;
  private configFilePath: string;
  private configFolderName: string;
  private configFolderPath: string;
  private configFileName: string;
  private data: Configuration;

  private constructor(storageName: string) {
    this.homedirPath = os.homedir();
    this.configFolderName = this.parseFolderName(storageName);
    this.configFileName = 'config.json';
    this.configFolderPath = path.join(this.homedirPath, this.configFolderName);
    this.configFilePath = path.join(this.configFolderPath, this.configFileName);
    this.data = {};
  }

  static async getStorage(configFolderName: string): Promise<ConfigurationStorage> {
    const config: ConfigurationStorage = new ConfigurationStorage(configFolderName);
    await config.initialLoading();

    return config;
  }

  get path(): string {
    return this.configFilePath;
  }

  public async getAll(): Promise<Configuration> {
    await this.loadConfig();

    return this.data;
  }

  public async get(key: string): Promise<any> {
    if (!this.isValidKey(key)) {
      throw new Error('Invalid key');
    }

    await this.loadConfig();
    const keys: string[] = key.split('.');

    return this.getDeeperValue(keys, this.data);
  }

  public async set(key: string, value: any): Promise<void> {
    if (!this.isValidKey(key)) {
      throw new Error('Invalid key');
    }

    const keys: string[] = key.split('.');
    this.setDeeperValue(keys, this.data, value);

    await this.writeConfig();
  }

  public async del(key: string): Promise<void> {
    if (!this.isValidKey(key)) {
      throw new Error('Invalid key');
    }

    const keys: string[] = key.split('.');
    this.deleteDeeperValue(keys, this.data);

    await this.writeConfig();
  }

  public async exists(key: string): Promise<boolean> {
    if (!this.isValidKey(key)) {
      throw new Error('Invalid key');
    }

    await this.loadConfig();
    const keys: string[] = key.split('.');

    return this.existsDeeperValue(keys, this.data);
  }

  private async existsFolder(path: string): Promise<boolean> {
    try {
      await fsPromises.stat(path);

      return true;
    } catch (err) {
      if (err.code === 'ENOENT') {
        return false;
      } else {
        throw err;
      }
    }
  }

  private async existsFile(path: string): Promise<boolean> {
    try {
      await fsPromises.access(path);
      return true;
    } catch (err) {
      return false;
    }
  }

  private async createConfigFolder(): Promise<void> {
    try {
      await fsPromises.mkdir(this.configFolderPath, { recursive: true });
    } catch (err) {
      throw err;
    }
  }

  private async createConfigFile(): Promise<void> {
    try {
      await this.writeConfig();
    } catch (err) {
      throw err;
    }
  }

  private async loadConfig(): Promise<void> {
    try {
      const data: string = await fsPromises.readFile(this.configFilePath, 'utf-8');
      this.data = JSON.parse(data);
    } catch (err) {
      throw err;
    }
  }

  private async writeConfig(): Promise<void> {
    try {
      await fsPromises.writeFile(this.configFilePath, JSON.stringify(this.data, null, 4));
    } catch (err) {
      throw err;
    }
  }

  private async initialLoading(): Promise<void> {
    try {
      if (!(await this.existsFolder(this.configFolderPath))) {
        await this.createConfigFolder();
      }

      if (!(await this.existsFile(this.configFilePath))) {
        await this.createConfigFile();
      }
  
      await this.loadConfig();
    } catch (err) {
      throw err;
    }
  }

  private parseFolderName(storageName: string): string {
    return '.' + storageName
      .trim()
      .replace(/\s{2,}/g, ' ')
      .replace(' ', '-')
      .replace(/[^\w\d-]/g, '')
      .toLowerCase();
  }

  private isValidKey(key: string): boolean {
    return !key.startsWith('.') && !key.endsWith('.');
  }

  private getDeeperValue(keys: string[], obj: any): any {
    const [currentKey, ...keyRest]: string[] = keys;

    if (typeof(obj) === 'object' && obj[currentKey] && keyRest.length) {
      return this.getDeeperValue(keyRest, obj[currentKey]);
    } else if (obj[currentKey] !== undefined && obj[currentKey] !== null) {
      return obj[currentKey];
    } else {
      return null;
    }
  }

  private setDeeperValue(keys: string[], obj: any, value: any): void {
    const [currentKey, ...keyRest]: string[] = keys;

    if (keyRest.length) {
      if (typeof(obj[currentKey]) !== 'object') {
        obj[currentKey] = {};
      }
  
      this.setDeeperValue(keyRest, obj[currentKey], value);
    } else {
      obj[currentKey] = value;
    }
  }

  private deleteDeeperValue(keys: string[], obj: any): any {
    const [currentKey, ...keyRest]: string[] = keys;

    if (keyRest.length) {
      if (typeof(obj[currentKey]) !== 'object') {
        return;
      }
  
      this.deleteDeeperValue(keyRest, obj[currentKey]);
    } else {
      delete obj[currentKey];
    }
  }

  private existsDeeperValue(keys: string[], obj: any): boolean {
    const [currentKey, ...keyRest]: string[] = keys;

    if (keyRest.length) {
      if (obj.hasOwnProperty(currentKey)) {
        return this.existsDeeperValue(keyRest, obj[currentKey]);
      } else {
        return false;
      }
    } else {
      return obj[currentKey] !== undefined && obj[currentKey] != null;
    }
  }
};

export default ConfigurationStorage;
