import os from 'os';
import path from 'path';
import fsPromises from 'fs/promises'

class Config {
  private homedirPath: string;
  private configFilePath: string;
  private configFolderName: string;
  private configFileName: string;

  constructor(configFolderName?: string) {
    this.homedirPath = os.homedir();
    this.configFolderName = configFolderName ? configFolderName : '.config-storage';
    this.configFileName = 'config.json';
    this.configFilePath = path.join(this.homedirPath, this.configFolderName, this.configFileName);
  }

  get path(): string {
    return this.configFilePath;
  }

  set path(value: string) {
    this.configFilePath = value;
  }

  private async existsConfigFile(): Promise<boolean> {
    try {
      await fsPromises.stat(this.path);

      return true;
    } catch (err) {
      if (err.code === 'ENOENT') {
        return false;
      } else {
        throw err;
      }
    }
  }
};

export default Config;
