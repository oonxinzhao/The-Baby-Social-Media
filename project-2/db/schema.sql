create database babyapp;

create table users (
  id serial primary key,
  baby_name text,
  email text,
  password_digest text
  
);

create table babytracker (
  user_id int,
  id serial primary key,
  image_url text,
  comment text,
  date date default current_date,
  CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES users (id)
);



