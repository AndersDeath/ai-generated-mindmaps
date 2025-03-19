# AI Generated Mind Maps

# Table of Contents

- [AI Generated Mind Maps](#ai-generated-mind-maps)
  - [Preface](#preface)
  - [Installation](#installation)
  - [Run](#run)
  - [Setting up pgAdmin and PostgreSQL Server](#setting-up-pgadmin-and-postgresql-server)
  - [Application](#application)
    - [API Documentation](#api-documentation)
    - [Mindmap Data Structure](#mindmap-data-structure)
    - [Database Structure](#database-structure)
  - [Test Tasks Related Note (Future Steps)](#test-tasks-related-note-future-steps)
  - [Google Cloud Notes](#google-cloud-notes)

## Preface

The application is based on:

1. Nestjs Framework
2. PostgreSQL
3. OpenAI Api

The live version of the application is available on: http://51.75.64.52:3000/api

## Installation

1. Clone this repository
2. Run `npm install`
3. Create a copy of .env.sample as .env
4. Put your credentials to .env You need.
   1. OPENAI_API_KEY=your_openai_api_key
   2. PORT=port_number
   3. PG_HOST=db
   4. PG_PORT=5432
   5. PG_USERNAME=username
   6. PG_PASSWORD=password
   7. PG_DATABASE=database

## Run

You can install your PostrgeSQL and connect to it, but I recommend use Docker compose. You need to install it to your machine and then run `docker compose up`.
When the application is successfully run you can get an access to following urls

1. localhost:3000 - Nestjs application
2. localhost:5432 - PostgreSQL database address
3. localhost:5050 - PgAdmin

If you use this approach you need to scroll down to pgAdmin setup section and create Postgresql server

## Setting up pgAdmin and PostgreSQL Server

1. Open PgAdmin in the web browser by visiting http://localhost:5050 (assuming we're using the default configuration in the docker-compose.yml file).
2. Log in using your email and password in the docker-compose.yml file for the pgadmin service.
3. In the left-hand sidebar, click Servers to expand the Servers menu.
4. Right-click on Servers and select Register -> Server.
5. In the General tab of the Create - Server dialog, we can give the server a name of our choice.
6. In the Connection tab, fill in the following details:

```Host name/address: db
    Port: 5432
    Maintenance database: postgres
    Username: postgres
    Password: postgres
```

## Application

The application is designed as microservice that gets csv file and generates mindmaps structures that can be used on Client for generating mindmaps.

1. API documentation is available as Swagger on this address: http://localhost:3000/api#/
2. Mindmap data structure looks like this:

```json
{
  "subject": "subject",
  "topic": "topic",
  "schemaVersion": 1,
  "subtopics": [
    {
      "name": "name",
      "subtopics": [{ "name": "name" }, { "name": "name" }]
    }
  ]
}
```
It supports versioning, you can find data models in mind-map.model.ts file.

2. DB structure

There is one table in Database, the entity is in mind-map.entity.ts file.

```typescript
@Entity()
export class MindMap {
  @PrimaryGeneratedColumn('uuid')
  uuid: UUID;

  @Column()
  subject: string;

  @Column()
  topic: string;

  @Column('jsonb', { nullable: false, default: {} })
  mindMap: any;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  dataCreate?: Date;
}
```

## Test tasks related note (future steps)

1. I wrote some tests but didn't have time for all of them. I would cover the application at least on 70%-80%.
2. I would expand documentation and work more on error handling. I provided a couple of example in the task but it's not enough for production. The same is about logging.

## Google cloud Notes

I could not run the application on google cloud because I could not build it properly. I didn't have enough time to debug this. Howevers I would like to describe what I did.

1. Created PostgreSQL instance
2. Created all secrets
3. Created artifact storage
4. Created Cloud run instance and connected it to github repository

Even that I didn't have time to solve it I decided to deploy the application somewhere for demonstration. It's available on

1. http://51.75.64.52:3000/api - application
2. http://51.75.64.52:5050 - pg admin.
