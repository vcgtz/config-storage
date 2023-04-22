import os from 'os';
import path from 'path';
import fsPromises from 'fs/promises'

class Config {
  private homedirPath: string;
  private configFilePath: string;
  private configFolderName: string;
  private configFolderPath: string;
  private configFileName: string;

  constructor(configFolderName?: string) {
    this.homedirPath = os.homedir();
    this.configFolderName = configFolderName ? configFolderName : '.config-storage';
    this.configFileName = 'config.json';
    this.configFolderPath = path.join(this.homedirPath, this.configFolderName);
    this.configFilePath = path.join(this.configFolderPath, this.configFileName);
  }

  get path(): string {
    return this.configFilePath;
  }

  set path(value: string) {
    this.configFilePath = value;
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
};

export default Config;
