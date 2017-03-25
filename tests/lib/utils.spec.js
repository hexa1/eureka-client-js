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

    it('disables port and securePort if they are null or undefined', () => {
      let instance = utils.createInstanceObject({ port: null, securePort: null });
      expect(instance.port).toEqual({ $: null, '@enabled': 'false' });
      expect(instance.securePort).toEqual({ $: null, '@enabled': 'false' });
      instance = utils.createInstanceObject({});
      expect(instance.port).toEqual({ $: null, '@enabled': 'false' });
      expect(instance.securePort).toEqual({ $: null, '@enabled': 'false' });
    });

    it('converts port and securePort to objects if they are numbers', () => {
      const instanceOptions = { port: 3000, securePort: 3001 };
      const instance = utils.createInstanceObject(instanceOptions);
      expect(instance.port).toEqual({ $: 3000, '@enabled': 'true' });
      expect(instance.securePort).toEqual({ $: 3001, '@enabled': 'true' });
    });

    it('sets @enabled to String(true), not a boolean, on port and securePort', () => {
      const instanceOptions = { port: 3000, securePort: 3001 };
      const instance = utils.createInstanceObject(instanceOptions);
      expect(instance.port['@enabled']).toEqual('true');
      expect(instance.securePort['@enabled']).toEqual('true');
    });

    it('sets vipAddress to the app name if not already set', () => {
      const instanceOptions = { app: 'myApp' };
      const instance = utils.createInstanceObject(instanceOptions);
      expect(instance.vipAddress).toEqual(instanceOptions.app);
    });

    it('sets homePageUrl, statusPageUrl and healthCheckUrl if not already set', () => {
      let instance = utils.createInstanceObject({ securePort: 443, hostName: 'app.com' });
      expect(instance.homePageUrl).toEqual('https://app.com:443');
      expect(instance.statusPageUrl).toEqual('https://app.com:443/info');
      expect(instance.healthCheckUrl).toEqual('https://app.com:443/health');

      instance = utils.createInstanceObject({ homePageUrl: 'custom.com', statusPageUrl: 'customstatus.com', healthCheckUrl: 'customhealth.com' });
      expect(instance.homePageUrl).toEqual('custom.com');
      expect(instance.statusPageUrl).toEqual('customstatus.com');
      expect(instance.healthCheckUrl).toEqual('customhealth.com');
    });
  });
});
