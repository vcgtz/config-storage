import { expect, describe, test } from '@jest/globals';
import ConfigurationStorage from '../src/ConfigurationStorage';

describe('Testing folder name parsing', () => {
  test('Parsing folder name with spaces', async () => {
    const storage: ConfigurationStorage = await ConfigurationStorage.getStorage('testing');
    const storagePrototype = Object.getPrototypeOf(storage);

    expect(storagePrototype.parseFolderName('hello world')).toBe('.hello-world');
  });

  test('Parsing folder name with special characters', async () => {
    const storage: ConfigurationStorage = await ConfigurationStorage.getStorage('testing');
    const storagePrototype = Object.getPrototypeOf(storage);

    expect(storagePrototype.parseFolderName('$hello_world.')).toBe('.hello_world');
  });

  test('Parsing folder name with uppercased characters', async () => {
    const storage: ConfigurationStorage = await ConfigurationStorage.getStorage('testing');
    const storagePrototype = Object.getPrototypeOf(storage);

    expect(storagePrototype.parseFolderName('HELLO WORLD')).toBe('.hello-world');
  });

  test('Parsing folder name with extra spaces', async () => {
    const storage: ConfigurationStorage = await ConfigurationStorage.getStorage('testing');
    const storagePrototype = Object.getPrototypeOf(storage);

    expect(storagePrototype.parseFolderName('      hello   world  ')).toBe('.hello-world');
  });
});
