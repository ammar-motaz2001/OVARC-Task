# Digital Bookstore API

A Node.js and Express-based API for managing bookstore inventory synchronization and generating store reports.

## Features

- **CSV Inventory Upload**: Upload and process CSV files to synchronize bookstore inventory
- **PDF Report Generation**: Generate detailed PDF reports with top 5 priciest books and top 5 prolific authors
- **Database Management**: MongoDB database with Mongoose ODM
- **Docker Support**: Fully containerized with Docker and Docker Compose

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Module System**: ES6 Modules (import/export)
- **Database**: MongoDB
- **ODM**: Mongoose
- **File Processing**: Multer (file upload), csv-parse (CSV parsing)
- **PDF Generation**: PDFKit

## Prerequisites

- Node.js 18 or higher
- Docker and Docker Compose (for containerized setup)
- MongoDB (if running without Docker)

## Quick Start with Docker Compose (Recommended)

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd Ovarc
   ```

2. **Start the services**:
   ```bash
   docker-compose up -d
   ```

   This will start:
   - MongoDB database on port 27017
   - API server on port 3000

3. **Check if services are running**:
   ```bash
   docker-compose ps
   ```

4. **View logs**:
   ```bash
   docker-compose logs -f api
   ```

5. **Stop the services**:
   ```bash
   docker-compose down
   ```

## Manual Setup (Without Docker)

1. **Install dependencies**:
   ```bash
   npm install
   ```
   
   This will install all required packages:
   - express, sequelize, pg, pg-hstore
   - multer, csv-parse, pdfkit
   - dotenv, express-validator, cors
   - nodemon (dev dependency)

2. **Set up environment variables**:
   Create a `.env` file in the root directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/bookstore_db
   DB_HOST=localhost
   DB_PORT=27017
   DB_NAME=bookstore_db
   DB_USER=
   DB_PASSWORD=
   DB_AUTH_SOURCE=admin
   PORT=3000
   NODE_ENV=development
   ```
   
   **Note**: If MongoDB has authentication enabled, add username and password:
   ```env
   MONGODB_URI=mongodb://username:password@localhost:27017/bookstore_db?authSource=admin
   DB_USER=username
   DB_PASSWORD=password
   ```

3. **Set up MongoDB database**:
   MongoDB will create the database automatically when you first connect.
   No manual database creation needed!
   
   If you want to verify MongoDB is running:
   ```bash
   mongosh
   # or
   mongo
   ```

4. **Start the server**:
   ```bash
   npm start
   ```

   For development with auto-reload:
   ```bash
   npm run dev
   ```

   The server will start on `http://localhost:3000`

## API Endpoints

### 1. Health Check

**GET** `/health`

Returns server status.

**Response**:
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

### 2. Upload Inventory CSV

**POST** `/api/inventory/upload`

Upload a CSV file to synchronize bookstore inventory.

**Request**:
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: Form data with `csv` field containing the CSV file

**CSV Format**:
```csv
store_name,store_address,book_name,pages,author_name,price
Bookstore A,123 Main St,The Great Gatsby,180,F. Scott Fitzgerald,12.99
Bookstore B,456 Oak Ave,1984,328,George Orwell,14.50
```

**Response**:
```json
{
  "message": "CSV processed successfully",
  "summary": {
    "total_records": 10,
    "created": 8,
    "updated": 2,
    "errors": 0
  }
}
```

**Error Response**:
```json
{
  "error": "CSV file is required"
}
```

### 3. Download Store Report

**GET** `/api/store/:id/download-report`

Generate and download a PDF report for a specific store.

**Parameters**:
- `id` (path parameter): Store ID

**Response**:
- Content-Type: `application/pdf`
- File download with filename: `[Store Name]-Report-YYYY-MM-DD.pdf`

**Report Contents**:
- Store information (name, address, date)
- Top 5 Priciest Books (with author, pages, price, copies)
- Top 5 Prolific Authors (by number of available books)

**Error Response**:
```json
{
  "error": "Store not found"
}
```

## Database Schema

### Collections (MongoDB)

- **stores**: `_id`, `name`, `address`, `createdAt`, `updatedAt`
- **authors**: `_id`, `name`, `createdAt`, `updatedAt`
- **books**: `_id`, `name`, `pages`, `author_id` (ObjectId reference), `createdAt`, `updatedAt`
- **storebooks**: `_id`, `store_id` (ObjectId reference), `book_id` (ObjectId reference), `price`, `copies`, `sold_out`, `createdAt`, `updatedAt`

### Relationships

- Book references Author via `author_id` (ObjectId)
- Store and Book have many-to-many relationship through StoreBook collection
- StoreBook tracks price, copies, and sold_out status
- MongoDB uses ObjectId for all `_id` fields (automatically generated)

