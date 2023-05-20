CREATE TABLE user_account (
    id serial primary key,
    google_id varchar(32),
    email varchar(128),
    create_timestamp timestamp,
    modify_timestamp timestamp
);

CREATE TABLE track (
    id serial primary key,
    orig_price varchar(32),
    curr_price varchar(32),
    price_url varchar(2048),
    price_div varchar(2048),
    product_name varchar(64),
    userid integer references user_account(id),
    email varchar(128),
    email_sent boolean,
    active boolean,
    create_timestamp timestamp,
    modify_timestamp timestamp
);
