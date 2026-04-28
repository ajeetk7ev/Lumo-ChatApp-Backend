import 'dotenv/config';


const envVars = process.env;


export const env = {
    PORT:envVars.PORT,
    MONGO_URI:envVars.MONGO_URI,
}