# Bastyon Network/Node Explorer

## Overview

This is a web application aimed at visualizing the health and status of the Bastyon (aka Pocketnet) distributed social network. This application will crawl all the seed servers and their peers, then their peers peers, and so on in a recursive fashion until the entire network has been enumerated. The data is then visualized in a number of ways including a table list of all nodes and a graph view (not very useful at the moment). There is also a rudimentary block explorer built in, so queries can be issued against a particular node.

## Setting up locally

You can run this application fully locally, or in a cloud-hosted environment that supports NodeJS. The steps below will outline how to run this on your local server.

### Compatibility

This application should run on any system that supports NodeJS. It has been tested on Windows, and macOS. It has not been explicitly tested on Linux yet, but I'm fairly confident it should run as-is.

### Prerequisites

There's a few important pre-requisites needed. The most important is a database for this application to store its data. Currently, the only database this app supports is MongoDB. Hypothetically it could be re-written to support others. This application does not need a large database, but it is very "chatty" and causes lots of IO on the underlying database. All that being said, I've been running the live site at <http://www.bastyonnodes.com> on the free tier of hosted MongoDB Atlas, and the almost free-tier of Microsoft Azure cloud, and it runs without issues.

* MongoDB database version 6 or greater (tested up to major version 7).
* NodeJS version 20.11 and NPM version 8.19 or greater.

### Cloning/installing

1. Open a command prompt/terminal. `cd` to the folder where you want to store code and run:
2. `git clone https://github.com/dmaltsiniotis/pocketnet.explorer`
3. `cd pocketnet.explorer`
4. `npm install`

### Configuring

In the `pocketnet.explorer` folder you will find a file called `.env.example`. You will need to copy and rename this file to just `.env`. Open this `.env` file and you will be presented with a number of configuration options.

The two settings that need to be configured correctly are `DB_URI` and `RUN_JOBS`.

#### DB_URI

This should point to your MongoDB instance, weather it's hosted locally or in the cloud with something like MongoDB Atlas. The default value assumes you're running an instance of MongoDB locally.

#### RUN_JOBS

This setting controls weather or not the server will auto-update all the nodes every ten minutes or not. This is defaulted to false for local development and servers because often during development you don't want automated things to kick off in the middle of working on them. However, if this is being hosted locally for use rather than development, you will want to change this to true so the system can run automatically.

#### APP_LOG_LEVEL

If you want to see all the low-level nitty-gritty logs and debugging info, change `APP_LOG_LEVEL` from `INFO` to `DEBUG` (and restart the app if it's running). The supported APP_LOG_LEVEL values are:

* NONE
* ERROR
* WARNING
* INFO
* DEBUG

#### All others

All the other settings are timing-related and are explained in the .env file as comments.

### Running

Even though this applications front-end was built on vue3, a traditionally "transpiled" JavaScript/Typescript framework, I have hacked the heck out of it so that no "build" step is needed when making UI changes. Everything runs 100% on the client side, and changes immediately reflected with a simple browser refresh. This does have some drawbacks (large web/client payloads) but the advantages of simple change/f5 development workflow outweigh those in my opinion.

#### Start the service

You can run the app in normal mode, or in development mode which will watch for file changes and auto-restart. If you're not actively developing the app, you can start the app by issuing the following command:

```bash
npm run start
```

Alternatively, if you're making changes to the code and wish to restart the app automatically, run:

```bash
npm run dev
```

To stop the application, press ctrl-c in the terminal window where you started it.

#### Navigate to the service

Once the service is started in your terminal, you can navigate to: <http://localhost:8088> to view the site.

## API

The website is 100% API driven. All operations to query nodes, update nodes, remove nodes, add seed nodes etc..., are done via HTTP GET and POST calls.

### A Warning First

 The API implemented is rudimentary with no user access controls / permissions / logins etc... All methods are 100% open to the public, so take that for what it is. This site was never intended to host anything confidential or personal in nature.

### Use

There are a couple dozen API calls, however only a couple of them are needed to get started. They are:

#### newnodes

The `newnodes` endpoint will add initial/seed nodes to the database, so that the jobs can start crawling the network. Initially the database is empty, so it needs some nodes to get started with. This can be your node, or it can be the default "seed" nodes which are derived the Pocketnetd source code.

Usage:

```none
URI: `http://localhost:38090/newnodes`
Method: POST
Content type: application/json
Body example:
{
    "ips": [
        "135.181.196.243",
        "65.21.56.203",
        "178.217.159.227",
        "178.217.159.221",
        "65.21.252.135",
        "92.119.112.150",
        "202.61.253.55",
        "50.65.56.253",
        "109.197.196.106",
        "79.143.35.233",
        "95.31.45.162"
    ]
}
```

#### clearnodes

The `clearnodes` endpoint will completely delete all node data in the database. Useful for doing a full re-set and getting all fresh data. In practice, you shouldn't need to call this, however I have found that after weeks and months of running, the list of "dead" nodes piles up quite a bit.

```none
URI: `http://localhost:38090/clearnodes`
Method: GET
Content type: N/A
Body: None
```

#### refreshallnodes



#### refreshallnodestatuses

## Setting up in a hosted environment

This application was designed to be hosted/run on any platform that supports NodeJS apps, and is currently tested by deployed to the Microsoft Azure cloud as an App Service.
