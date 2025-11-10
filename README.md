# HighLevel

Database schema:

CREATE TABLE resources (
id INT AUTO_INCREMENT PRIMARY KEY,
name VARCHAR(100) NOT NULL,
UNIQUE KEY idx_resource_name (name)
) ENGINE=InnoDB;

CREATE TABLE appointments (
id INT AUTO_INCREMENT PRIMARY KEY,
resource_id INT NOT NULL,
title VARCHAR(100),
start_time DATETIME NOT NULL,
end_time DATETIME NOT NULL,
recurrence_rule TEXT NULL, -- RFC5545 string
created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (resource_id) REFERENCES resources(id)
ON DELETE CASCADE ON UPDATE CASCADE,

KEY idx_resource_time (resource_id, start_time, end_time),
KEY idx_start_end (start_time, end_time),
KEY idx_created (created_at)
) ENGINE=InnoDB;

CREATE TABLE appointment_exceptions (
id INT AUTO_INCREMENT PRIMARY KEY,
appointment_id INT NOT NULL,
exception_date DATETIME NOT NULL,
reason VARCHAR(255) NULL,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (appointment_id) REFERENCES appointments(id)
ON DELETE CASCADE ON UPDATE CASCADE,

UNIQUE KEY uniq_exception (appointment_id, exception_date),
KEY idx_appointment (appointment_id),
KEY idx_exception_date (exception_date)
) ENGINE=InnoDB;

STEPS TO RUN:
npm i
npm run start:dev

Create Asset:

curl --location 'localhost:8080/assets/create' \
--header 'Content-Type: application/json' \
--data '{
"name": "Meeting room 1"
}'

Create Appointment:

curl --location 'localhost:8080/appointments/create' \
--header 'Content-Type: application/json' \
--data '{
"resource_id": 1,
"title": "Weekly Sync",
"start_time": "2025-11-10T08:00:00",
"end_time": "2025-11-10T09:00:00",
"recurrence": {
"freq": "DAILY",
"interval": 2
}
}'

Get availability:

curl --location 'localhost:8080/assets/get-availability?resource_id=1&start=2025-11-10T01%3A00%3A00Z&end=2025-11-12T23%3A00%3A00Z'

Add exception to appointment:

curl --location 'localhost:8080/appointments/create-exception' \
--header 'Content-Type: application/json' \
--data '{
"id": 9,
"exception_date": "2025-11-11T12:00:00",
"reason": "Holiday"
}'
