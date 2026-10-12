CREATE DATABASE IF NOT EXISTS satva_db CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE satva_db;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS contactus_replies;
DROP TABLE IF EXISTS contactus_messages;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS prescription_items;
DROP TABLE IF EXISTS prescriptions;
DROP TABLE IF EXISTS medical_record_attachments;
DROP TABLE IF EXISTS medical_record_amendments;
DROP TABLE IF EXISTS medical_record_access;
DROP TABLE IF EXISTS medical_records;
DROP TABLE IF EXISTS telemedicine_sessions;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS appointment_status_history;
DROP TABLE IF EXISTS appointment_documents;
DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS patient_insurance_details;
DROP TABLE IF EXISTS family_members;
DROP TABLE IF EXISTS patients;
DROP TABLE IF EXISTS staff;
DROP TABLE IF EXISTS doctor_status;
DROP TABLE IF EXISTS doctor_leaves;
DROP TABLE IF EXISTS doctor_schedules;
DROP TABLE IF EXISTS doctor_qualifications;
DROP TABLE IF EXISTS doctor_specialties;
DROP TABLE IF EXISTS doctors;
DROP TABLE IF EXISTS admins;
DROP TABLE IF EXISTS specialties;
DROP TABLE IF EXISTS hospitals;
DROP TABLE IF EXISTS otp_verifications;
DROP TABLE IF EXISTS user_sessions;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- 1. users
CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('PATIENT', 'DOCTOR', 'ADMIN', 'STAFF', 'SUPER_ADMIN') NOT NULL,
  google_sub VARCHAR(255) DEFAULT NULL UNIQUE,
  is_active TINYINT(1) DEFAULT 1,
  is_email_verified TINYINT(1) DEFAULT 0,
  last_login_at DATETIME DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 2. user_sessions
