const Hapi = require('hapi');
const code = require('code');
const lab = exports.lab = require('lab').script();
const hapiSlow = require('../index.js');
const util = require('util');
const fs = require('fs');

const payload = {
  data: {
    message: 'Uncaught ReferenceError: callNoFunction is not defined',
    lineNumber: 3,
    columnNumber: 80,
    filename: 'http://localhost:3000/',
    errorMessage: 'callNoFunction is not defined',
    stack: 'ReferenceError: callNoFunction is not defined\n    at HTMLAnchorElement.onclick (http://localhost:3000/:3:80)',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.84 Safari/537.36',
    location: 'http://localhost:3000/'
  },
  tags: ['browser-error']
};

const payloadNoUA = {
  data: {
    message: 'Uncaught ReferenceError: callNoFunction is not defined',
    lineNumber: 3,
    columnNumber: 80,
    filename: 'http://localhost:3000/',
    errorMessage: 'callNoFunction is not defined',
    stack: 'ReferenceError: callNoFunction is not defined\n    at HTMLAnchorElement.onclick (http://localhost:3000/:3:80)',
    location: 'http://localhost:3000/'
  },
  tags: ['browser-error']
};

let server;

lab.beforeEach((done) => {
  server = new Hapi.Server({
    debug: {
      log: ['hapi-slow']
    },
    host: 'localhost',
    port: 8000
  });
});

lab.afterEach(async (done) => {
  await server.stop();
});

lab.test('logs error', { timeout: 5000 }, async () => {
  const statements = [];

  server.events.on('log', (logObj) => {
    code.expect(logObj.tags).to.include('browser-error');
    code.expect(logObj.tags).to.include('error');
    code.expect(typeof logObj.data).to.equal('object');
    code.expect(logObj.data.data.message).to.include('Uncaught ReferenceError');
    code.expect(typeof logObj.data.data.location).to.not.equal(undefined);
    statements.push(logObj.data);
  });

  await server.register({
    plugin: hapiSlow,
    options: {
      threshold: 10,
      tags: ['error']
    }
  });

  const response = await server.inject({
    method: 'POST',
    url: '/api/browser-log',
    payload
  });

  code.expect(response.statusCode).to.equal(200);
  code.expect(statements.length).to.equal(1);
  code.expect(statements[0].data.message).to.include('Uncaught ReferenceError');
});

lab.test('logs error without UA', { timeout: 5000 }, async () => {
  const statements = [];

  server.events.on('log', (logObj) => {
    code.expect(logObj.tags).to.include('browser-error');
    code.expect(logObj.tags).to.include('error');
    code.expect(typeof logObj.data).to.equal('object');
    code.expect(logObj.data.data.message).to.include('Uncaught ReferenceError');
    code.expect(typeof logObj.data.data.location).to.not.equal(undefined);
    statements.push(logObj.data);
  });

  await server.register({
    plugin: hapiSlow,
    options: {
      threshold: 10,
      tags: ['error']
    }
  });

  const response = await server.inject({
    method: 'POST',
    url: '/api/browser-log',
    payload: payloadNoUA
  });

  code.expect(response.statusCode).to.equal(200);
  code.expect(statements.length).to.equal(1);
  code.expect(statements[0].data.message).to.include('Uncaught ReferenceError');
});

lab.test('invalid request', { timeout: 5000 }, async () => {
  const statements = [];

  server.events.on('log', (logObj) => {
    statements.push(logObj.data);
  });

  await server.register({
    plugin: hapiSlow,
    options: {
      threshold: 10,
      tags: ['error']
    }
  });

  const response = await server.inject({
    method: 'POST',
    url: '/api/browser-log',
    payload: { }
  });

  code.expect(response.statusCode).to.equal(200);
  code.expect(statements.length).to.equal(0);

  const response2 = await server.inject({
    method: 'POST',
    url: '/api/browser-log'
  });

  code.expect(response2.statusCode).to.equal(200);
  code.expect(statements.length).to.equal(0);
});

lab.test('supports ignore', { timeout: 5000 }, async () => {
  const statements = [];

  server.events.on('log', (logObj) => {
    statements.push(logObj.data);
  });

  await server.register({
    plugin: hapiSlow,
    options: {
      threshold: 10,
      tags: ['error'],
      ignore: [
        { message: 'Uncaught' }
      ]
    }
  });

  const response = await server.inject({
    method: 'POST',
    url: '/api/browser-log',
    payload
  });

  code.expect(response.statusCode).to.equal(200);
  code.expect(statements.length).to.equal(0);
});

lab.test('ignore not valid', { timeout: 5000 }, async () => {
  const statements = [];

  server.events.on('log', (logObj) => {
    statements.push(logObj.data);
  });

  await server.register({
    plugin: hapiSlow,
    options: {
      threshold: 10,
      tags: ['error'],
      ignore: 'Uncaught'
    }
  });

  const response = await server.inject({
    method: 'POST',
    url: '/api/browser-log',
    payload
  });

  code.expect(response.statusCode).to.equal(200);
  code.expect(statements.length).to.equal(1);
});

lab.test('serves script', { timeout: 5000 }, async () => {
  await server.register(require('inert'));
  await server.register({
    plugin: hapiSlow,
    options: {
      threshold: 10,
      tags: ['error'],
      ignore: 'Uncaught',
      serveScript: true
    }
  });

  const response = await server.inject({
    method: 'GET',
    url: '/hapi-browser-log.js',
    payload
  });

  const actualScript = await util.promisify(fs.readFile)('./lib/browser/script.js');

  code.expect(response.statusCode).to.equal(200);
  code.expect(actualScript.toString()).to.equal(response.result);
});
