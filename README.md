# Med3D
Web based 3D medical data visualization tool.

## Setup Guide

Med3D requires [Node.js](https://nodejs.org/) and [MongoDB](https://www.mongodb.com/) to run.

Install the dependencies, setup the database and run NodeJS application.
```sh
$ # Setup database (do not forget to add path to MongoDB binaries to your PATH variable).
$ mkdir database
$ mongod --dbpath ./database
$ # Start server application.
$ cd src_server
$ node index.js
$ # Web application should be hosted on: <YOUR IP>:8080/web
```

## Host Resources
Application currently supports hosting of .obj and .raw/.mhd files.
```sh
# Host .obj mesh files by copying them in:
src_server/database_init_resources/obj
# Host .mhd/.raw volume files by copying them in:
src_server/database_init_resources/mhd
# Note: .mhd and .raw volume files must have a matching name
```
