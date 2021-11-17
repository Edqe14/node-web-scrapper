const { model, Schema } = require("mongoose");

const schema = new Schema({
  url: {
    type: String,
    required: true
  },
  proxy: String,
  title: String,
  description: String,
  metas: Object,
  createdAt: {
    type: Number,
    required: true,
    default: () => Date.now(),
  },
  lastChecked: {
    type: Number,
    required: true,
    default: () => Date.now()
  }
});

module.exports = model('webmeta', schema);