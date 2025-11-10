import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import dotenv from "dotenv";

dotenv.config();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure CloudinaryStorage for Multer
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "pro-connect-uploads", // The name of the folder in Cloudinary
        allowed_formats: ["jpg", "png", "jpeg", "gif"],
        // You can add transformations here if you want
    },
});

// Create the multer instance
const upload = multer({ storage: storage });

export default upload;
