import expect from 'expect';
import EurekaClient from '../../src/lib/Eureka';
import { createInstanceObject } from '../../src/lib/utils';

describe('EurekaClient', () => {
  const mockRequest = (client, ret, reject = false) => {
    client.request = () => (reject ? Promise.reject(ret) : Promise.resolve(ret));
  };

  afterEach(() => {
    expect.restoreSpies();
  });

  it('throws when no options are passed to the constructor', () => {
    expect(() => new EurekaClient()).toThrow();
  });

  it('extends the default options with options passed to the constructor', () => {
    const client = new EurekaClient({ registryRetryInterval: 1000 });
    expect(client.options.registryRetryInterval).toBe(1000);
  });

  describe('register', () => {
    it('sends all the instance data in a POST request to eureka', (done) => {
      const options = {
        eurekaHost: '/eureka',
        instance: {
          app: 'myApp',
          hostName: 'myApp',
          ipAddr: '10.0.1.123',
          instanceId: 'myApp123',
          port: {
            $: 3000,
            '@enabled': true,
          },
          securePort: {
            $: 3001,
            '@enabled': true,
          },
          dataCenterInfo: {
            name: 'MyOwn',
            '@class': 'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
          },
          statusPageUrl: 'whatever',
          healthCheckUrl: 'whatever',
          homePageUrl: 'whatever',
        },
      };

      const client = new EurekaClient(options);
      expect.spyOn(client, 'request').andReturn(Promise.resolve());
      client.register().then(() => {
        const args = client.request.calls[0].arguments[0];
        expect(args.uri).toEqual('/eureka/apps/myApp');
        expect(args.method).toEqual('POST');
        expect(args.body.instance).toEqual(createInstanceObject(options.instance));
        done();
      }).catch(done);
    });

    it('starts sending heartbeats and fetching the registry after a successful register', (done) => {
      const client = new EurekaClient({});
      mockRequest(client, { statusCode: 204 });
      expect.spyOn(client, 'startHeartbeats');
      expect.spyOn(client, 'startRegistryFetcher');
      client.register().then(() => {
        expect(client.startHeartbeats).toHaveBeenCalled();
        expect(client.startRegistryFetcher).toHaveBeenCalled();
        client.stopRegisterRetry();
        client.stopHeartbeats();
        done();
      }).catch(done);
    });

    it('reattempts to register if the registration fails', (done) => {
      const client = new EurekaClient({ registerRetryInterval: 0.05 });
      mockRequest(client, { statusCode: 404 });
      expect.spyOn(client, 'register').andCallThrough();
      client.register().then(() => {
        setTimeout(() => {
          expect(client.register.calls.length).toBeGreaterThanOrEqualTo(2);
          client.stopRegisterRetry();
          client.stopHeartbeats();
          done();
        }, 100);
      }).catch(done);
    });
  });

  describe('deregister', () => {
    it('sends a DELETE request to eureka', () => {
      const client = new EurekaClient({ eurekaHost: '/eureka', instance: { app: 'myApp', instanceId: 'myApp123' } });
      expect.spyOn(client, 'request');
      client.deregister();
      expect(client.request).toHaveBeenCalledWith({
        uri: '/eureka/apps/myApp/myApp123',
        method: 'DELETE',
      });
    });
  });

  describe('fetchRegistry', () => {
    it('updates the appCache when only one application is returned', (done) => {
      const client = new EurekaClient({});
      mockRequest(client, {
        applications: {
          application: { name: 'foo', instance: { bar: 'baz' } },
        },
      });
      client.fetchRegistry().then(() => {
        expect(client.appCache.foo).toEqual({ bar: 'baz' });
        done();
      }).catch(done);
    });

    it('updates the appCache when multiple applications are returned', (done) => {
      const client = new EurekaClient({});
      mockRequest(client, {
        applications: {
          application: [{
            name: 'foo', instance: { bar: 'baz' },
          }, {
            name: 'bar', instance: { foo: 'baz' },
          }],
        },
      });
      client.fetchRegistry().then(() => {
        expect(client.appCache.foo).toEqual({ bar: 'baz' });
        expect(client.appCache.bar).toEqual({ foo: 'baz' });
        done();
      }).catch(done);
    });
  });

  describe('startRegistryFetcher', () => {
    it('continues to fetch the registry at the specified interval when successful', (done) => {
      const client = new EurekaClient({ registryInterval: 0.05 });
      mockRequest(client, {
        applications: {
          application: { name: 'foo', instance: { bar: 'baz' } },
        },
      });
      expect.spyOn(client, 'startRegistryFetcher').andCallThrough();
      client.startRegistryFetcher().then(() => {
        setTimeout(() => {
          expect(client.startRegistryFetcher.calls.length).toBeGreaterThanOrEqualTo(3);
          client.stopRegistryFetcher();
          done();
        }, 150);
      }).catch(done);
    });

    it('continues to fetch the registry at the specified interval when unsuccessful', (done) => {
      const client = new EurekaClient({ registryInterval: 0.05 });
      mockRequest(client, {}, true);
      expect.spyOn(client, 'startRegistryFetcher').andCallThrough();
      client.startRegistryFetcher().then(() => {
        setTimeout(() => {
          expect(client.startRegistryFetcher.calls.length).toBeGreaterThanOrEqualTo(3);
          client.stopRegistryFetcher();
          done();
        }, 150);
      }).catch(done);
    });
  });

  describe('getInstanceByAppId', () => {
    it('rejects if the app is not in the appCache', (done) => {
      const client = new EurekaClient({});

      client.getInstanceByAppId('unknownApp').then(() => {
        done(true); // if this resolves then the test fails
      }).catch((err) => {
        expect(err.error.statusCode).toBe(503);
        done(); // if this rejects then the test passes
      }).catch(done); // additional catch in case our expectation in the first catch throws
    });

    it('rejects if it runs out of instances to test when app has multiple instances', (done) => {
      const client = new EurekaClient({});
      expect.spyOn(client, 'checkInstanceUp').andReturn(Promise.reject());
      client.appCache = { foo: [{}, {}] };
      client.getInstanceByAppId('foo', 2).then(() => {
        done(true); // if this resolves then the test fails
      }).catch((err) => {
        expect(err.error.statusCode).toBe(503);
        done(); // if this rejects then the test passes
      }).catch(done); // additional catch in case our expectation in the first catch throws
    });

    it('checks if the instance is up, rejects if down and only one instance', (done) => {
      const client = new EurekaClient({});
      expect.spyOn(client, 'checkInstanceUp').andReturn(Promise.reject());
      client.appCache = { foo: {} };

      client.getInstanceByAppId('foo').then(() => {
        done(true); // if this resolves then the test fails
      }).catch((err) => {
        expect(err.error.statusCode).toBe(503);
        done(); // if this rejects then the test passes
      }).catch(done); // additional catch in case our expectation in the first catch throws
    });

    it('checks if the instance is up and retries with the next instance if multiple, finally rejects if none are reachable', (done) => {
      const client = new EurekaClient({});
      mockRequest(client, {}, true);
      client.appCache = { foo: [{}, {}] };

      expect.spyOn(client, 'checkInstanceUp').andReturn(Promise.reject());
      expect.spyOn(client, 'getInstanceByAppId').andCallThrough();

      client.getInstanceByAppId('foo').then(() => {
        done(true); // if this resolves then the test fails
      }).catch((err) => {
        expect(err.error.statusCode).toBe(503);
        done();
      }).catch(done);
    });

    it('returns the url for the instance with the securePort if available', (done) => {
      const client = new EurekaClient({});
      client.appCache = {
        myApp: {
          hostName: 'myapp.com',
          securePort: {
            $: 443,
            '@enabled': true,
          },
        },
      };

      expect.spyOn(client, 'checkInstanceUp').andCall(instance => Promise.resolve(instance));
      client.getInstanceByAppId('myApp').then(url => {
        expect(url).toEqual('https://myapp.com:443');
        done();
      }).catch(done);
    });

    it('returns the url for the instance with the insecure port if available', (done) => {
      const client = new EurekaClient({});
      client.appCache = {
        myApp: {
          hostName: 'myapp.com',
          port: {
            $: 8000,
            '@enabled': true,
          },
        },
      };

      expect.spyOn(client, 'checkInstanceUp').andCall(instance => Promise.resolve(instance));
      client.getInstanceByAppId('myApp').then(url => {
        expect(url).toEqual('http://myapp.com:8000');
        done();
      }).catch(done);
    });

    it('returns the url for the instance with a default port if port and securePort are unavailable', (done) => {
      const client = new EurekaClient({});
      client.appCache = {
        myApp: {
          hostName: 'myapp.com',
        },
      };

      expect.spyOn(client, 'checkInstanceUp').andCall(instance => Promise.resolve(instance));
      client.getInstanceByAppId('myApp').then(url => {
        expect(url).toEqual('http://myapp.com:80');
        done();
      }).catch(done);
    });
  });

  describe('sendHeartbeat', () => {
    it('sends a PUT request to eureka', (done) => {
      const client = new EurekaClient({
        eurekaHost: '/eureka',
        instance: {
          app: 'myApp',
          hostName: 'myapp.com',
          instanceId: 'myApp123',
        },
      });
      expect.spyOn(client, 'request').andReturn(Promise.resolve());
      client.sendHeartbeat().then(() => {
        expect(client.request).toHaveBeenCalledWith({
          uri: '/eureka/apps/myApp/myapp.com:myApp123',
          method: 'PUT',
        });
        done();
      }).catch(done);
    });

    // this is important because we use the returned error to determine if we should re-register
    it('returns an error if heartbeat fails', (done) => {
      const client = new EurekaClient({});
      mockRequest(client, new Error(), true);
      client.sendHeartbeat().then(err => {
        expect(err).toBeA(Error);
        done();
      }).catch(done);
    });
  });

  describe('startHeartbeats', () => {
    it('sends an initial heartbeat', (done) => {
      const client = new EurekaClient({});
      expect.spyOn(client, 'sendHeartbeat').andReturn(Promise.resolve());
      client.startHeartbeats().then(() => {
        expect(client.sendHeartbeat).toHaveBeenCalled();
        client.stopHeartbeats();
        done();
      }).catch(done);
    });

    it('sends another heartbeat after the specified heartbeatInterval', (done) => {
      const client = new EurekaClient({ heartbeatInterval: 0.05 });
      expect.spyOn(client, 'sendHeartbeat').andReturn(Promise.resolve());
      client.startHeartbeats().then(() => {
        setTimeout(() => {
          expect(client.sendHeartbeat.calls.length).toBeGreaterThanOrEqualTo(2);
          client.stopHeartbeats();
          done();
        }, 100);
      }).catch(done);
    });

    it('sends another heartbeat after a failed attempt if failedHeartbeatAttempts < retryRegisterAfter', (done) => {
      const client = new EurekaClient({ heartbeatInterval: 0.05, retryRegisterAfter: 4 });
      expect.spyOn(client, 'sendHeartbeat').andReturn(Promise.resolve(new Error()));
      expect.spyOn(client, 'register');
      client.startHeartbeats().then(() => {
        setTimeout(() => {
          expect(client.sendHeartbeat.calls.length).toBe(2);
          expect(client.register).toNotHaveBeenCalled();
          client.stopHeartbeats();
          done();
        }, 100);
      }).catch(done);
    });

    it('tries to re-register if failedHeartbeatAttempts > retryRegisterAfter', (done) => {
      const client = new EurekaClient({ retryRegisterAfter: 0 });
      expect.spyOn(client, 'sendHeartbeat').andReturn(Promise.resolve(new Error()));
      expect.spyOn(client, 'register').andReturn(Promise.reject());
      client.startHeartbeats().then(() => {
        expect(client.register).toHaveBeenCalled();
        expect(client.failedHeartbeatAttempts).toBe(1);
        client.stopRegisterRetry();
        client.stopHeartbeats();
        done();
      }).catch(done);
    });

    it('resets failedHeartbeatAttempts to 0 after a successful re-register', (done) => {
      const client = new EurekaClient({ retryRegisterAfter: 0 });
      expect.spyOn(client, 'sendHeartbeat').andReturn(Promise.resolve(new Error()));
      expect.spyOn(client, 'register').andReturn(Promise.resolve());
      client.startHeartbeats().then(() => {
        expect(client.failedHeartbeatAttempts).toBe(0);
        client.stopRegisterRetry();
        client.stopHeartbeats();
        done();
      }).catch(done);
    });
  });
});