CREATE TABLE user_sessions (
  session_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  refresh_token TEXT NOT NULL,
  device_info VARCHAR(255) DEFAULT NULL,
  ip_address VARCHAR(100) DEFAULT NULL,
  auth_provider ENUM('LOCAL', 'GOOGLE') DEFAULT 'LOCAL',
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 3. otp_verifications
CREATE TABLE otp_verifications (
  otp_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  otp_code VARCHAR(10) NOT NULL,
  purpose VARCHAR(50) DEFAULT 'PASSWORD_RESET',
  expires_at DATETIME NOT NULL,
  verified_at DATETIME DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_otp_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 4. hospitals
CREATE TABLE hospitals (
  hospital_id INT AUTO_INCREMENT PRIMARY KEY,
  hospital_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255) DEFAULT NULL,
  contact_number VARCHAR(50) NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 5. specialties
CREATE TABLE specialties (
  specialty_id INT AUTO_INCREMENT PRIMARY KEY,
  specialty_name VARCHAR(255) NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 6. admins
CREATE TABLE admins (
  admin_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  hospital_id INT DEFAULT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_admins_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
  CONSTRAINT fk_admins_hospital FOREIGN KEY (hospital_id) REFERENCES hospitals (hospital_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 7. doctors
CREATE TABLE doctors (
  doctor_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  hospital_id INT DEFAULT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  gender ENUM('MALE', 'FEMALE', 'OTHER') DEFAULT 'MALE',
  experience_years INT DEFAULT 0,
  consultation_fee DECIMAL(10, 2) DEFAULT 0.00,
  rating DECIMAL(3, 2) DEFAULT 5.00,
  currency_code VARCHAR(10) DEFAULT 'INR',
  bio TEXT DEFAULT NULL,
  profile_path VARCHAR(255) DEFAULT NULL,
  is_deactivated TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_doctors_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
  CONSTRAINT fk_doctors_hospital FOREIGN KEY (hospital_id) REFERENCES hospitals (hospital_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 8. doctor_specialties
CREATE TABLE doctor_specialties (
  doctor_specialty_id INT AUTO_INCREMENT PRIMARY KEY,
  doctor_id INT NOT NULL,
  specialty_id INT NOT NULL,
  UNIQUE KEY uk_doc_spec (doctor_id, specialty_id),
  CONSTRAINT fk_doc_spec_doc FOREIGN KEY (doctor_id) REFERENCES doctors (doctor_id) ON DELETE CASCADE,
  CONSTRAINT fk_doc_spec_spec FOREIGN KEY (specialty_id) REFERENCES specialties (specialty_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 9. doctor_qualifications
CREATE TABLE doctor_qualifications (
  qualification_id INT AUTO_INCREMENT PRIMARY KEY,
  doctor_id INT NOT NULL,
  degree VARCHAR(100) NOT NULL,
  graduation_year INT DEFAULT NULL,
  college_name VARCHAR(255) DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_doc_qual_doc FOREIGN KEY (doctor_id) REFERENCES doctors (doctor_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 10. doctor_schedules
CREATE TABLE doctor_schedules (
  schedule_id INT AUTO_INCREMENT PRIMARY KEY,
  doctor_id INT NOT NULL,
  working_date DATE NOT NULL,
  working_from TIME NOT NULL,
  working_to TIME NOT NULL,
  slot_duration INT DEFAULT 30,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_doc_date (doctor_id, working_date),
  CONSTRAINT fk_doc_sched_doc FOREIGN KEY (doctor_id) REFERENCES doctors (doctor_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 11. doctor_leaves
CREATE TABLE doctor_leaves (
  leave_id INT AUTO_INCREMENT PRIMARY KEY,
  doctor_id INT NOT NULL,
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  reason VARCHAR(255) DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_doc_leaves_doc FOREIGN KEY (doctor_id) REFERENCES doctors (doctor_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 12. doctor_status
CREATE TABLE doctor_status (
  doctor_status_id INT AUTO_INCREMENT PRIMARY KEY,
  doctor_id INT NOT NULL,
  from_ TIME NOT NULL,
  to_ TIME NOT NULL,
  status_date DATE NOT NULL,
  status ENUM('ON_LEAVE', 'BUSY', 'AVAILABLE') DEFAULT 'AVAILABLE',
  reason VARCHAR(255) DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_doc_status_doc FOREIGN KEY (doctor_id) REFERENCES doctors (doctor_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 13. staff
CREATE TABLE staff (
  staff_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  hospital_id INT DEFAULT NULL,
  staff_role ENUM('RECEPTIONIST', 'NURSE') DEFAULT 'RECEPTIONIST',
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  contact_number VARCHAR(50) NOT NULL UNIQUE,
  dob DATE DEFAULT NULL,
  gender ENUM('MALE', 'FEMALE', 'OTHER') DEFAULT 'MALE',
  address_line1 VARCHAR(255) DEFAULT NULL,
  address_line2 VARCHAR(255) DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_staff_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
  CONSTRAINT fk_staff_hospital FOREIGN KEY (hospital_id) REFERENCES hospitals (hospital_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 14. patients
CREATE TABLE patients (
  patient_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  country_code VARCHAR(10) DEFAULT '+91',
  mobile VARCHAR(20) NOT NULL,
  blood_group VARCHAR(10) DEFAULT NULL,
  profile_path VARCHAR(255) DEFAULT NULL,
  dob DATE NOT NULL,
  gender ENUM('MALE', 'FEMALE', 'OTHER') DEFAULT 'MALE',
  address_line1 VARCHAR(255) DEFAULT NULL,
  address_line2 VARCHAR(255) DEFAULT NULL,
  is_insured TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_patients_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 15. family_members
CREATE TABLE family_members (
  member_id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  relation VARCHAR(50) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  dob DATE DEFAULT NULL,
  mobile VARCHAR(20) DEFAULT NULL,
  email VARCHAR(255) DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_fam_patient FOREIGN KEY (patient_id) REFERENCES patients (patient_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 16. patient_insurance_details
CREATE TABLE patient_insurance_details (
  insurance_id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  policy_number VARCHAR(100) NOT NULL,
  policy_company VARCHAR(255) NOT NULL,
  policy_document_path VARCHAR(255) DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_patient_insurance (policy_number, policy_company),
  CONSTRAINT fk_ins_patient FOREIGN KEY (patient_id) REFERENCES patients (patient_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 17. appointments
CREATE TABLE appointments (
  appointment_id INT AUTO_INCREMENT PRIMARY KEY,
  doctor_id INT NOT NULL,
  patient_id INT NOT NULL,
  slot_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  chief_complaint TEXT DEFAULT NULL,
  appointment_type ENUM('IN_PERSON', 'TELEMEDICINE') DEFAULT 'IN_PERSON',
  appointment_status ENUM('PAYMENT_PENDING', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'RESCHEDULED', 'NO_SHOW', 'REJECTED') DEFAULT 'CONFIRMED',
  confirmation_no VARCHAR(100) NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_app_doctor FOREIGN KEY (doctor_id) REFERENCES doctors (doctor_id) ON DELETE CASCADE,
  CONSTRAINT fk_app_patient FOREIGN KEY (patient_id) REFERENCES patients (patient_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 18. appointment_documents
CREATE TABLE appointment_documents (
  document_id INT AUTO_INCREMENT PRIMARY KEY,
  appointment_id INT NOT NULL,
  document_name VARCHAR(255) NOT NULL,
  document_path VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_app_doc_app FOREIGN KEY (appointment_id) REFERENCES appointments (appointment_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 19. appointment_status_history
CREATE TABLE appointment_status_history (
  history_id INT AUTO_INCREMENT PRIMARY KEY,
  appointment_id INT NOT NULL,
  old_status VARCHAR(50) DEFAULT NULL,
  new_status VARCHAR(50) NOT NULL,
  changed_by_user_id INT DEFAULT NULL,
  remarks TEXT DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_app_hist_app FOREIGN KEY (appointment_id) REFERENCES appointments (appointment_id) ON DELETE CASCADE,
  CONSTRAINT fk_app_hist_user FOREIGN KEY (changed_by_user_id) REFERENCES users (user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 20. payments
CREATE TABLE payments (
  payment_id INT AUTO_INCREMENT PRIMARY KEY,
  appointment_id INT NOT NULL UNIQUE,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  payment_method ENUM('CASH', 'CARD', 'UPI', 'NET_BANKING', 'INSURANCE', 'ONLINE') DEFAULT 'CASH',
  transaction_id VARCHAR(100) DEFAULT NULL,
  status ENUM('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED') DEFAULT 'PENDING',
  refund_status TINYINT(1) DEFAULT 0,
  transaction_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pay_app FOREIGN KEY (appointment_id) REFERENCES appointments (appointment_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 21. telemedicine_sessions
CREATE TABLE telemedicine_sessions (
  session_id INT AUTO_INCREMENT PRIMARY KEY,
  appointment_id INT NOT NULL UNIQUE,
  meeting_link TEXT DEFAULT NULL,
  status ENUM('SCHEDULED', 'STARTED', 'COMPLETED', 'CANCELLED') DEFAULT 'SCHEDULED',
  started_at DATETIME DEFAULT NULL,
  ended_at DATETIME DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_tele_app FOREIGN KEY (appointment_id) REFERENCES appointments (appointment_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 22. medical_records
CREATE TABLE medical_records (
  record_id INT AUTO_INCREMENT PRIMARY KEY,
  appointment_id INT NOT NULL UNIQUE,
  doctor_id INT NOT NULL,
  patient_id INT NOT NULL,
  diagnosis TEXT NOT NULL,
  examination_notes TEXT DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_med_app FOREIGN KEY (appointment_id) REFERENCES appointments (appointment_id) ON DELETE CASCADE,
  CONSTRAINT fk_med_doc FOREIGN KEY (doctor_id) REFERENCES doctors (doctor_id) ON DELETE CASCADE,
  CONSTRAINT fk_med_patient FOREIGN KEY (patient_id) REFERENCES patients (patient_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 23. medical_record_access
CREATE TABLE medical_record_access (
  access_id INT AUTO_INCREMENT PRIMARY KEY,
  record_id INT NOT NULL,
  doctor_id INT NOT NULL,
  granted_by_patient_id INT NOT NULL,
  expires_at DATETIME DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_mra_rec FOREIGN KEY (record_id) REFERENCES medical_records (record_id) ON DELETE CASCADE,
  CONSTRAINT fk_mra_doc FOREIGN KEY (doctor_id) REFERENCES doctors (doctor_id) ON DELETE CASCADE,
  CONSTRAINT fk_mra_pat FOREIGN KEY (granted_by_patient_id) REFERENCES patients (patient_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 24. medical_record_amendments
CREATE TABLE medical_record_amendments (
  amendment_id INT AUTO_INCREMENT PRIMARY KEY,
  record_id INT NOT NULL,
  amended_by_doctor_id INT NOT NULL,
  field_name VARCHAR(100) NOT NULL,
  old_value TEXT DEFAULT NULL,
  new_value TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_mram_rec FOREIGN KEY (record_id) REFERENCES medical_records (record_id) ON DELETE CASCADE,
  CONSTRAINT fk_mram_doc FOREIGN KEY (amended_by_doctor_id) REFERENCES doctors (doctor_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 25. medical_record_attachments
CREATE TABLE medical_record_attachments (
  attachment_id INT AUTO_INCREMENT PRIMARY KEY,
  record_id INT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_mrat_rec FOREIGN KEY (record_id) REFERENCES medical_records (record_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 26. prescriptions
CREATE TABLE prescriptions (
  prescription_id INT AUTO_INCREMENT PRIMARY KEY,
  record_id INT NOT NULL UNIQUE,
  notes TEXT DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_presc_rec FOREIGN KEY (record_id) REFERENCES medical_records (record_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 27. prescription_items
CREATE TABLE prescription_items (
  item_id INT AUTO_INCREMENT PRIMARY KEY,
  prescription_id INT NOT NULL,
  medicine_name VARCHAR(255) NOT NULL,
  dosage VARCHAR(100) NOT NULL,
  frequency VARCHAR(100) NOT NULL,
  duration VARCHAR(100) NOT NULL,
  instructions TEXT DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_presc_item FOREIGN KEY (prescription_id) REFERENCES prescriptions (prescription_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 28. notifications
CREATE TABLE notifications (
  notification_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  notification_type VARCHAR(100) NOT NULL,
  title VARCHAR(255) DEFAULT NULL,
  notification_message TEXT NOT NULL,
  redirect_url VARCHAR(255) DEFAULT NULL,
  is_read TINYINT(1) DEFAULT 0,
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 29. audit_logs
CREATE TABLE audit_logs (
  audit_id INT AUTO_INCREMENT PRIMARY KEY,
  performed_by_user_id INT DEFAULT NULL,
  action VARCHAR(100) NOT NULL,
  entity_name VARCHAR(100) DEFAULT NULL,
  entity_id VARCHAR(100) DEFAULT NULL,
  ip_address VARCHAR(100) DEFAULT NULL,
  old_value JSON DEFAULT NULL,
  new_value JSON DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_user FOREIGN KEY (performed_by_user_id) REFERENCES users (user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 30. contactus_messages
CREATE TABLE contactus_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'unread',
  is_deleted TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 31. contactus_replies
CREATE TABLE contactus_replies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  message_id INT NOT NULL,
  reply_text TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_contact_rep FOREIGN KEY (message_id) REFERENCES contactus_messages (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ==============================================================================
-- SEED DATA
-- Password for all seed users is 'Password@123'
-- ==============================================================================

-- 1. Users
INSERT INTO users (user_id, email, password_hash, role, is_active, is_email_verified) VALUES
(1, 'superadmin@satva.com', '$2b$10$8cb8XcvTfLNzUhDJjDmACOrqiUeJ90u1rIrLfNw6O5E24Qrn42hWi', 'SUPER_ADMIN', 1, 1),
(2, 'admin@satva.com', '$2b$10$8cb8XcvTfLNzUhDJjDmACOrqiUeJ90u1rIrLfNw6O5E24Qrn42hWi', 'ADMIN', 1, 1),
(3, 'doctor@satva.com', '$2b$10$8cb8XcvTfLNzUhDJjDmACOrqiUeJ90u1rIrLfNw6O5E24Qrn42hWi', 'DOCTOR', 1, 1),
(4, 'doctor2@satva.com', '$2b$10$8cb8XcvTfLNzUhDJjDmACOrqiUeJ90u1rIrLfNw6O5E24Qrn42hWi', 'DOCTOR', 1, 1),
(5, 'doctor3@satva.com', '$2b$10$8cb8XcvTfLNzUhDJjDmACOrqiUeJ90u1rIrLfNw6O5E24Qrn42hWi', 'DOCTOR', 1, 1),
(6, 'staff@satva.com', '$2b$10$8cb8XcvTfLNzUhDJjDmACOrqiUeJ90u1rIrLfNw6O5E24Qrn42hWi', 'STAFF', 1, 1),
(7, 'patient@satva.com', '$2b$10$8cb8XcvTfLNzUhDJjDmACOrqiUeJ90u1rIrLfNw6O5E24Qrn42hWi', 'PATIENT', 1, 1),
(8, 'patient2@satva.com', '$2b$10$8cb8XcvTfLNzUhDJjDmACOrqiUeJ90u1rIrLfNw6O5E24Qrn42hWi', 'PATIENT', 1, 1);

-- 2. Hospitals
INSERT INTO hospitals (hospital_id, hospital_name, email, address_line1, address_line2, contact_number) VALUES
(1, 'Satva Central Multi-Specialty Hospital', 'info@satvacentral.com', '101 Healthcare Boulevard, Satellite', 'Opposite Medicity Mall, Ahmedabad', '+91 98765 43210'),
(2, 'Apollo Life Healthcare', 'care@apollolife.com', '45 SG Highway', 'Bodakdev, Ahmedabad', '+91 98765 43211'),
(3, 'Carewell Children and Women Hospital', 'help@carewell.com', '12 Ring Road', 'Vastrapur, Ahmedabad', '+91 98765 43212');

-- 3. Specialties
INSERT INTO specialties (specialty_id, specialty_name) VALUES
(1, 'Cardiology'),
(2, 'Dermatology'),
(3, 'Orthopedics'),
(4, 'Pediatrics'),
(5, 'Neurology'),
(6, 'General Medicine'),
(7, 'Gynecology'),
(8, 'ENT (Ear, Nose, Throat)'),
(9, 'Ophthalmology'),
(10, 'Psychiatry');

-- 4. Admins
INSERT INTO admins (admin_id, user_id, hospital_id, first_name, last_name) VALUES
(1, 2, 1, 'Vikram', 'Shah');

-- 5. Doctors
INSERT INTO doctors (doctor_id, user_id, hospital_id, first_name, last_name, gender, experience_years, consultation_fee, rating, currency_code, bio, profile_path, is_deactivated) VALUES
(1, 3, 1, 'Rajesh', 'Sharma', 'MALE', 14, 800.00, 4.90, 'INR', 'Senior Interventional Cardiologist with extensive expertise in preventive cardiology and heart rhythm management.', '/public/images/doctor1.jpg', 0),
(2, 4, 1, 'Priya', 'Mehta', 'FEMALE', 9, 600.00, 4.85, 'INR', 'Board-certified Dermatologist and Cosmetologist specializing in acne, eczema, and laser skin treatments.', '/public/images/doctor2.jpg', 0),
(3, 5, 1, 'Amit', 'Patel', 'MALE', 12, 750.00, 4.95, 'INR', 'Senior Orthopedic Surgeon specializing in joint replacement, sports trauma, and arthroscopic procedures.', '/public/images/doctor3.jpg', 0);

-- 6. Doctor Specialties
INSERT INTO doctor_specialties (doctor_id, specialty_id) VALUES
(1, 1), -- Dr. Rajesh - Cardiology
(1, 6), -- Dr. Rajesh - General Medicine
(2, 2), -- Dr. Priya - Dermatology
(3, 3); -- Dr. Amit - Orthopedics

-- 7. Doctor Qualifications
INSERT INTO doctor_qualifications (doctor_id, degree, graduation_year, college_name) VALUES
(1, 'MBBS, MD (Medicine)', 2010, 'All India Institute of Medical Sciences (AIIMS)'),
(1, 'DM (Cardiology)', 2014, 'Christian Medical College (CMC)'),
(2, 'MBBS', 2015, 'Grant Medical College, Mumbai'),
(2, 'MD (Dermatology)', 2018, 'BJ Medical College, Ahmedabad'),
(3, 'MBBS, MS (Orthopedics)', 2012, 'King Edward Memorial Hospital (KEM), Mumbai'),
(3, 'Fellowship in Joint Replacement', 2015, 'St. George Hospital, London');

-- 8. Doctor Schedules (Working hours for current dates)
INSERT INTO doctor_schedules (doctor_id, working_date, working_from, working_to, slot_duration) VALUES
(1, CURDATE(), '09:00:00', '17:00:00', 30),
(1, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '09:00:00', '17:00:00', 30),
(1, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '09:00:00', '17:00:00', 30),
(2, CURDATE(), '10:00:00', '18:00:00', 30),
(2, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '10:00:00', '18:00:00', 30),
(3, CURDATE(), '09:30:00', '16:30:00', 30),
(3, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '09:30:00', '16:30:00', 30);

-- 9. Staff
INSERT INTO staff (staff_id, user_id, hospital_id, staff_role, first_name, last_name, contact_number, dob, gender, address_line1, address_line2) VALUES
(1, 6, 1, 'RECEPTIONIST', 'Sneha', 'Desai', '+91 98765 11223', '1996-04-15', 'FEMALE', 'B-402 Shivalik Residency', 'Drive In Road, Ahmedabad');

-- 10. Patients
INSERT INTO patients (patient_id, user_id, first_name, last_name, country_code, mobile, blood_group, profile_path, dob, gender, address_line1, address_line2, is_insured) VALUES
(1, 7, 'Rahul', 'Verma', '+91', '9898123456', 'O+', '/public/images/patient1.jpg', '1992-08-20', 'MALE', 'A-12 Green Acres Society', 'Satellite, Ahmedabad', 1),
(2, 8, 'Ananya', 'Joshi', '+91', '9898654321', 'B+', '/public/images/patient2.jpg', '1995-11-12', 'FEMALE', 'Flat 304, Marvel Heights', 'Bodakdev, Ahmedabad', 0);

-- 11. Family Members
INSERT INTO family_members (patient_id, relation, first_name, last_name, dob, mobile, email) VALUES
(1, 'SPOUSE', 'Pooja', 'Verma', '1994-06-18', '9898123457', 'pooja.verma@example.com'),
(1, 'CHILD', 'Aarav', 'Verma', '2020-03-05', NULL, NULL);

-- 12. Patient Insurance Details
INSERT INTO patient_insurance_details (patient_id, policy_number, policy_company, policy_document_path) VALUES
(1, 'POL-HDFC-987456', 'HDFC ERGO Health Insurance', '/uploads/insurance/policy_rahul.pdf');

-- 13. Appointments
INSERT INTO appointments (appointment_id, doctor_id, patient_id, slot_date, start_time, end_time, chief_complaint, appointment_type, appointment_status, confirmation_no) VALUES
(1, 1, 1, CURDATE(), '10:00:00', '10:30:00', 'Mild chest tightness after morning jog, routine blood pressure review', 'IN_PERSON', 'CHECKED_IN', 'CONF-SATVA-1001'),
(2, 2, 1, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '11:00:00', '11:30:00', 'Skin dryness, red rash around elbow and allergic reactions', 'TELEMEDICINE', 'CONFIRMED', 'CONF-SATVA-1002'),
(3, 3, 2, CURDATE(), '11:00:00', '11:30:00', 'Right knee pain after sports activity and swelling', 'IN_PERSON', 'CONFIRMED', 'CONF-SATVA-1003'),
(4, 1, 2, DATE_SUB(CURDATE(), INTERVAL 5 DAY), '09:30:00', '10:00:00', 'Annual cardiovascular checkup', 'IN_PERSON', 'COMPLETED', 'CONF-SATVA-1000');

-- 14. Status History
INSERT INTO appointment_status_history (appointment_id, old_status, new_status, changed_by_user_id, remarks) VALUES
(1, 'PAYMENT_PENDING', 'CONFIRMED', 7, 'Online payment confirmed'),
(1, 'CONFIRMED', 'CHECKED_IN', 6, 'Patient arrived at hospital front desk'),
(2, 'PAYMENT_PENDING', 'CONFIRMED', 7, 'Booking confirmed with UPI'),
(3, 'PAYMENT_PENDING', 'CONFIRMED', 8, 'Booking confirmed with Card'),
(4, 'CONFIRMED', 'COMPLETED', 3, 'Consultation completed and prescription issued');

-- 15. Payments
INSERT INTO payments (payment_id, appointment_id, amount, currency, payment_method, transaction_id, status, refund_status) VALUES
(1, 1, 800.00, 'INR', 'UPI', 'TXN_UPI_9847291', 'SUCCESS', 0),
(2, 2, 600.00, 'INR', 'UPI', 'TXN_UPI_9847292', 'SUCCESS', 0),
(3, 3, 750.00, 'INR', 'CARD', 'TXN_CARD_7739102', 'SUCCESS', 0),
(4, 4, 800.00, 'INR', 'ONLINE', 'TXN_ONL_6628190', 'SUCCESS', 0);

-- 16. Telemedicine Sessions
INSERT INTO telemedicine_sessions (session_id, appointment_id, meeting_link, status, started_at, ended_at) VALUES
(1, 2, 'https://meet.satva.com/telemedicine/session-1002', 'SCHEDULED', NULL, NULL);

-- 17. Medical Records
INSERT INTO medical_records (record_id, appointment_id, doctor_id, patient_id, diagnosis, examination_notes) VALUES
(1, 4, 1, 2, 'Stage 1 Essential Hypertension (mild)', 'BP recorded 138/88 mmHg. Heart sounds normal (S1, S2 audible). Recommended low sodium diet, 30 min daily walking, and follow-up in 4 weeks.');

-- 18. Prescriptions
INSERT INTO prescriptions (prescription_id, record_id, notes) VALUES
(1, 1, 'Monitor blood pressure daily in the morning before breakfast. Maintain a digital BP log.');

-- 19. Prescription Items
INSERT INTO prescription_items (prescription_id, medicine_name, dosage, frequency, duration, instructions) VALUES
(1, 'Telmisartan Tablets IP', '40 mg', 'Once Daily (OD)', '30 Days', 'Take orally after breakfast'),
(1, 'Amlodipine Tablets', '2.5 mg', 'Once Daily (OD)', '15 Days', 'Take before bedtime if BP exceeds 140/90');

-- 20. Notifications
INSERT INTO notifications (user_id, notification_type, title, notification_message, redirect_url, is_read) VALUES
(7, 'APPOINTMENT', 'Appointment Confirmed', 'Your appointment with Dr. Rajesh Sharma for today at 10:00 AM is confirmed.', '/patient/appointments', 0),
(7, 'TELEMEDICINE', 'Telemedicine Scheduled', 'Your video consultation with Dr. Priya Mehta is scheduled for tomorrow at 11:00 AM.', '/patient/appointments', 0),
(3, 'APPOINTMENT', 'New Patient Check-in', 'Patient Rahul Verma has checked in for the 10:00 AM slot.', '/doctor/appointments', 0),
(2, 'ADMIN', 'Daily Summary Ready', 'Hospital daily stats and appointments are updated.', '/admin/dashboard', 1);

-- 21. Audit Logs
INSERT INTO audit_logs (performed_by_user_id, action, entity_name, entity_id, ip_address, old_value, new_value) VALUES
(1, 'SUPER_ADMIN_SEED', 'users', '1', '127.0.0.1', NULL, '{"role": "SUPER_ADMIN", "email": "superadmin@satva.com"}'),
(2, 'DOCTOR_SCHEDULE_UPDATE', 'doctor_schedules', '1', '127.0.0.1', NULL, '{"doctor_id": 1, "slots": 16}'),
(6, 'PATIENT_CHECKIN', 'appointments', '1', '127.0.0.1', '{"status": "CONFIRMED"}', '{"status": "CHECKED_IN"}');

-- 22. Contact Us Messages
INSERT INTO contactus_messages (id, first_name, last_name, email, message, status, is_deleted) VALUES
(1, 'Kavita', 'Rathod', 'kavita.rathod@example.com', 'Inquiring if cashless mediclaim for Star Health is accepted at Central branch.', 'unread', 0),
(2, 'Deepak', 'Solanki', 'deepak.s@example.com', 'Need assistance with rescheduling Sunday morning appointment.', 'read', 0);

-- 23. Contact Us Replies
INSERT INTO contactus_replies (message_id, reply_text) VALUES
(2, 'Hello Deepak, you can reschedule your appointment directly from your patient dashboard under the appointments tab or call our reception desk at 9876543210.');