## CSV Processing Logic

1. **Store Matching**: Matches by `name` and `address` combination
2. **Author Matching**: Matches by `name` (case-sensitive)
3. **Book Matching**: Matches by `name`, `author_id`, and `pages`
4. **StoreBook Logic**:
   - If store already stocks the book: increments `copies` and updates `price`
   - If new: creates record with `copies = 1`

## Sample CSV File

A sample CSV file (`sample-inventory.csv`) is included in the repository for testing:

```csv
store_name,store_address,book_name,pages,author_name,price
Central Library,123 Main Street,The Great Gatsby,180,F. Scott Fitzgerald,12.99
Central Library,123 Main Street,To Kill a Mockingbird,281,Harper Lee,13.50
Downtown Books,456 Oak Avenue,1984,328,George Orwell,14.50
Downtown Books,456 Oak Avenue,Animal Farm,112,George Orwell,10.99
```

## Testing the API

### Using Postman (Recommended)

#### 1. Health Check
- **Method**: GET
- **URL**: `http://localhost:3000/health`
- **Expected Response**:
  ```json
  {
    "status": "ok",
    "message": "Server is running"
  }
  ```

#### 2. Upload CSV Inventory
- **Method**: POST
- **URL**: `http://localhost:3000/api/inventory/upload`
- **Headers**: None required (Postman will set Content-Type automatically)
- **Body**: 
  - Select `form-data`
  - Key: `csv` (change type to **File** from the dropdown)
  - Value: Click "Select Files" and choose `sample-inventory.csv` from the project root
- **Expected Response**:
  ```json
  {
    "message": "CSV processed successfully",
    "summary": {
      "total_records": 10,
      "created": 8,
      "updated": 2,
      "errors": 0
    }
  }
  ```

#### 3. Download Store Report
- **Method**: GET
- **URL**: `http://localhost:3000/api/store/{storeId}/download-report`
  - Replace `{storeId}` with the actual MongoDB ObjectId of the store (e.g., `507f1f77bcf86cd799439011`)
- **Expected Response**: PDF file download
- **Note**: After uploading the CSV, check the response to see which stores were created. Store IDs are MongoDB ObjectIds (24-character hex strings)

### Using cURL

**Upload CSV**:
```bash
curl -X POST http://localhost:3000/api/inventory/upload \
  -F "csv=@sample-inventory.csv"
```

**Download Report**:
```bash
curl -X GET http://localhost:3000/api/store/1/download-report \
  -o report.pdf
```

### Quick Test Workflow

1. **Start the server**: `npm start` or `npm run dev`
2. **Test health endpoint**: GET `http://localhost:3000/health`
3. **Upload sample CSV**: POST `http://localhost:3000/api/inventory/upload` with `sample-inventory.csv`
4. **Get store ID**: Check the response or database (stores will be created with IDs starting from 1)
5. **Download report**: GET `http://localhost:3000/api/store/1/download-report`

## Error Handling

The API includes comprehensive error handling for:

- Invalid file types (only CSV allowed)
- File size limits (10MB max)
- Database validation errors
- Missing required fields
- Invalid data types
- Store not found errors

## Project Structure

```
.
├── src/
│   ├── config/
│   │   └── database.js          # Database configuration
│   ├── controllers/
│   │   ├── inventoryController.js  # CSV upload logic
│   │   └── storeController.js      # PDF report generation
│   ├── middleware/
│   │   ├── errorHandler.js      # Global error handler
│   │   └── upload.js            # Multer configuration
│   ├── models/
│   │   ├── Author.js            # Author model
│   │   ├── Book.js              # Book model
│   │   ├── Store.js             # Store model
│   │   ├── StoreBook.js         # StoreBook junction model
│   │   └── index.js             # Models export
│   ├── routes/
│   │   ├── inventory.js         # Inventory routes
│   │   └── store.js             # Store routes
│   └── server.js                # Express app entry point
├── uploads/                      # Temporary CSV upload directory
├── .dockerignore
├── .gitignore
├── docker-compose.yml
├── Dockerfile
├── package.json
└── README.md
```

## Development

### Running in Development Mode

```bash
npm run dev
```

This uses `nodemon` for automatic server restarts on file changes.

### Database Migrations

The application uses Sequelize's `sync` method with `alter: true` for development. For production, consider using proper migrations.

## Troubleshooting

### Database Connection Issues

- Ensure PostgreSQL is running
- Check database credentials in `.env`
- Verify database exists: `createdb bookstore_db`

### Port Already in Use

- Change `PORT` in `.env` or `docker-compose.yml`
- Or stop the service using the port

### CSV Upload Fails

- Verify CSV format matches the required structure
- Check file size (max 10MB)
- Ensure all required fields are present

## License

ISC

## Author

Digital Bookstore API Challenge

