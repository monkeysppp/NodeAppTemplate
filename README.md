# AppTemplate

## Overview
This represents a Node app that uses MySQL and passport for user authentication and authorization, JWT for user identity and double submit cookies for CSRF protection.

### Adding a user
Users are stored in a MySQL database (on the server) in a table called 'users'.  

```
node ./bin/addUser.js [databaseName] [databaseUser] [username]
```

### Running the server
To run the server, follow these simple steps:

```
npm install
node .
```
