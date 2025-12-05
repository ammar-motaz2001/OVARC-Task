import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Author from './Author.js';

const Book = sequelize.define(
  'Book',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    pages: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    author_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Author,
        key: 'id',
      },
    },
  },
  {
    tableName: 'books',
    timestamps: true,
  }
);

Book.belongsTo(Author, { foreignKey: 'author_id', as: 'author' });
Author.hasMany(Book, { foreignKey: 'author_id', as: 'books' });

export default Book;
