# eureka-client-js

## Usage
Install via npm+git: `npm install hexa1/eureka-client-js --save`.

```js
import EurekaClient from 'eureka-client-js';

const myClient = new EurekaClient({
  // ... options, see below
});

myClient.register();
```

## Options
The following options are available:

| Option | Type | Description | Required | Default value |
|--------|------|-------------|----------|---------------|
| `eurekaHost` | string | host:port of your Eureka registry | yes |  |
| `instance`| object | see Instance Options below | yes | |
| `registerRetryInterval` | number | how long to wait after a failed registration before attempting again, in seconds | no | 5 |
| `retryRegisterAfter` | number | how many failed heartbeat attempts can occur before attempting to re-register | no | 3 |
| `heartbeatInterval` | number | how often to send a heartbeat, in seconds | no | 5 |
| `registryInterval` | number | how often to fetch the registry, in seconds | no | 15 |
| `logLevel` | string | see [winston logging levels](https://www.npmjs.com/package/winston#logging-levels) | no | info |

### Instance Options
The `instance` object should conform to the Eureka XSD spec: https://github.com/Netflix/eureka/wiki/Eureka-REST-operations.

The only difference is that you should pass `instanceId` inside the `instance` object. This value isn't passed to Eureka during registration but it is used for crafting the URLs when making requests to Eureka.

## EurekaClient class methods
The following methods are available after instantiating a new EurekaClient object:

  - `register()`: registers with the eureka registry. will continue to try to re-register if registration fails
  - `stopRegisterRetry()`: if registration fails it will automatically retry itself according to the `registerRetryInterval` option. Use this if you want to stop that retry loop.
  - `deregister()`: deregisters with the eureka registry
  - `fetchRegistry()`: gets the latest list of instances from the eureka registry, stores in internal cache
  - `startRegistryFetcher()` - runs `fetchRegistry()` at the interval specified in options
  - `stopRegistryFetcher()` - stops fetching the registry
  - `getInstanceByAppId(appId)` - gets the first available instance of an app on the registry
  - `sendHeartbeat()` - sends a heartbeat for this service
  - `startHeartbeats()` - runs `sendHeartbeat()` at the interval specified in options
  - `stopHeartbeats()` - stops sending heartbeats

## Testing

`npm run test`

`npm run coverage` to get code coverage stats

## Development

Please lint all code before committing: `npm run lint`.

The package needs to be built and the built files committed: `npm run build`.

## TODO
  - Allow passing a custom `winston` logging transport, e.g. for remote logging
