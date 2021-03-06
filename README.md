# AppTemplate

## Overview
This is a base template for a Node app that uses MySQL and passport for user authentication and authorization, JWT for user identity and double submit cookies for CSRF protection.

### Adding a user
Users are stored in a MySQL database (on the server) in a table called 'users' (which is created if it doesn't exist).   The database must exist and give creation rights to 'databaseUser' before running the command.

```
node ./bin/addUser.js [databaseName] [databaseUser] [username]
```

### Installing the code
To install the code, run:

```
npm install
```

Then make sure you have a public/private key pair.

### Running the server
To run the server, follow these simple steps:

```
npm start
```

### Developed with help from...
 - http://www.html5rocks.com/en/tutorials/security/content-security-policy/
 - http://stackoverflow.com/questions/20228572/passport-local-with-node-jwt-simple
 - https://orchestrate.io/blog/2014/06/26/build-user-authentication-with-node-js-express-passport-and-orchestrate/
 - http://toon.io/on-passportjs-specific-use-cases/
