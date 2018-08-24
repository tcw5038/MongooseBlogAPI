'use strict';

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const authorSchema = mongoose.Schema({//schema for author objects
  firstName: 'string',
  lastName: 'string',
  userName: {
    type: 'string',
    unique: true
  }
});

const commentSchema = mongoose.Schema({
  content:'string'//comment schema will only contain the contents of the comment: a string
});

const blogSchema = mongoose.Schema({//schema for the blog posts
  title: {type: String, required: true},
  content: {type: String, required: true},
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'Author' },//stores a reference to the author now rather than the actual author information
  comments: [commentSchema]
});

blogSchema.pre('find', function(next) {//Mongoose middleware that populates the author field when we make get requests to all the blog posts
  this.populate('author');
  next();
});

blogSchema.pre('findOne', function(next){//Mongoose middleware that populates the author field when we make get requests to a specific blog post
  this.populate('author');
  next();
});


blogSchema.virtual('nameString').get(function() {//uses virtual to combine the first and last name
  return `${this.author.firstName} ${this.author.lastName}`.trim();
});

blogSchema.methods.serialize = function(){
  return{
    id:this._id,
    author:this.nameString,
    content:this.content,
    title:this.title,
    comments:this.comments
  };
};


const Author = mongoose.model('Author', authorSchema);
const BlogPost = mongoose.model('BlogPost', blogSchema);
//const Comment = mongoose.model('Comment', commentSchema);

module.exports = { Author, BlogPost };//adding author here for us to export