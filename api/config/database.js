module.exports = {
  development: {
    username: 'postgres',
    password: 'postgres',
    database: 'creek',
    host: 'localhost',
    dialect: 'postgres',
    logging: false
  },
  test: {
    username: 'postgres',
    password: 'postgres',
    database: 'rss_reader_test',
    host: 'localhost',
    dialect: 'postgres'
  },
 production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
};