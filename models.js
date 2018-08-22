'use strict';

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

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
    author:this.nameString
  };
};

blogSchema.pre('find', function(next) {//middleware that populates the author field when we make get requests to the blog posts
  this.populate('author');
  next();
});

blogSchema.pre('findOne', function(next){//middleware that populates the author field when we make get requests to a specific blog post
  this.populate('author');
  next();
});

const authorSchema = mongoose.Schema({
  firstName: 'string',
  lastName: 'string',
  userName: {
    type: 'string',
    unique: true//I am assuming this is designed to check whether a username has already been taken by someone else in the database
  }
});

const commentSchema = mongoose.Schema({
  content:'string'
});





const Author = mongoose.model('Author', authorSchema);
const BlogPost = mongoose.model('BlogPost', blogSchema);
const Comment = mongoose.model('Comment', commentSchema);
//added for new assignment

module.exports = { Author, BlogPost, Comment };//adding author here for us to export