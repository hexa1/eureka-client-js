# eureka-client-js

## Usage
Install via npm+git: `npm install hexa1/eureka-client-js --save`.

```js
import EurekaClient from 'eureka-client-js'; // (if using es2015 packages)
const EurekaClient = require('eureka-client-js').default // (if using commonjs)

const myClient = new EurekaClient({
  // ... options, see below
});

myClient.register();
```

## Options
The following options are available:

  - `eurekaHost`: host:port of the eureka registry
  - `appName`: name of your service
  - `hostName`: host name of the machine your service is running on
  - `ipAddr`: ip address of the machine your service is running on
  - `port`: port that your service is listening on
  - `instanceId`: unique ID of the instance of this service (each instance must have a unique ID)
  - `statusPageUrl`: url for your service's status page
  - `dataCenterInfo`: not sure, I just leave it as `{ name: 'MyOwn' }` ¯\\_(ツ)_/¯
  - `registerRetryInterval`: how long to wait after a failed registration attempt to retry (in seconds, defaults to 5)
  - `retryRegisterAfter`: how many failed heartbeat attempts can happen before attempting to re-register (in seconds, defaults to 3)
  - `heartbeatInterval`: how often to send a heartbeat (in seconds, defaults to 5)
  - `registryInterval`: how often to fetch the registry (in seconds, defaults to 15)
  - `logLevel`: see [winston logging levels](https://www.npmjs.com/package/winston#logging-levels)

## Available methods on the EurekaClient class
The following methods are available after instantiating a new EurekaClient object:

  - `register()`: registers with the eureka registry. will continue to try to re-register if registration fails
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

## TODO
  - Allow passing a custom `winston` logging transport, e.g. for remote logging
  - Add support for Eureka 1.1

## Development

Please lint all code before committing: `npm run lint`.

The package needs to be built and the built files committed: `npm run build`.
