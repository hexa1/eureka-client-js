import expect from 'expect';
import EurekaClient from '../src/index.js';

describe('main export', () => {
  it('is exported', () => {
    expect(EurekaClient).toNotBe(null);
    expect(EurekaClient).toNotBe(undefined);
  });

  it('exports a function (class)', () => {
    expect(EurekaClient).toBeA(Function);
  });
});
