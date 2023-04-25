import { expect, describe, test, beforeEach, afterAll } from '@jest/globals';
import ConfigurationStorage from '../src/ConfigurationStorage';
import fsPromises from 'fs/promises';

describe('Testing folder name parsing', () => {
  let storage: ConfigurationStorage;
  let storagePrototype: any;

  beforeEach(async () => {
    storage = await ConfigurationStorage.getStorage('testing');
    storagePrototype = Object.getPrototypeOf(storage);
  });

  test('Parsing folder name with spaces', async () => {
    expect(storagePrototype.parseFolderName('hello world')).toBe('.hello-world');
  });

  test('Parsing folder name with special characters', async () => {
    expect(storagePrototype.parseFolderName('$hello_world.')).toBe('.hello_world');
  });

  test('Parsing folder name with uppercased characters', async () => {
    expect(storagePrototype.parseFolderName('HELLO WORLD')).toBe('.hello-world');
  });

  test('Parsing folder name with extra spaces', async () => {
    expect(storagePrototype.parseFolderName('      hello   world  ')).toBe('.hello-world');
  });

  afterAll(async () => {
    await fsPromises.unlink(storage.path);
  });
});

describe('Testing storing and retrieving data', () => {
  let storage: ConfigurationStorage;

  beforeEach(async () => {
    storage = await ConfigurationStorage.getStorage('testing');
  });

  test('Storing a single string', async () => {
    const key = 'message';
    const value = 'Hello World!';
    const expectedObj = { message: value };

    await storage.set(key, value);

    expect(await storage.get(key)).toBe(value);
    expect(await storage.getAll()).toMatchObject(expectedObj);
  });

  test('Storing a single number', async () => {
    const key = 'pi';
    const value = 3.1416;
    const expectedObj = { pi: value };

    await storage.set(key, value);

    expect(await storage.get(key)).toBe(value);
    expect(await storage.getAll()).toMatchObject(expectedObj);
  });

  test('Storing a single boolean', async () => {
    const key = 'enabled';
    const value = false;
    const expectedObj = { enabled: value };

    await storage.set(key, value);

    expect(await storage.get(key)).toBe(value);
    expect(await storage.getAll()).toMatchObject(expectedObj);
  });

  test('Storing a nested object with 6 levels', async () => {
    const key1 = 'obj1.obj2.obj3.obj4.obj5.obj6';
    const value1 = 'Hello World!';
    const key2 = 'obj1.obj2.obj3.obj4';
    const value2 = { obj5: { obj6: value1 } };
    const expectedObj = { obj1: { obj2: { obj3: { obj4: { obj5: { obj6: value1 } } } } } };

    await storage.set(key1, value1);

    expect(await storage.get(key1)).toBe(value1);
    expect(await storage.get(key2)).toMatchObject(value2);
    expect(await storage.getAll()).toMatchObject(expectedObj);
  });

  test('Storing a deep nested object with 3 levels', async () => {
    const key1 = 'obj1.obj2.obj3';
    const key2 = 'obj1.obj2.obj4';
    const value1 = 'Hello World!';
    const value2 = 3.1416;
    const expectedObj = { obj1: { obj2: { obj3: value1, obj4: value2 } } };

    await storage.set(key1, value1);
    await storage.set(key2, value2);

    expect(await storage.get(key1)).toBe(value1);
    expect(await storage.get(key2)).toBe(value2);
    expect(await storage.getAll()).toMatchObject(expectedObj);
  });

  afterAll(async () => {
    await fsPromises.unlink(storage.path);
  });
});
