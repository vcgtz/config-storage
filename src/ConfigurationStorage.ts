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

  private constructor(configFolderName?: string) {
    this.homedirPath = os.homedir();
    this.configFolderName = configFolderName ? configFolderName : '.config-storage';
    this.configFileName = 'config.json';
    this.configFolderPath = path.join(this.homedirPath, this.configFolderName);
    this.configFilePath = path.join(this.configFolderPath, this.configFileName);
    this.data = {};
  }

  static async getStorage(configFolderName?: string): Promise<ConfigurationStorage> {
    const config: ConfigurationStorage = new ConfigurationStorage(configFolderName);
    await config.initialLoading();

    return config;
  }

  get path(): string {
    return this.configFilePath;
  }

  public getAll(): Configuration {
    return this.data;
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
      await fsPromises.writeFile(this.configFilePath, JSON.stringify({}, null, 4));
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
};

export default ConfigurationStorage;
