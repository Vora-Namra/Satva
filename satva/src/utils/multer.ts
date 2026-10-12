import multer,{Multer,DiskStorageOptions, FileFilterCallback} from "multer"
import path from 'path'



function storageOptions(file_path:string){ 
const storage=multer.diskStorage({
    destination:file_path,
   filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
})

return storage
}


const imageFilter = (
    req:any, 
    file: Express.Multer.File, 
    callback: FileFilterCallback
): void => {
    const allowedExtension: RegExp = /jpeg|jpg|png|gif/;
    
  
    const extName: boolean = allowedExtension.test(
        path.extname(file.originalname).toLowerCase()
    );

    if (!extName) {
        
        return callback(new Error('Error: Only jpeg, png, and jpg formats allowed'));
    }
    
 
    return callback(null, true);
};

const fileFilter=(req:any,
    file:Express.Multer.File,
    callback:FileFilterCallback
):void=>{
    const allowedExtension:RegExp=/jpeg|jpg|png|pdf|txt/;

     const extName: boolean = allowedExtension.test(
        path.extname(file.originalname).toLowerCase()
    );

    if (!extName) {
        
        return callback(new Error('Error: Only jpeg, png, and jpg formats allowed'));
    }
    
 
    return callback(null, true);

}

// patient profile uploads 

export const uploadPatientProfile=multer({
    storage:storageOptions('uploads/patient_profile/'),
    fileFilter:imageFilter,
    limits:{
        fileSize:2*1024*1024 //2 MB
    }
    

})


//doctor profile uplods
export const uploadDoctorProfile=multer({storage:storageOptions('uploads/doctor_profile/'),
    fileFilter:imageFilter,
    limits:{
        fileSize:2*1024*1024  // 2 MB
    }
})

// upload medical Records 
export const uploadMedicalRecords=multer({storage:storageOptions('uploads/medical_records'),
    fileFilter:fileFilter
})
