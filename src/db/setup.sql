-- Create a role for the application
CREATE ROLE blockbootstrap_user WITH LOGIN PASSWORD 'secure_password';

-- Create the database
CREATE DATABASE blockbootstrap_db
-- Connect to the database to create the table
\c blockbootstrap_db
-- grant public schema 
GRANT CREATE ON SCHEMA public TO blockbootstrap_user;

-- Create the users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    first_login_date TIMESTAMP,
    last_login_date TIMESTAMP,
    code INTEGER CHECK (code >= 100000 AND code <= 999999) NOT NULL
);