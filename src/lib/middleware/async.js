const logger = require('@evershop/evershop/src/lib/log/logger');
const { debug } = require('@evershop/evershop/src/lib/log/debuger');
const { setDelegate } = require('./delegate');

// eslint-disable-next-line no-multi-assign
module.exports = exports = {};

exports.asyncMiddlewareWrapper = async function asyncMiddlewareWrapper(
  id,
  middlewareFunc,
  request,
  response,
  delegates,
  next
) {
  const startTime = process.hrtime();
  const debuging = {
    id
  };
  response.debugMiddlewares.push(debuging);
  try {
    // If the middleware function has the next function as a parameter
    let delegate;
    if (middlewareFunc.length === 4) {
      delegate = middlewareFunc(request, response, delegates, (error) => {
        const endTime = process.hrtime(startTime);
        debuging.time = endTime[1] / 1000000;
        next(error);
      });
    } else {
      delegate = middlewareFunc(request, response, delegates);
      const endTime = process.hrtime(startTime);
      debuging.time = endTime[1] / 1000000;
    }
    setDelegate(id, delegate, request);
    await delegate;
  } catch (e) {
    // Log the error
    logger.log('error', `Exception in middleware ${id}`, {
      message: e.message,
      stack: e.stack
    });
    debug('critical', `Exception in middleware ${id}`);
    // Call error handler middleware if it is not called yet
    next(e);
  }
};
