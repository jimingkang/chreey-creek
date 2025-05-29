module.exports = (sequelize, DataTypes) => {
  const FeedItem = sequelize.define('FeedItem', {
    guid: {
      type: DataTypes.STRING,
      allowNull: false
    },
    title: DataTypes.STRING,
    link: DataTypes.STRING,
    pubDate: DataTypes.DATE,
    content: DataTypes.TEXT,
    contentSnippet: DataTypes.TEXT
  },{
  tableName: 'feeditems',  // 明确指定小写表名
  //timestamps: false
});

  FeedItem.associate = models => {
    FeedItem.belongsTo(models.Feed, {
      foreignKey: 'feedId',
      as: 'feed'
    });
  };

  return FeedItem;
};