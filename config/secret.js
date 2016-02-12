module.exports= {
  database: 'mongodb://lukeg:luke@ds051595.mongolab.com:51595/griffith_brew',
  port: 3000,
  secretKey: 'watwatwat',



  facebook: {
    clientID: process.env.FACEBOOK_ID || '1039851129409049',
    clientSecret: process.env.FACEBOOK_SECRET || 'a00da864898fe4d6ace1c90b268f6852',
    profileFields: ['emails', 'displayName'],
    callbackURL: 'http://localhost:3000/auth/facebook/callback'
  }


}