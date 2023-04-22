import os from 'os';
import path from 'path';
import fsPromises from 'fs/promises'

interface ConfigurationStorage {
  [key: string]: string;
}

class ConfigStorage {
  private homedirPath: string;
  private configFilePath: string;
  private configFolderName: string;
  private configFolderPath: string;
  private configFileName: string;
  private data: ConfigurationStorage;

  private constructor(configFolderName?: string) {
    this.homedirPath = os.homedir();
    this.configFolderName = configFolderName ? configFolderName : '.config-storage';
    this.configFileName = 'config.json';
    this.configFolderPath = path.join(this.homedirPath, this.configFolderName);
    this.configFilePath = path.join(this.configFolderPath, this.configFileName);
    this.data = {};
  }

  get path(): string {
    return this.configFilePath;
  }

  public async getConfigStorage(configFolderName?: string): Promise<ConfigStorage> {
    const config: ConfigStorage = new ConfigStorage(configFolderName);
    await config.initialLoading();

    return config;
  }

  private async existsPath(path: string): Promise<boolean> {
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

  private async createConfigFolder(): Promise<void> {
    try {
      await fsPromises.mkdir(this.configFolderPath, { recursive: true });
    } catch (err) {
      throw err;
    }
  }

  private async createConfigFile(): Promise<void> {
    try {
      await fsPromises.writeFile(this.configFolderPath, JSON.stringify({}, null, 4));
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
      if (!(await this.existsPath(this.configFolderPath))) {
        this.createConfigFolder();
      }
  
      if (!(await this.existsPath(this.configFilePath))) {
        this.createConfigFile();
      }
  
      await this.loadConfig();
    } catch (err) {
      throw err;
    }
  }
};

export default ConfigStorage;
