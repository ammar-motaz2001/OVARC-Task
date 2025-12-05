# Digital Bookstore API

A Node.js and Express-based API for managing bookstore inventory synchronization and generating store reports.

## Features

- **CSV Inventory Upload**: Upload and process CSV files to synchronize bookstore inventory
- **PDF Report Generation**: Generate detailed PDF reports with top 5 priciest books and top 5 prolific authors
- **Database Management**: SQL Server database with Sequelize ORM
- **Docker Support**: Fully containerized with Docker and Docker Compose
- **ES6 Modules**: Modern JavaScript with ES6 import/export syntax

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Module System**: ES6 Modules (import/export)
- **Database**: SQL Server
- **ORM**: Sequelize
- **File Processing**: Multer (file upload), csv-parse (CSV parsing)
- **PDF Generation**: PDFKit
- **Validation**: express-validator

## Prerequisites

- Node.js 18 or higher
- SQL Server (or Docker for containerized setup)
- Docker and Docker Compose (optional, for containerized setup)

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
   - SQL Server 2022 Express on port 1433
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
   - express, sequelize, tedious (SQL Server driver)
   - multer, csv-parse, pdfkit
   - dotenv, express-validator, cors
   - nodemon (dev dependency)

2. **Set up SQL Server**:
   - Install SQL Server Express: https://www.microsoft.com/sql-server/sql-server-downloads
   - Create a database named `bookstore_db`
   - Note your SQL Server credentials (username and password)

3. **Set up environment variables**:
   Create a `.env` file in the root directory:
   ```env
   DB_HOST=localhost
   DB_PORT=1433
   DB_NAME=bookstore_db
   DB_USER=sa
   DB_PASSWORD=YourPassword
   DB_ENCRYPT=false
   DB_TRUST_CERT=true
   PORT=3000
   NODE_ENV=development
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

**Processing Logic**:
- Matches existing stores, books, and authors by name/address
- Creates new entities if they don't exist
- If a store already stocks a book, increments the `copies` count
- Updates the price to the latest value

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

### 3. Get All Stores

**GET** `/api/store`

Get a list of all stores in the database.

**Response**:
```json
{
  "message": "Stores retrieved successfully",
  "count": 3,
  "stores": [
    {
      "id": 1,
      "name": "Central Library",
      "address": "123 Main Street"
    }
  ]
}
```

### 4. Download Store Report

**GET** `/api/store/:id/download-report`

Generate and download a PDF report for a specific store.

**Parameters**:
- `id` (path parameter): Store ID (integer)

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
  "error": "Store not found",
  "message": "No store found with ID: 1"
}
```

## Database Schema

### Tables (SQL Server)

- **stores**: `id` (PK, auto-increment), `name`, `address`, `createdAt`, `updatedAt`
- **authors**: `id` (PK, auto-increment), `name` (unique), `createdAt`, `updatedAt`
- **books**: `id` (PK, auto-increment), `name`, `pages`, `author_id` (FK), `createdAt`, `updatedAt`
- **store_books**: `id` (PK, auto-increment), `store_id` (FK), `book_id` (FK), `price`, `copies`, `sold_out`, `createdAt`, `updatedAt`

### Relationships

- Book references Author via `author_id` (foreign key)
- Store and Book have many-to-many relationship through `store_books` table
- `store_books` tracks price, copies, and sold_out status
- Unique constraint on `(store_id, book_id)` to prevent duplicates

## CSV Processing Logic

1. **Store Matching**: Matches by `name` and `address` combination
2. **Author Matching**: Matches by `name` (case-sensitive)
3. **Book Matching**: Matches by `name`, `author_id`, and `pages`
4. **StoreBook Logic**:
   - If store already stocks the book: increments `copies` and updates `price`
   - If new: creates record with `copies = 1` and `sold_out = false`

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
  - Value: Click "Select Files" and choose your CSV file
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

#### 3. Get All Stores
- **Method**: GET
- **URL**: `http://localhost:3000/api/store`
- **Expected Response**: List of all stores with their IDs

#### 4. Download Store Report
- **Method**: GET
- **URL**: `http://localhost:3000/api/store/1/download-report`
  - Replace `1` with the actual store ID from the previous endpoint
- **Expected Response**: PDF file download

### Using cURL

**Health Check**:
```bash
curl http://localhost:3000/health
```

**Upload CSV**:
```bash
curl -X POST http://localhost:3000/api/inventory/upload \
  -F "csv=@sample-inventory.csv"
```

**Get All Stores**:
```bash
curl http://localhost:3000/api/store
```

**Download Report**:
```bash
curl -X GET http://localhost:3000/api/store/1/download-report \
  -o report.pdf
```

### Quick Test Workflow

1. **Start the server**: `npm start` or `npm run dev`
2. **Test health endpoint**: GET `http://localhost:3000/health`
3. **Upload CSV**: POST `http://localhost:3000/api/inventory/upload` with a CSV file
4. **Get store ID**: GET `http://localhost:3000/api/store` to see all stores
5. **Download report**: GET `http://localhost:3000/api/store/1/download-report`

## Error Handling

The API includes comprehensive error handling for:

- Invalid file types (only CSV allowed)
- File size limits (10MB max)
- Database validation errors
- Missing required fields
- Invalid data types
- Store not found errors
- Sequelize validation and constraint errors

## Project Structure

```
.
├── src/
│   ├── config/
│   │   └── database.js          # SQL Server configuration with Sequelize
│   ├── controllers/
│   │   ├── inventoryController.js  # CSV upload and processing logic
│   │   └── storeController.js      # PDF report generation
│   ├── middleware/
│   │   ├── errorHandler.js      # Global error handler
│   │   └── upload.js            # Multer configuration for file uploads
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
├── docker-compose.yml            # Docker Compose configuration
├── Dockerfile                    # Docker image configuration
├── nodemon.json                  # Nodemon configuration
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

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | SQL Server host | `localhost` |
| `DB_PORT` | SQL Server port | `1433` |
| `DB_NAME` | Database name | `bookstore_db` |
| `DB_USER` | Database username | `sa` |
| `DB_PASSWORD` | Database password | (required) |
| `DB_ENCRYPT` | Use encryption | `false` |
| `DB_TRUST_CERT` | Trust server certificate | `true` |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |

## Troubleshooting

### Database Connection Issues

- Ensure SQL Server is running
- Check database credentials in `.env`
- Verify database exists: `CREATE DATABASE bookstore_db;`
- For Docker: Check if container is running with `docker-compose ps`

### Port Already in Use

- Change `PORT` in `.env` or `docker-compose.yml`
- Or stop the service using the port

### CSV Upload Fails

- Verify CSV format matches the required structure
- Check file size (max 10MB)
- Ensure all required fields are present
- Make sure the form-data field name is exactly `csv` (lowercase)

### SQL Server Authentication

- Ensure SQL Server Authentication is enabled (not just Windows Authentication)
- Check that the `sa` account is enabled
- Verify password is correct in `.env`

## License

ISC

## Author

Digital Bookstore API Challenge
