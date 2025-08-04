-- Create a role for the application
CREATE ROLE blockbootstrap_user WITH LOGIN PASSWORD 'secure_password';

-- Grant necessary privileges to the role
GRANT ALL PRIVILEGES ON DATABASE blockbootstrap_db TO blockbootstrap_user;

-- Create the database
CREATE DATABASE blockbootstrap_db OWNER blockbootstrap_user;

-- Connect to the database to create the table
\c blockbootstrap_db

-- Create the users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    first_login_date TIMESTAMP,
    last_login_date TIMESTAMP,
    code INTEGER CHECK (code >= 100000 AND code <= 999999) NOT NULL
);

-- Grant privileges on the table to the role
GRANT ALL PRIVILEGES ON TABLE users TO blockbootstrap_user;