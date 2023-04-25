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

  /**
   * 
   * @constructor
   * @param {string} storageName
   */
  private constructor(storageName: string) {
    this.homedirPath = os.homedir();
    this.configFolderName = this.parseFolderName(storageName);
    this.configFileName = 'config.json';
    this.configFolderPath = path.join(this.homedirPath, this.configFolderName);
    this.configFilePath = path.join(this.configFolderPath, this.configFileName);
    this.data = {};
  }

  /**
   * Get an instance of ConfigurationStorage class.
   * 
   * @param {string} configFolderName
   * @returns {Promise<ConfigurationStorage>}
   */
  static async getStorage(configFolderName: string): Promise<ConfigurationStorage> {
    const config: ConfigurationStorage = new ConfigurationStorage(configFolderName);
    await config.initialLoading();

    return config;
  }

  get path(): string {
    return this.configFilePath;
  }

  /**
   * Get all the stored configuration.
   * 
   * @returns {Promise<Configuration>}
   */
  public async getAll(): Promise<Configuration> {
    await this.loadConfig();

    return this.data;
  }

  /**
   * Get a specific value according a given key. If the key doesn't exist, it returns the defaultValue.
   * 
   * @param {string} key
   * @param {any} defaultValue
   * @returns {Promise<any>}
   */
  public async get(key: string, defaultValue: any = null): Promise<any> {
    if (!this.isValidKey(key)) {
      throw new Error('Invalid key');
    }

    await this.loadConfig();
    const keys: string[] = key.split('.');
    const value: any = this.getDeeperValue(keys, this.data);

    if (value !== null) {
      return value;
    }

    return defaultValue;
  }

  /**
   * Store a value in a given key.
   * The key can represent nested values by using dot-notation.
   * 
   * @param {string} key
   * @param {any} value
   * @returns {Promise<void>}
   */
  public async set(key: string, value: any): Promise<void> {
    if (!this.isValidKey(key)) {
      throw new Error('Invalid key');
    }

    const keys: string[] = key.split('.');
    this.setDeeperValue(keys, this.data, value);

    await this.writeConfig();
  }

  /**
   * Delete a key in the given key.
   * 
   * @param {string} key
   * @returns {Promise<void>}
   */
  public async del(key: string): Promise<void> {
    if (!this.isValidKey(key)) {
      throw new Error('Invalid key');
    }

    const keys: string[] = key.split('.');
    this.deleteDeeperValue(keys, this.data);

    await this.writeConfig();
  }

  /**
   * Check if a given key exists.
   * 
   * @param {string} key
   * @returns {Promise<boolean>}
   */
  public async exists(key: string): Promise<boolean> {
    if (!this.isValidKey(key)) {
      throw new Error('Invalid key');
    }

    await this.loadConfig();
    const keys: string[] = key.split('.');

    return this.existsDeeperValue(keys, this.data);
  }

  /**
   * Clean all the stored configuration.
   * 
   * @returns {Promise<void>}
   */
  public async clean(): Promise<void> {
    this.data = {};

    this.writeConfig();
  }

  /**
   * Check if a folder exists in a given path.
   * 
   * @param {string} path
   * @returns {Promise<boolean>}
   */
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

  /**
   * Check if a file exists in a given path.
   * 
   * @param {string} path
   * @returns {Promise<boolean>}
   */
  private async existsFile(path: string): Promise<boolean> {
    try {
      await fsPromises.access(path);
      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * Create the main folder where the configuration file will be stored.
   * 
   * @returns {Promise<void>}
   */
  private async createConfigFolder(): Promise<void> {
    try {
      await fsPromises.mkdir(this.configFolderPath, { recursive: true });
    } catch (err) {
      throw err;
    }
  }

  /**
   * Create the main configuration file where all the data will be stored.
   * 
   * @returns {Promise<void>}
   */
  private async createConfigFile(): Promise<void> {
    try {
      await this.writeConfig();
    } catch (err) {
      throw err;
    }
  }

  /**
   * Load all the data from the configuration file into the current ConfigurationStorage instance.
   * 
   * @returns {Promise<void>}
   */
  private async loadConfig(): Promise<void> {
    try {
      const data: string = await fsPromises.readFile(this.configFilePath, 'utf-8');
      this.data = JSON.parse(data);
    } catch (err) {
      throw err;
    }
  }

  /**
   * Write the current data from the ConfigurationStorage instance into the config file.
   * 
   * @returns {Promise<void>}
   */
  private async writeConfig(): Promise<void> {
    try {
      await fsPromises.writeFile(this.configFilePath, JSON.stringify(this.data, null, 4));
    } catch (err) {
      throw err;
    }
  }

  /**
   * Initial loading where the config file and folder are be created.
   * 
   * @returns {Promise<void>}
   */
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

  /**
   * Parse the storageName into a more appropriate name for a folder.
   * 
   * @param {string} storageName
   * @returns {string}
   */
  private parseFolderName(storageName: string): string {
    return '.' + storageName
      .trim()
      .replace(/\s{2,}/g, ' ')
      .replace(' ', '-')
      .replace(/[^\w\d-]/g, '')
      .toLowerCase();
  }

  /**
   * Check if a key has a valid format.
   * 
   * @param {string} key
   * @returns {boolean}
   */
  private isValidKey(key: string): boolean {
    return !key.startsWith('.') && !key.endsWith('.');
  }

  /**
   * Get a value in a given key considering that the key can be use a dot-notation format to refer to
   * nested values.
   * 
   * @param {string[]} keys
   * @param {obj} obj
   * @returns {any}
   */
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

  /**
   * Set a value in a given key considering that the key can be use a dot-notation format to refer to
   * nested values.
   * 
   * @param {string[]} keys
   * @param {obj} obj
   * @returns {void}
   */
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

  /**
   * Delete a value in a given key considering that the key can be use a dot-notation format to refer to
   * nested values.
   * 
   * @param {string[]} keys
   * @param {obj} obj
   * @returns {any}
   */
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

  /**
   * Check existance of a given key considering that the key can be use a dot-notation format to refer to
   * nested values.
   * 
   * @param {string[]} keys
   * @param {obj} obj
   * @returns {boolean}
   */
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
