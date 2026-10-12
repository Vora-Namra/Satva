import express, { Application, Express } from "express";
import path from "path";
import fs from "fs";
import { buildApiRouter } from "./routes/main.routes.js";
import passport from "./modules/auth/utils/googleauth.js";
import session from "express-session";
import { env } from "./config/index.js";

import { fileURLToPath } from "url";
import { errorMiddleware } from "./common/middlewares/error.middleware.js";
import cookieParser from "cookie-parser";
import { PatientPageRoutes } from "./modules/patient/patient.page.routes.js";
import { AuthPageRoutes } from "./modules/auth/auth.page.routes.js";
import { DoctorPageRoutes } from "./modules/doctor/doctor.page.routes.js";
import { SuperAdminPageRoutes } from "./modules/super_admin/super.admin.page.routes.js";
import { HospitalPageRoutes } from "./modules/hospital/hospital.page.routes.js";
import { AdminPageRoutes } from "./modules/admin/admin.page.routes.js";
import { StaffPageRoutes } from "./modules/staff/staff.page.routes.js";
import cors from "cors";
import { notFoundMiddleware } from "./common/middlewares/not-found.middlware.js";


export function buildApp(): Application {
  const app: Express = express();

  let __filePath = fileURLToPath(import.meta.url);
  let __dirname = path.dirname(__filePath);


  //configuring ejs settings
  app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "views"));

  app.use(express.static(path.join(__dirname, "uploads")));
  app.use(express.static(path.join(__dirname, "../public")));


  app.use(
    cors({
      origin: "http://localhost:5173",
      credentials: true,
    }),
  );

 // GLOBAL MIDDLEWARE
  app.use(express.json());
  app.use(
    session({
      secret: "scret",
      resave: false,
      saveUninitialized: true,
      cookie: { secure: false },
    }),
  );
  app.use(express.urlencoded({ extended: true }));

  app.use(express.static("public"));
  app.use(cookieParser());
  app.use(express.static("public"));

  // CREATE FOLDER FOR FILE UPLOADING
  const parentpath = path.dirname(import.meta.dirname);
  const folderpath = path.join(parentpath, "uploads");

  app.use("/uploads", express.static(path.join(parentpath, "uploads")));

  if (!fs.existsSync(folderpath)) {
    //uploads folder
    fs.mkdirSync(folderpath);
    //patient_profile folder
    const patient_profile = path.join(folderpath, "patient_profile");
    fs.mkdirSync(patient_profile);
    //doctor_profile folder
    const doctor_profile = path.join(folderpath, "doctor_profile");
    fs.mkdirSync(doctor_profile);
    // Add logic below for creating new folder
    const medical_records = path.join(folderpath, "medical_records")
    fs.mkdirSync(medical_records)

    console.log("Folder Created Successfully ");
  }

  //SESSION
  app.use(
    session({
      secret: env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
    }),
  );
  console.log(path.join(__dirname, "views"));

  app.use(passport.initialize());
  app.use(passport.session());
  // HANDLES GLOBAL ERROR

  app.use('/admin', new AdminPageRoutes().router);

  app.use('/staff', new StaffPageRoutes().router)


  //ROUTER
  app.use("/api/v1", buildApiRouter());

  app.get("/", (req, res) => {
    res.render("index");
  });

  app.use('/super-admin', new SuperAdminPageRoutes().router);
  app.use('/hospital', new HospitalPageRoutes().router);
  app.get("/about", (req, res) => {
    res.render("about");
  });
  app.get("/contact", (req, res) => {
    res.render("contact");
  });




app.use("/patient", new PatientPageRoutes().router);
app.use('/doctor', new DoctorPageRoutes().router);


  //ROUTER 
app.use("/", new AuthPageRoutes().router);
  

app.use(notFoundMiddleware);
// HANDLES GLOBAL ERROR
  app.use(errorMiddleware)
  

  return app;
}
