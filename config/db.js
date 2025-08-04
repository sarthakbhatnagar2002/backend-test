const mongoose = require('mongoose');

function connectToDB() {
  mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Connected to DB'))
  .catch((err) => {
    console.error('DB connection error:', err);
    process.exit(1);
  });
}

module.exports = connectToDB;
