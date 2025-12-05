import fs from 'fs';
import { parse } from 'csv-parse';
import { validationResult } from 'express-validator';
import { Author, Book, Store, StoreBook } from '../models/index.js';

const uploadCSV = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'CSV file is required' });
    }

    const filePath = req.file.path;
    const records = [];

    const parser = fs
      .createReadStream(filePath)
      .pipe(
        parse({
          columns: header => header.map(column => column.trim().toLowerCase()),
          skip_empty_lines: true,
          trim: true,
          cast: (value, context) => {
            if (context.column === 'pages') {
              const parsed = parseInt(value, 10);
              if (isNaN(parsed)) {
                throw new Error(`Invalid pages value: ${value}`);
              }
              return parsed;
            }
            if (context.column === 'price') {
              const parsed = parseFloat(value);
              if (isNaN(parsed)) {
                throw new Error(`Invalid price value: ${value}`);
              }
              return parsed;
            }
            return value;
          },
        })
      );

    let rowNumber = 0;
    for await (const record of parser) {
      rowNumber++;
      
      const requiredFields = [
        'store_name',
        'store_address',
        'book_name',
        'pages',
        'author_name',
        'price',
      ];
      const missingFields = requiredFields.filter(field => !record[field] && record[field] !== 0);

      if (missingFields.length > 0) {
        throw new Error(
          `Row ${rowNumber}: Missing required fields: ${missingFields.join(', ')}`
        );
      }

      const storeName = String(record.store_name || '').trim();
      const storeAddress = String(record.store_address || '').trim();
      const bookName = String(record.book_name || '').trim();
      const authorName = String(record.author_name || '').trim();

      if (!storeName || !storeAddress || !bookName || !authorName) {
        throw new Error(
          `Row ${rowNumber}: Store name, store address, book name, and author name cannot be empty`
        );
      }

      const pages = typeof record.pages === 'number' ? record.pages : parseInt(record.pages, 10);
      const price = typeof record.price === 'number' ? record.price : parseFloat(record.price);

      if (isNaN(pages) || pages < 1) {
        throw new Error(`Row ${rowNumber}: Invalid pages value: ${record.pages}. Must be a positive integer.`);
      }

      if (isNaN(price) || price < 0) {
        throw new Error(`Row ${rowNumber}: Invalid price value: ${record.price}. Must be a non-negative number.`);
      }

      records.push({
        store_name: storeName,
        store_address: storeAddress,
        book_name: bookName,
        pages: pages,
        author_name: authorName,
        price: price,
      });
    }

    const results = {
      created: 0,
      updated: 0,
      errors: [],
    };

    for (const record of records) {
      try {
        await processRecord(record, results);
      } catch (error) {
        results.errors.push({
          record,
          error: error.message,
        });
      }
    }

    fs.unlinkSync(filePath);

    res.json({
      message: 'CSV processed successfully',
      summary: {
        total_records: records.length,
        created: results.created,
        updated: results.updated,
        errors: results.errors.length,
      },
      errors: results.errors.length > 0 ? results.errors : undefined,
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

async function processRecord(record, results) {
  const { store_name, store_address, book_name, pages, author_name, price } =
    record;

  if (isNaN(pages) || pages < 1) {
    throw new Error(`Invalid pages value: ${pages}`);
  }
  if (isNaN(price) || price < 0) {
    throw new Error(`Invalid price value: ${price}`);
  }

  const [author] = await Author.findOrCreate({
    where: { name: author_name },
    defaults: { name: author_name },
  });

  const [book] = await Book.findOrCreate({
    where: {
      name: book_name,
      author_id: author.id,
      pages: pages,
    },
    defaults: {
      name: book_name,
      author_id: author.id,
      pages: pages,
    },
  });

  const [store] = await Store.findOrCreate({
    where: {
      name: store_name,
      address: store_address,
    },
    defaults: {
      name: store_name,
      address: store_address,
    },
  });

  const [storeBook, created] = await StoreBook.findOrCreate({
    where: {
      store_id: store.id,
      book_id: book.id,
    },
    defaults: {
      store_id: store.id,
      book_id: book.id,
      price: price,
      copies: 1,
      sold_out: false,
    },
  });

  if (!created) {
    await storeBook.update({
      copies: storeBook.copies + 1,
      price: price,
      sold_out: false,
    });
    results.updated++;
  } else {
    results.created++;
  }
}

export default { uploadCSV };
