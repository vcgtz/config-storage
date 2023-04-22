import os from 'os';
import path from 'path';

class Config {
  private homedirPath: string;
  private configFolderName: string;
  private configPath: string;

  constructor(configFolderName?: string) {
    this.homedirPath = os.homedir();
    this.configFolderName = configFolderName ? configFolderName : '.config-storage';
    this.configPath = path.join(this.homedirPath, this.configFolderName);
  }

  get path(): string {
    return this.configPath;
  }

  set path(value: string) {
    this.configPath = value;
  }
};

export default Config;
