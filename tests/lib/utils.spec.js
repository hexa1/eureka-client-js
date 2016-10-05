import expect from 'expect';
import * as utils from '../../src/lib/utils';

describe('utils', () => {
  describe('createInstanceObject', () => {
    it('creates an instance with the provided options', () => {
      const instanceOptions = {
        app: 'myApp',
        hostName: 'myApp.com',
        ipAddr: '10.0.0.10',
        port: { $: 3000, '@enabled': true },
        securePort: { $: 3001, '@enabled': true },
        dataCenterInfo: { name: 'MyOwn' },
        statusPageUrl: '/foo',
        healthCheckUrl: '/foo',
        homePageUrl: '/',
        instanceId: 'myApp:123',
      };

      const instance = utils.createInstanceObject(instanceOptions);
      expect(instance.hostName).toEqual(instanceOptions.hostName);
      expect(instance.ipAddr).toEqual(instanceOptions.ipAddr);
      expect(instance.port).toEqual(instanceOptions.port);
      expect(instance.securePort).toEqual(instanceOptions.securePort);
      expect(instance.dataCenterInfo).toEqual(instanceOptions.dataCenterInfo);
      expect(instance.statusPageUrl).toEqual(instanceOptions.statusPageUrl);
      expect(instance.healthCheckUrl).toEqual(instanceOptions.healthCheckUrl);
      expect(instance.homePageUrl).toEqual(instanceOptions.homePageUrl);
      expect(instance.app).toEqual(instanceOptions.app);
      expect(instance.metadata).toEqual({ instanceId: instanceOptions.instanceId });
    });

    it('converts port and securePort to objects if they are numbers', () => {
      const instanceOptions = { port: 3000, securePort: 3001 };
      const instance = utils.createInstanceObject(instanceOptions);
      expect(instance.port).toEqual({ $: 3000, '@enabled': true });
      expect(instance.securePort).toEqual({ $: 3001, '@enabled': true });
    });
  });
});