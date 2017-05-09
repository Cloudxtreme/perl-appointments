CREATE TABLE "Appointments" (
	`Appointment_Id`	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
	`Appointment_Epoch`	INTEGER NOT NULL,
	`Appointment_Description`	TEXT NOT NULL
)