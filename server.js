'use strict';

const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const { PORT, DATABASE_URL } = require('./config');
const { BlogPost, Author } = require('./models');

const app = express();
app.use(morgan('common'));
app.use(express.json());

//DONE: works in postman
app.get('/posts', (req, res) => {//retrieves all of the blogposts in the database
  BlogPost.find()
    .then(blogPosts => {
      res.json(blogPosts.map(post => {//recall that map allows us to return a new array 
        return {
          id: post._id,
          author: post.nameString,
          content: post.content,
          title: post.title,//no comments here as requested in instructions
        };
      }));
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    });
});

//DONE: works in postman
app.get('/posts/:id', (req, res) => {//get to specific post through accessing "$oid"
  BlogPost.findById(req.params.id)
    .then(blogPost => {
      res.json({//response object containing the requested post
        id: blogPost._id,
        author: blogPost.authorName,
        content: blogPost.content,
        title: blogPost.title,
        comments: blogPost.comments//should i still be using serialize here in some way?
      });
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({message: 'Internal server error'});
    });
});

//DONE: works in postman
app.get('/authors', (req, res) => {//get request to all authors
  Author.find()//general find() to all of the available authors in the database
    .then(authors => {
      res.json(authors.map(author => {//once all the authors are found, map them to a new array and return them in our json response
        return{
          id:author._id,
          name:`${author.firstName} ${author.lastName}`,
          userName: author.userName
        };
      }));
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'internal server error' });
    });
});

//HELP

app.post('/posts', (req, res) => {
  const requiredFields = ['title', 'content', 'author_id'];
  requiredFields.forEach(field => {
    if (!(field in req.body)) {
      const message = `Missing \`${field}\` in request body`;
      console.error(message);
      return res.status(400).send(message);
    }
  });

  Author
    .findById(req.body.author_id)
    .then(author => {
      if (author) {
        BlogPost
          .create({
            title: req.body.title,
            content: req.body.content,
            author: req.body.id
          })
          .then(blogPost => res.status(201).json(blogPost.serialize()))
          .catch(err => {
            console.error(err);
            res.status(500).json({ error: 'Something went wrong' });
          });
      }
      else {
        const message = 'Author not found';
        console.error(message);
        return res.status(400).send(message);
      }
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'something went horribly awry' });
    });
});

//DONE: works in postman
app.post('/authors', (req, res) => {
  const requiredFields = ['firstName', 'lastName', 'userName'];
  for (let i = 0; i < requiredFields.length; i++){
    const field = requiredFields[i];
    if(!(field in req.body)){
      const errorMessage = `Missing ${field} in request body`;
      console.error(errorMessage);
      return res.status(400).send(errorMessage);
    }
  }
  Author
    .create({
      'firstName': req.body.firstName,
      'lastName': req.body.lastName,
      'userName': req.body.userName
    })
    .then(author => res.status(201).json({//201 response indicates the success of a 
      _id: author.id,
      name: `${author.firstName} ${author.lastName}`,
      userName: author.userName
    }))
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'Something went wrong' });
    });
});

//DONE: works in postman
app.put('/posts/:id', (req, res) => {
  if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
    const message =
      `Request path id (${req.params.id}) and request body id ` +
      `(${req.body.id}) must match`;
    console.error(message);
    return res.status(400).json({ message: message });
  }

  const toUpdate = {};
  const updateableFields = ['title', 'content'];//took out author here

  updateableFields.forEach(field => {
    if (field in req.body) {
      toUpdate[field] = req.body[field];
    }
  });

  BlogPost
    .findByIdAndUpdate(req.params.id, { $set: toUpdate }, {new:true} )//make sure to add new:true 
    .then(blogPost => res.status(200).json({//200 status meaning that the request succeeded and we are showing the result of our put request
      id: blogPost.id,
      title: blogPost.title,
      content: blogPost.content
    }))
    .catch(err => res.status(500).json({ message: 'Internal server error' }));
});


//IN PROGRESS
app.put('/authors/:id', (req, res) => {
  if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {//standard from previous put requests
    const message =
      `Request path id (${req.params.id}) and request body id ` +
      `(${req.body.id}) must match`;
    console.error(message);
    return res.status(400).json({ message: message });
  }

  const toUpdate = {};
  const updateableFields = ['firstName', 'lastName', 'userName'];//specifying which fields can be updated in the put request

  updateableFields.forEach(field => {
    if (field in req.body) {//update each field based on the information located in the body of the request
      toUpdate[field] = req.body[field];
    }
  });
  let updatedUsername = toUpdate.userName;//stores the updated username so that it can be used as an identifier

  Author
    .findOne({ userName: updatedUsername.userName || '', _id: { $ne: req.params.id } })//we want to check to see if the updated username is already taken by someone else in the system
    .then(author => {
      if(author){//author name is taken
        const message = 'This username is already taken';
        return res.status(400).send(message);
      }
      else {//update the author
        Author
          .findByIdAndUpdate(req.params.id, { $set: toUpdate }, { new: true })//finds the id of the author
          .then(updatedAuthor => { res.status(200).json({//200 status meaning that the request succeeded and we are showing the result of our put request
            id: updatedAuthor.id,
            name: `${updatedAuthor.firstName} ${updatedAuthor.lastName}`,
            userName: updatedAuthor.userName
          });
          })
          .catch(err => res.status(500).json({ message: 'Internal server error' }));

      }
    });
});

//stays the same for this challenge
app.delete('/posts/:id', (req, res) =>{
  BlogPost.findByIdAndRemove(req.params.id)
    .then(blogPost => res.status(204).end())
    .catch(err => res.status(500).json({ message: 'Internal server error' }));
});

app.delete('/authors/:id', (req, res) =>{
  BlogPost.remove({author: req.params.id})//removes any blog posts with a reference to this specific author
    .then(() => {
      Author.findByIdAndRemove(req.params.id)//removes the actual author
        .then(() => {res.status(204).end();//no content success code
        });
    })
    .catch(err => res.status(500).json({ message: 'Internal server error' }));
});

app.use('*', function(req, res) {//wild card for if the user tries to make a request to something that doesn't exist
  res.status(404).json({ message: 'Not Found' });
});


let server;

function runServer(databaseUrl, port = PORT) {
  return new Promise((resolve, reject) => {
    mongoose.connect(
      databaseUrl,
      err => {
        if (err) {
          return reject(err);
        }
        server = app
          .listen(port, () => {
            console.log(`Your app is listening on port ${port}`);
            resolve();
          })
          .on('error', err => {
            mongoose.disconnect();
            reject(err);
          });
      }
    );
  });
}

function closeServer() {
  return mongoose.disconnect().then(() => {
    return new Promise((resolve, reject) => {
      console.log('Closing server');
      server.close(err => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  });
}

if (require.main === module) {
  runServer(DATABASE_URL).catch(err => console.error(err));
}
/*
When a file is run directly from Node.js, require.main is set to its module. 
That means that it is possible to determine whether a file has been run directly by testing require.main === module.
For a file foo.js, this will be true if run via node foo.js, but false if run by require('./foo').
Because module provides a filename property (normally equivalent to __filename), 
the entry point of the current application can be obtained by checking require.main.filename.
*/
module.exports = { app, runServer, closeServer };