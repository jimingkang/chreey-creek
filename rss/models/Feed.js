module.exports = (sequelize, DataTypes) => {
  const Feed = sequelize.define('Feed', {
    url: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    title: DataTypes.STRING,
    description: DataTypes.TEXT,
    lastUpdated: DataTypes.DATE
  },{
  tableName: 'feed',  // 明确指定小写表名
 // timestamps: false    // 如果你不需要 createdAt/updatedAt
});

  Feed.associate = models => {
    Feed.hasMany(models.FeedItem, {
      foreignKey: 'feedId',
      as: 'items'
    });
  };

  return Feed;
};