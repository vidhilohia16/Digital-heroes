# Digital Heroes

This is a full-stack web application that combines golf performance tracking, charity fundraising, and monthly prize draws. The platform enables users to subscribe, manage golf scores, contribute to charities, and participate in reward draws, while providing administrators with complete control over users, charities, draws, and winner verification.

## Tech Stack

* React + Vite
* Express.js
* Supabase (Authentication & Database)
* REST APIs
* JWT Authentication

## Features

### User Features

* User registration and login
* Monthly and yearly subscription plans
* Golf score management (latest 5 Stableford scores)
* Charity selection and contribution tracking
* Monthly prize draw participation
* Dashboard showing subscription status, scores, charity, draws, and winnings

### Admin Features

* User management
* Charity CRUD operations
* Draw simulation and publishing
* Winner verification
* Prize payout tracking
* Dashboard analytics

## Authentication

* JWT-based authentication using Supabase Auth
* Protected API routes using Bearer Tokens
* Role-based access control for administrators

## Database

Supabase PostgreSQL is used as the primary database. During local development, the backend also supports a JSON-based mock database as a fallback.

## Project Structure

client/

* React frontend

server/

* Express backend
* REST APIs
* Authentication
* Business logic

database/

* Database schema and SQL
