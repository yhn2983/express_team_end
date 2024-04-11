// 專題用，會員資料表
import { Sequelize, DataTypes } from 'sequelize'

// 加密密碼字串用
import { generateHash } from '#db-helpers/password-hash.js'

export default async function (sequelize) {
  return sequelize.define(
    'Member',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      photo: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      nickname: {
        type: DataTypes.STRING(25),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      mobile: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      birthday: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      address: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      member_level: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      level_name: {
        type: DataTypes.STRING(10),
        allowNull: false,
      },
      level_desc: {
        type: DataTypes.STRING(10),
        allowNull: false,
      },
      carbon_points_got: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      carbon_points_have: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      hooks: {
        // 建立時產生密碼加密字串用
        beforeCreate: async (address_book) => {
          if (address_book.password) {
            address_book.password = await generateHash(address_book.password)
          }
        },
        // 更新時產生密碼加密字串用
        beforeUpdate: async (address_book) => {
          if (address_book.password) {
            address_book.password = await generateHash(address_book.password)
          }
        },
      },
      tableName: 'address_book', //直接提供資料表名稱
      timestamps: false, // 禁用時間戳
      paranoid: false, // 軟性刪除
      underscored: true, // 所有自動建立欄位，使用snake_case命名
      // createdAt: 'created_at', // 建立的時間戳
      // updatedAt: 'updated_at', // 更新的時間戳
    }
  )
}
