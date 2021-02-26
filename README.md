# WiseISP Web App

This is a NodeJS/Angular application that lets WiseISP users view current and previous data usage for a specific registered mobile number.

## Prerequisites
1. NodeJS
2. Git


## Configure
Create a a file in the root directory and name it `.env` with the following content in it
```yaml
PORT=8080
DB_USER=xxx
DB_PASS=xxx
DB=xxx
RAD_USER=xxx
RAD_PASS=xxx

```

## Install dependencies & run
```shell
git clone git@github.com:oreaio/wise-app.git
npm install
node index.js
```

Server will be running on port 8080 by default http://localhost:8080
