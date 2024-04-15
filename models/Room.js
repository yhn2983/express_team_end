import { Sequelize, DataTypes } from 'sequelize'

// 聊天室資料表
export default async function Room(sequelize) {
  return sequelize.define(
    'Room',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user1_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      user2_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    },
    {
      tableName: 'rooms',
      timestamps: false,
      underscored: true,
    }
  )
}
