import 'dotenv/config';
import Joi from 'joi';

/**
 * Validate and export environment variables.
 * Fails fast at startup if any required var is missing.
 */
const envSchema = Joi.object({
    NODE_ENV: Joi.string()
        .valid('development', 'production', 'test')
        .default('development'),

    PORT: Joi.number()
        .default(5000),

    MONGO_URI: Joi.string()
        .required()
        .description('MongoDB connection URI'),

    JWT_ACCESS_SECRET: Joi.string()
        .required()
        .min(16)
        .description('JWT access token secret'),

    JWT_REFRESH_SECRET: Joi.string()
        .required()
        .min(16)
        .description('JWT refresh token secret'),

    JWT_ACCESS_EXPIRY: Joi.string()
        .default('15m')
        .description('JWT access token expiry'),

    JWT_REFRESH_EXPIRY: Joi.string()
        .default('7d')
        .description('JWT refresh token expiry'),

    CORS_ORIGIN: Joi.string()
        .default('http://localhost:5173')
        .description('Allowed CORS origin'),
}).unknown(); // allow other env vars to exist

const { error, value: envVars } = envSchema.validate(process.env, {
    abortEarly: false,
    stripUnknown: false,
});

if (error) {
    const missingVars = error.details.map((d) => d.message).join('\n  - ');
    throw new Error(`❌ Environment validation failed:\n  - ${missingVars}`);
}

const env = {
    NODE_ENV: envVars.NODE_ENV,
    PORT: envVars.PORT,
    MONGO_URI: envVars.MONGO_URI,
    JWT_ACCESS_SECRET: envVars.JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET: envVars.JWT_REFRESH_SECRET,
    JWT_ACCESS_EXPIRY: envVars.JWT_ACCESS_EXPIRY,
    JWT_REFRESH_EXPIRY: envVars.JWT_REFRESH_EXPIRY,
    CORS_ORIGIN: envVars.CORS_ORIGIN,
    isDev: envVars.NODE_ENV === 'development',
    isProd: envVars.NODE_ENV === 'production',
    isTest: envVars.NODE_ENV === 'test',
};

export default env;