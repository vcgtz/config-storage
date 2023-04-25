import os from 'os';
import path from 'path';
import fsPromises from 'fs/promises'

interface Configuration {
  [key: string]: string;
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
      throw new Error('Key invalid');
    }

    await this.loadConfig();
    const keys: string[] = key.split('.');

    return this.getDeeperValue(keys, this.data);
  }

  public async set(key: string, value: any): Promise<void> {
    if (!this.isValidKey(key)) {
      throw new Error('Key invalid');
    }

    const keys: string[] = key.split('.');
    this.setDeeperValue(keys, this.data, value);

    await this.writeConfig();
  }

  public async del(key: string): Promise<void> {
    const keys: string[] = key.split('.');
    this.deleteDeeperValue(keys, this.data);

    await this.writeConfig();
  }

  public async exists(key: string): Promise<boolean> {
    await this.loadConfig();

    return !!this.data[key]
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
    if (key.startsWith('.') || key.endsWith('.')) {
      return false;
    }

    return true;
  }

  private getDeeperValue(keys: string[], obj: any): any {
    const [currentKey, ...keyRest] = keys;

    if (typeof(obj) === 'object' && obj[currentKey] && keyRest.length) {
      return this.getDeeperValue(keyRest, obj[currentKey]);
    } else if (obj[currentKey] !== undefined && obj[currentKey] !== null) {
      return obj[currentKey];
    } else {
      return null;
    }
  }

  private setDeeperValue(keys: string[], obj: any, value: any): any {
    const [currentKey, ...keyRest] = keys;

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
    const [currentKey, ...keyRest] = keys;

    if (keyRest.length) {
      if (typeof(obj[currentKey]) !== 'object') {
        return;
      }
  
      this.deleteDeeperValue(keyRest, obj[currentKey]);
    } else {
      delete obj[currentKey];
    }
  }
};

export default ConfigurationStorage;
