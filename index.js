'use strict';
const net = require('net');

const isAvailable = options => new Promise((resolve, reject) => {
	const server = net.createServer();
	server.unref();
	server.on('error', reject);
	server.listen(options, () => {
		const {port} = server.address();
		server.close(() => {
			resolve(port);
		});
	});
});

const getPort = options => {
	options = Object.assign({}, options);

	if (typeof options.port === 'number') {
		options.port = [options.port];
	}

	return (options.port || []).reduce(
		(seq, port) => seq.catch(
			() => isAvailable(Object.assign({}, options, {port}))
		),
		Promise.reject()
	);
};

const fromRange = (from, to) => {
	if (from < 1024) {
		throw new RangeError(`Lowest port range limit must not be below 1024. Received: ${from}`);
	}

	if (to - from <= 0) {
		throw new RangeError(`Port range upper limit must not be lower than the lowest one. Received: [${from}, ${to}]`);
	}

	const range = Array.from({ length: to - from }, (_, i) => i + from);

	return getPort({ port: range });
}

module.exports = options => options ?
	getPort(options).catch(() => getPort(Object.assign(options, {port: 0}))) :
	getPort({port: 0});
module.exports.fromRange = fromRange;
module.exports.default = module.exports;
