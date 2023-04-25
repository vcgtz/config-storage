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

  test('Storing a full object', async () => {
    const key1 = 'obj1';
    const key2 = 'obj1.message';
    const key3 = 'obj1.obj2.nestedMessage';
    const key4 = 'obj1.obj2.obj3.nestedPi';
    const value = {
      message: 'Hello World!',
      pi: 3.1416,
      obj2: {
        nestedMessage: 'Hello World from far far away',
        obj3: {
          nestedPi: 3.14159,
        },
      },
    };

    await storage.set(key1, value);

    expect(await storage.get(key1)).toMatchObject(value);
    expect(await storage.get(key2)).toBe('Hello World!');
    expect(await storage.get(key3)).toBe('Hello World from far far away');
    expect(await storage.get(key4)).toBe(3.14159);
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

  test('Demoving a single string', async () => {
    const key = 'message';
    const value = 'Hello World!';
    const expectedObj = { message: value };

    await storage.set(key, value);

    expect(await storage.get(key)).toBe(value);
    expect(await storage.getAll()).toMatchObject(expectedObj);
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
    const key = 'message';
    const expectedObj = {};

    await storage.set(key, 'Hello World!');

    expect(await storage.get(key)).toBe('Hello World!');

    await storage.del(key);

    expect(await storage.getAll()).toMatchObject(expectedObj);
  });

  test('Removing all the data', async () => {
    const key = 'obj1';
    const expectedObj = {};

    await storage.del(key);
    expect(await storage.getAll()).toMatchObject(expectedObj);
  });

  test('Removing a nested string', async () => {
    const key = 'obj1.message';
    const expectedObj = {
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
    const key = 'obj1.obj2.obj3.nestedPi';
    const expectedObj = {
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
    const key = 'obj1';

    expect(await storage.exists(key)).toBe(true);
  });

  test('Checking existence of a nested value', async () => {
    const key = 'obj1.message';

    expect(await storage.exists(key)).toBe(true);
  });

  test('Checking existence of a deep nested value', async () => {
    const key = 'obj1.obj2.obj3.nestedPi';

    expect(await storage.exists(key)).toBe(true);
  });

  test('Checking existence of a not existing value', async () => {
    const key = 'obj2';

    expect(await storage.exists(key)).toBe(false);
  });

  test('Checking existence of a not existing nested value', async () => {
    const key = 'obj2.obj20.obj29';

    expect(await storage.exists(key)).toBe(false);
  });

  afterAll(async () => {
    await fsPromises.unlink(storage.path);
  });
});
