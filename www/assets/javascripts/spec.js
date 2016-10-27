// Client-side tests
describe('Login', function() {
  before(function() {
    // 
  });

  describe('setup', function(done) {
    it('should be triggered by an event', function(){
      EWD.on('ewd-registered', function() {
        done();
      });
    });
  });
  
  after(function() {
    // 
  });
});
