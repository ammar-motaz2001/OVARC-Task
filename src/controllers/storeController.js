import PDFDocument from 'pdfkit';
import { Store, Book, Author, StoreBook } from '../models/index.js';
import { Op } from 'sequelize';

const downloadReport = async (req, res, next) => {
  try {
    const storeId = parseInt(req.params.id, 10);

    if (isNaN(storeId) || storeId < 1) {
      return res.status(400).json({ 
        error: 'Invalid store ID',
        message: 'Store ID must be a valid positive integer'
      });
    }

    const store = await Store.findByPk(storeId);
    if (!store) {
      return res.status(404).json({ 
        error: 'Store not found',
        message: `No store found with ID: ${storeId}`
      });
    }

    const topPriciestBooks = await StoreBook.findAll({
      where: {
        store_id: storeId,
        sold_out: false,
      },
      include: [
        {
          model: Book,
          as: 'book',
          include: [
            {
              model: Author,
              as: 'author',
            },
          ],
        },
      ],
      order: [['price', 'DESC']],
      limit: 5,
    });

    const allStoreBooks = await StoreBook.findAll({
      where: {
        store_id: storeId,
        sold_out: false,
      },
      include: [
        {
          model: Book,
          as: 'book',
          include: [
            {
              model: Author,
              as: 'author',
            },
          ],
        },
      ],
    });

    const authorBookCounts = {};
    const authorNames = {};

    allStoreBooks.forEach(storeBook => {
      const book = storeBook.book;
      if (!book || !book.author) return;

      const authorId = book.author.id;
      const authorName = book.author.name;
      const bookId = book.id;

      if (!authorBookCounts[authorId]) {
        authorBookCounts[authorId] = new Set();
        authorNames[authorId] = authorName;
      }
      authorBookCounts[authorId].add(bookId);
    });

    const topProlificAuthorsData = Object.entries(authorBookCounts)
      .map(([authorId, bookSet]) => ({
        author_id: parseInt(authorId, 10),
        author_name: authorNames[authorId],
        book_count: bookSet.size,
      }))
      .sort((a, b) => b.book_count - a.book_count)
      .slice(0, 5);

    const doc = new PDFDocument({ margin: 50 });
    const date = new Date().toISOString().split('T')[0];
    const sanitizedStoreName = store.name
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    const filename = `${sanitizedStoreName}-Report-${date}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`
    );

    doc.pipe(res);

    doc.fontSize(20).text('Store Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Store: ${store.name}`, { align: 'center' });
    doc.text(`Address: ${store.address}`, { align: 'center' });
    doc.text(`Date: ${date}`, { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(16).text('Top 5 Priciest Books', { underline: true });
    doc.moveDown();

    if (topPriciestBooks.length === 0) {
      doc.fontSize(12).text('No books available in inventory.', { indent: 20 });
    } else {
      topPriciestBooks.forEach((storeBook, index) => {
        const book = storeBook.book;
        const author = book.author;
        doc.fontSize(12);
        doc.text(`${index + 1}. ${book.name}`, { indent: 20 });
        doc.fontSize(10);
        doc.text(`   Author: ${author.name}`, { indent: 30 });
        doc.text(`   Pages: ${book.pages}`, { indent: 30 });
        doc.text(`   Price: $${parseFloat(storeBook.price).toFixed(2)}`, {
          indent: 30,
        });
        doc.text(`   Copies: ${storeBook.copies}`, { indent: 30 });
        doc.moveDown(0.5);
      });
    }

    doc.moveDown(2);

    doc.fontSize(16).text('Top 5 Prolific Authors', { underline: true });
    doc.moveDown();

    if (topProlificAuthorsData.length === 0) {
      doc.fontSize(12).text('No authors with available books.', { indent: 20 });
    } else {
      topProlificAuthorsData.forEach((authorData, index) => {
        doc.fontSize(12);
        doc.text(`${index + 1}. ${authorData.author_name}`, { indent: 20 });
        doc.fontSize(10);
        doc.text(`   Available Books: ${authorData.book_count}`, {
          indent: 30,
        });
        doc.moveDown(0.5);
      });
    }

    doc.end();
  } catch (error) {
    next(error);
  }
};

export default { downloadReport };
