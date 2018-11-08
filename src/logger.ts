let winston = require('winston');

const transports = [
    new winston.transports.Console({
        name: 'console',
        level: 'debug'
    })
];

export default new winston.Logger({transports});
