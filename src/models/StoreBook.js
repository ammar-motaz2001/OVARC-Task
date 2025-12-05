import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Store from './Store.js';
import Book from './Book.js';

const StoreBook = sequelize.define(
  'StoreBook',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    store_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Store,
        key: 'id',
      },
    },
    book_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Book,
        key: 'id',
      },
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    copies: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 0,
      },
    },
    sold_out: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: 'store_books',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['store_id', 'book_id'],
      },
    ],
  }
);

Store.belongsToMany(Book, {
  through: StoreBook,
  foreignKey: 'store_id',
  otherKey: 'book_id',
  as: 'books',
});

Book.belongsToMany(Store, {
  through: StoreBook,
  foreignKey: 'book_id',
  otherKey: 'store_id',
  as: 'stores',
});

StoreBook.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });
StoreBook.belongsTo(Book, { foreignKey: 'book_id', as: 'book' });

export default StoreBook;
