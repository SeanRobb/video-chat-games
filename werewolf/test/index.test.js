const chai = require('chai');
const assert = chai.assert;
const index = require('../index.js');

describe('Index', () => {
  it('Callback returns successfully', (done) => {
    index.handler({}, {}, (error, response) =>{
      assert.isNull(error);
      assert.isNotNull(response);
      done();
    });
  });
});
