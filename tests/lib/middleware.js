import expect from 'expect';
import express from 'express';
import rp from 'request-promise';
import createEurekaMiddleware from '../../src/lib/middleware';
import { createInstanceObject } from '../../src/lib/utils';

const serverPort = 10438;

describe('middleware', () => {
  let server;

  before(done => {
    server = express();
    const instance = createInstanceObject();
    server.use(createEurekaMiddleware(instance));
    server = server.listen(serverPort, done);
  });

  after(() => {
    server.close();
  });

  it('returns a function', () => {
    expect(createEurekaMiddleware(createInstanceObject())).toBeA(Function);
  });

  it('responds to the correct endpoints', (done) => {
    const uris = ['info', 'metrics', 'env', 'health'].map(endpoint => `http://localhost:${serverPort}/${endpoint}`);
    Promise.all(uris.map(uri =>
      rp(uri).then(res => expect(res).toExist())
    )).then(() => done()).catch(done);
  });

  it('ignores non-eureka endpoints', (done) => {
    rp(`http://localhost:${serverPort}/foo`).catch(err => expect(err).toBeAn(Error)).catch(done).then(() => done());
  });
});
