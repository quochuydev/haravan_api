const timeout = (time) => { return new Promise(setTimeout(resolve, time)) }

module.exports = { timeout }