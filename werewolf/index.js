// For development/testing purposes
exports.handler = function(event, context, callback) {
  console.debug('Running index.handler');
  console.debug('==================================');
  console.debug('event', event);

  console.log('creating game room');

  console.debug('==================================');
  console.debug('Stopping index.handler');
  callback( null, event ); // Echo back the event
  // or
  // callback( 'some error type' );
};
