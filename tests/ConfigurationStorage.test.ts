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

  test('Checking is a key is valid', () => {
    expect(storagePrototype.isValidKey('hello')).toBe(true);
    expect(storagePrototype.isValidKey('hello.world')).toBe(true);
    expect(storagePrototype.isValidKey('hello.world.fellows')).toBe(true);
  });

  test('Checking is a key is invalid', () => {
    expect(storagePrototype.isValidKey('.hello')).toBe(false);
    expect(storagePrototype.isValidKey('hello.world.')).toBe(false);
    expect(storagePrototype.isValidKey('.hello.world.fellows.')).toBe(false);
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
    const key: string = 'message';
    const value: string = 'Hello World!';
    const expectedObj: any = { message: value };

    await storage.set(key, value);

    expect(await storage.get(key)).toBe(value);
    expect(await storage.getAll()).toMatchObject(expectedObj);
  });

  test('Storing a single number', async () => {
    const key: string = 'pi';
    const value: number = 3.1416;
    const expectedObj: any = { pi: value };

    await storage.set(key, value);

    expect(await storage.get(key)).toBe(value);
    expect(await storage.getAll()).toMatchObject(expectedObj);
  });

  test('Storing a single boolean', async () => {
    const key: string = 'enabled';
    const value: boolean = false;
    const expectedObj: any = { enabled: value };

    await storage.set(key, value);

    expect(await storage.get(key)).toBe(value);
    expect(await storage.getAll()).toMatchObject(expectedObj);
  });

  test('Storing a nested object with 6 levels', async () => {
    const fullNestedKey: string = 'obj1.obj2.obj3.obj4.obj5.obj6';
    const fullNestedValue: string = 'Hello World!';
    const nestedKey: string = 'obj1.obj2.obj3.obj4';
    const nestedValue: any = { obj5: { obj6: fullNestedValue } };
    const expectedObj: any = { obj1: { obj2: { obj3: { obj4: { obj5: { obj6: fullNestedValue } } } } } };

    await storage.set(fullNestedKey, fullNestedValue);

    expect(await storage.get(fullNestedKey)).toBe(fullNestedValue);
    expect(await storage.get(nestedKey)).toMatchObject(nestedValue);
    expect(await storage.getAll()).toMatchObject(expectedObj);
  });

  test('Storing a deep nested object with 3 levels', async () => {
    const nestedKey1: string = 'obj1.obj2.obj3';
    const nestedKey2: string = 'obj1.obj2.obj4';
    const nestedValue1: string = 'Hello World!';
    const nestedValue2: number = 3.1416;
    const expectedObj: any = { obj1: { obj2: { obj3: nestedValue1, obj4: nestedValue2 } } };

    await storage.set(nestedKey1, nestedValue1);
    await storage.set(nestedKey2, nestedValue2);

    expect(await storage.get(nestedKey1)).toBe(nestedValue1);
    expect(await storage.get(nestedKey2)).toBe(nestedValue2);
    expect(await storage.getAll()).toMatchObject(expectedObj);
  });

  test('Storing a full object', async () => {
    const mainKey: string = 'obj1';
    const nestedKey1: string = 'obj1.message';
    const nestedKey2: string = 'obj1.obj2.nestedMessage';
    const nestedKey3: string = 'obj1.obj2.obj3.nestedPi';
    const nestedValue1: string = 'Hello World!';
    const nestedValue2: string = 'Hello World from far far away';
    const nestedValue3: number = 3.14159;
    const mainValue: any = {
      message: 'Hello World!',
      pi: 3.1416,
      obj2: {
        nestedMessage: 'Hello World from far far away',
        obj3: {
          nestedPi: 3.14159,
        },
      },
    };

    await storage.set(mainKey, mainValue);

    expect(await storage.get(mainKey)).toMatchObject(mainValue);
    expect(await storage.get(nestedKey1)).toBe(nestedValue1);
    expect(await storage.get(nestedKey2)).toBe(nestedValue2);
    expect(await storage.get(nestedKey3)).toBe(nestedValue3);
  });

  test('retrieving a default value', async () => {
    const key: string = 'message';
    const value: string = 'Hello World!';

    await storage.set(key, value);

    expect(await storage.get('message2', 'key does not exist')).toBe('key does not exist');
  });

  test('retrieving a nested default value', async () => {
    const key: string = 'message';
    const value: object = {
      nestedMessage: 'Hello World!',
    };

    await storage.set(key, value);

    expect(await storage.get('message.nestedMessage2', 666)).toBe(666);
  });

  afterAll(async () => {
    await fsPromises.unlink(storage.path);
  });
});

describe('Testing deleting existing values', () => {
  let storage: ConfigurationStorage;

  beforeEach(async () => {
    storage = await ConfigurationStorage.getStorage('testing');

    await storage.set('obj1', {
      message: 'Hello World!',
      pi: 3.1416,
      obj2: {
        nestedMessage: 'Hello World from far far away',
        obj3: {
          nestedPi: 3.14159,
        },
      },
    });
  });

  test('Removing a single value', async () => {
    const key: string = 'message';
    const value: string = 'Hello World!';
    const expectedObj: any = {};

    await storage.set(key, value);

    expect(await storage.get(key)).toBe(value);

    await storage.del(key);

    expect(await storage.getAll()).toMatchObject(expectedObj);
  });

  test('Removing all the data', async () => {
    const key: string = 'obj1';
    const expectedObj = {};

    await storage.del(key);

    expect(await storage.getAll()).toMatchObject(expectedObj);
  });

  test('Removing a nested string', async () => {
    const key: string = 'obj1.message';
    const expectedObj: any = {
      obj1: {
        pi: 3.1416,
        obj2: {
          nestedMessage: 'Hello World from far far away',
          obj3: {
            nestedPi: 3.14159,
          },
        },
      }
    };

    await storage.del(key);
    expect(await storage.getAll()).toMatchObject(expectedObj);
  });

  test('Removing a nested number', async () => {
    const key: string = 'obj1.obj2.obj3.nestedPi';
    const expectedObj: any = {
      obj1: {
        pi: 3.1416,
        obj2: {
          nestedMessage: 'Hello World from far far away',
          obj3: {
          },
        },
      }
    };

    await storage.del(key);
    expect(await storage.getAll()).toMatchObject(expectedObj);
  });

  afterAll(async () => {
    await fsPromises.unlink(storage.path);
  });
});

describe('Testing existance of values', () => {
  let storage: ConfigurationStorage;

  beforeEach(async () => {
    storage = await ConfigurationStorage.getStorage('testing');

    await storage.set('obj1', {
      message: 'Hello World!',
      pi: 3.1416,
      obj2: {
        nestedMessage: 'Hello World from far far away',
        obj3: {
          nestedPi: 3.14159,
        },
      },
    });
  });

  test('Checking existence of a single value', async () => {
    const key: string = 'obj1';

    expect(await storage.exists(key)).toBe(true);
  });

  test('Checking existence of a nested value', async () => {
    const key: string = 'obj1.message';

    expect(await storage.exists(key)).toBe(true);
  });

  test('Checking existence of a deep nested value', async () => {
    const key: string = 'obj1.obj2.obj3.nestedPi';

    expect(await storage.exists(key)).toBe(true);
  });

  test('Checking existence of a not existing value', async () => {
    const key: string = 'obj2';

    expect(await storage.exists(key)).toBe(false);
  });

  test('Checking existence of a not existing nested value', async () => {
    const key: string = 'obj2.obj20.obj29';

    expect(await storage.exists(key)).toBe(false);
  });

  afterAll(async () => {
    await fsPromises.unlink(storage.path);
  });
});
