import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const dbName = process.env.DB_NAME || 'bookstore_OVARC_db';
const dbUser = process.env.DB_USER || 'sa';
const dbPassword = process.env.DB_PASSWORD || '';
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = parseInt(process.env.DB_PORT || '1433', 10);

const createDatabaseIfNotExists = async () => {
  const masterSequelize = new Sequelize('master', dbUser, dbPassword, {
    host: dbHost,
    port: dbPort,
    dialect: 'mssql',
    dialectOptions: {
      options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: process.env.DB_TRUST_CERT === 'true',
        enableArithAbort: true,
      },
    },
    logging: false,
  });

  try {
    await masterSequelize.authenticate();
    const escapedDbName = dbName.replace(/\]/g, ']]');
    const [results] = await masterSequelize.query(
      `SELECT name FROM sys.databases WHERE name = N'${escapedDbName.replace(/'/g, "''")}'`
    );
    
    if (results.length === 0) {
      await masterSequelize.query(`CREATE DATABASE [${escapedDbName}]`);
    }
    
    await masterSequelize.close();
  } catch (error) {
    try {
      await masterSequelize.close();
    } catch (closeError) {
    }
    throw error;
  }
};

const sequelize = new Sequelize(
  dbName,
  dbUser,
  dbPassword,
  {
    host: dbHost,
    port: dbPort,
    dialect: 'mssql',
    dialectOptions: {
      options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: process.env.DB_TRUST_CERT === 'true',
        enableArithAbort: true,
      },
    },
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

const connectDB = async () => {
  try {
    await createDatabaseIfNotExists();
    await sequelize.authenticate();
    return sequelize;
  } catch (error) {
    throw error;
  }
};

export { connectDB, sequelize };
export default sequelize;
