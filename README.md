# config-storage
A package to store your own persistent configurations in the host machine.

![npm](https://img.shields.io/npm/l/config-storage?color=blue)
![npm](https://img.shields.io/npm/v/config-storage?color=blue)

## Installation
```bash
npm i config-storage
```

## Usage
### :large_blue_circle: Importing
```js
// using require
const ConfigurationStorage = require('config-storage').default;

// using import
import ConfigurationStorage from 'config-storage';
```

### :large_blue_circle: Initialization
#### `ConfigurationStorage.getStorage(folderName: string)`
You can pass as an argument the name of the folder where your configuration will be saved.

```js
const config = await ConfigurationStorage.getStorage('.my_application');
```

### :large_blue_circle: Storing values
#### `set(key: string, value: string): Promise<void>`
```js
await config.set('MAIN_KEY', 'GiQTZ8yKBcfuEnTFbs3TvcqoAsF6owLu');
```

### :large_blue_circle: Retrieving values
#### `get(key: string): Promise<string | null>`
It returns `null` if the key doesn't exist.
```js
await config.get('MAIN_KEY');
```

#### `getAll(): Promise<Configuration>`
```js
await config.getAll();
```

### :large_blue_circle: Removing values
#### `del(key: string): Promise<void>`
```js
await config.del('MAIN_KEY');
```

### :large_blue_circle: Checking existence
#### `exists(key: string): Promise<boolean>`
```js
await config.exists('MAIN_KEY');
```

## License
[MIT](https://github.com/vcgtz/config-storage/blob/main/LICENSE)
