DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS likes;
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS friends;
DROP TABLE IF EXISTS G_likes;
DROP TABLE IF EXISTS G_comments;
DROP TABLE IF EXISTS G_posts;
DROP TABLE IF EXISTS G_mods;
DROP TABLE IF EXISTS user_groups;
DROP TABLE IF EXISTS groups;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS auth;

CREATE TABLE auth(
    id SERIAL PRIMARY KEY NOT NULL UNIQUE,
    Email varchar(255) NOT NULL ,
    pass text NOT NULL,
    token varchar(255),
    user_role varchar(255),
    verified boolean DEFAULT false
);
CREATE TABLE users(
  id SERIAL PRIMARY KEY,
  firstName varchar(255) NOT NULL,
  lastName varchar(255) NOT NULL,
  age int,
  gender varchar(255),
  auth_id SERIAL NOT NULL UNIQUE,
  FOREIGN KEY (auth_id) REFERENCES auth(id) ON DELETE CASCADE
);
CREATE TABLE friends(
    id SERIAL PRIMARY KEY,
    receiver int NOT NULL,
    sender int NOT NULL,
    FOREIGN KEY (sender) REFERENCES users(auth_id) ON DELETE CASCADE,
    FOREIGN KEY (receiver) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE posts(
    id SERIAL PRIMARY KEY,
    content text,
    poster_id int NOT NULL UNIQUE,
    FOREIGN KEY (poster_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE comments(
    id SERIAL PRIMARY KEY,
    content text,
    commenter_id int,
    post_id int,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (commenter_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE likes(
    id SERIAL PRIMARY KEY,
    liker int NOT NULL,
    post_id int NOT NULL,
    FOREIGN KEY (liker) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE TABLE messages(
    id SERIAL PRIMARY KEY,
    content text,
    receiver int NOT NULL,
    sender int NOT NULL,
    FOREIGN KEY (sender) REFERENCES users(auth_id) ON DELETE CASCADE,
    FOREIGN KEY (receiver) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE groups(
    id SERIAL PRIMARY KEY,
    group_name varchar(255)
);

CREATE TABLE user_groups(
    id SERIAL PRIMARY KEY,
    group_id int NOT NULL UNIQUE,
    member_id int NOT NULL UNIQUE,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE G_posts(
    id SERIAL PRIMARY KEY,
    content text,
    G_member_id int NOT NULL UNIQUE,
    G_groups_id int NOT NULL UNIQUE,
    FOREIGN KEY (G_member_id) REFERENCES user_groups(member_id) ON DELETE CASCADE,
    FOREIGN KEY (G_groups_id) REFERENCES user_groups(group_id) ON DELETE CASCADE
);
CREATE TABLE G_likes(
    id SERIAL PRIMARY KEY,
    G_liker int NOT NULL,
    G_post_id int NOT NULL,
    FOREIGN KEY (G_liker) REFERENCES user_groups(member_id) ON DELETE CASCADE,
    FOREIGN KEY (G_post_id) REFERENCES G_posts(id) ON DELETE CASCADE
);
CREATE TABLE G_comments(
    id SERIAL PRIMARY KEY,
    content text,
    G_commenter_id int,
    G_post_id int,
    FOREIGN KEY (G_commenter_id) REFERENCES user_groups(member_id) ON DELETE CASCADE,
    FOREIGN KEY (G_post_id) REFERENCES G_posts(id) ON DELETE CASCADE
);

CREATE TABLE G_mods(
    id SERIAL PRIMARY KEY,
    G_role varchar(255),
    group_id int,
    member int,
    FOREIGN KEY (group_id) REFERENCES groups(id),
    FOREIGN KEY (member) REFERENCES user_groups(member_id)
)