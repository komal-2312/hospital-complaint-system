CREATE TABLE hospitals (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150),
  address TEXT,
  contact VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE departments (
  id SERIAL PRIMARY KEY,
  hospital_id INT REFERENCES hospitals(id),
  name VARCHAR(100),
  description TEXT
);

CREATE TABLE locations (
  id SERIAL PRIMARY KEY,
  hospital_id INT REFERENCES hospitals(id),
  department_id INT REFERENCES departments(id),
  name VARCHAR(100),
  floor VARCHAR(50)
);

CREATE TABLE qr_codes (
  id SERIAL PRIMARY KEY,
  location_id INT REFERENCES locations(id),
  code VARCHAR(150) UNIQUE,
  active BOOLEAN DEFAULT TRUE
);

CREATE TABLE complaint_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  description TEXT,
  priority VARCHAR(20)
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(120) UNIQUE,
  password TEXT,
  phone VARCHAR(20),
  role VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE complaints (
  id SERIAL PRIMARY KEY,
  qr_id INT REFERENCES qr_codes(id),
  category_id INT REFERENCES complaint_categories(id),
  user_id INT REFERENCES users(id),
  description TEXT,
  priority VARCHAR(20),
  status VARCHAR(30),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);