'use strict';

const mongoose = require('mongoose');

const blogSchema = mongoose.Schema({
  title: {type: String, required: true},
  content: {type: String, required: true},
  author: {
    firstName: {type: String, required: true},
    lastName: {type: String, required: true}
  }
});

blogSchema.virtual('nameString').get(function() {
  return `${this.author.firstName} ${this.author.lastName}`.trim();
});

blogSchema.methods.serialize = function(){
  return{
    id:this._id,
    title:this.title,
    content:this.content,
    author:this.author
  };
};

const Blog = mongoose.model('Blog Post', blogSchema);
module.exports = { Blog };