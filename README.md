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

| Option | Description | Required | Default value |
|--------|-------------|----------|---------------|
| `eurekaHost` | host:port of your Eureka registry | yes |  |
| `appName` | the name of your service | yes |  |
| `hostName` | the hostname for your service | yes |  |
| `ipAddr` | the IP address of your service | yes |  |
| `port` | must take the following structure: `{ "$": <int>, "@enabled": <bool> }` | yes | |
| `securePort` | must take the following structure: `{ "$": <int>, "@enabled": <bool> }` | yes | |
| `instanceId` | unique ID of the instance of this service | yes | |
| `statusPageUrl` | | yes | |
| `dataCenterInfo` | see Eureka's docs | yes | |
| `registerRetryInterval` | how long to wait after a failed registration before attempting again, in seconds | no | 5 |
| `retryRegisterAfter` | how many failed heartbeat attempts can occur before attempting to re-register | no | 3 |
| `heartbeatInterval` | how often to send a heartbeat, in seconds | no | 5 |
| `registryInterval` | how often to fetch the registry, in seconds | no | 15 |
| `logLevel` | see [winston logging levels](https://www.npmjs.com/package/winston#logging-levels) | no | info |

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
