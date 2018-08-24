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
/*
//DONE
app.get('/posts',  (req, res) => {//get request to posts
  BlogPost.find()
    .then(blogPosts => {
      blogPosts.map(blogPost => blogPost.serialize());//lists all the blog posts according to what is in our serialize method in models.js
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({message: 'Internal server error'});
    });
});
*/
app.get('/posts', (req, res) => {
  BlogPost
    .find()
    .then(posts => {
      res.json(posts.map(post => {
        return {
          id: post._id,
          author: post.nameString,
          content: post.content,
          title: post.title
        };
      }));
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    });
});

//DONE

app.get('/posts/:id', (req, res) => {//get to specific post
  BlogPost.findById(req.params.id)
    .then(blogPost => {
      res.json({
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

//DONE
app.get('/authors', (req, res) => {//get request to all authors
  Author.find()
    .then(authors => {
      res.json(authors.map(author => {
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
  for (let i = 0; i < requiredFields.length; i++){
    const field = requiredFields[i];
    if(!(field in req.body)){
      const errorMessage = `Missing ${field} in request body`;
      console.error(errorMessage);
      return res.status(400).send(errorMessage);
    }
  }
  BlogPost.create({
    title: req.body.title,
    content: req.body.content,
    author: req.body.author
  })
    .then(blogPost => res.status(201).json(blogPost.serialize()))
    .catch(err => {
      console.error(err);
      res.status(500).json({message: 'internal server error'});
    });
});

//DONE
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
    .then(author => res.status(201).json({
      _id: author.id,
      name: `${author.firstName} ${author.lastName}`,
      userName: author.userName
    }))
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'Something went wrong' });
    });
});

//DONE
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
    .findByIdAndUpdate(req.params.id, { $set: toUpdate })
    .then(blogPost => res.status(200).json({//200 status meaning that the request succeeded and we are showing the result of our put request
      id: blogPost.id,
      title: blogPost.title,
      content: blogPost.content
    }))
    .catch(err => res.status(500).json({ message: 'Internal server error' }));
});

/*
//IN PROGRESS
app.put('/authors/:id', (req, res) => {
  if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
    const message =
      `Request path id (${req.params.id}) and request body id ` +
      `(${req.body.id}) must match`;
    console.error(message);
    return res.status(400).json({ message: message });
  }

  const toUpdate = {};
  const updateableFields = ['firstName', 'lastName', 'userName'];

  updateableFields.forEach(field => {
    if (field in req.body) {
      toUpdate[field] = req.body[field];
    }
  });
  let updatedUsername = toUpdate.userName;
  //HELP
  Author
    .findOne({userName: updatedUsername})
    .then(authorName => {
      if(){//author name is taken

      }
      else{//update the author

      }


    }
    .then(author => res.status(200).json({//200 status meaning that the request succeeded and we are showing the result of our put request
      id: author.id,
      name: `${author.firstName} ${author.lastName}`,
      userName: author.userName
    }))
    .catch(err => res.status(500).json({ message: 'Internal server error' }));

});

*/

//stays the same for this challenge
app.delete('/posts/:id', (req, res) =>{
  BlogPost.findByIdAndRemove(req.params.id)
    .then(blogPost => res.status(204).end())
    .catch(err => res.status(500).json({ message: 'Internal server error' }));
});

//DONE
app.delete('/authors/:id', (req, res) =>{
  BlogPost.findByIdAndRemove({author: req.params.id})//removes any blog posts with a reference to this author
    .then(Author.findByIdAndRemove(req.params.id))//removes the actual author
    .then(author => res.status(204).end())
    .catch(err => res.status(500).json({ message: 'Internal server error' }));
});

app.use('*', function(req, res) {
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

module.exports = { app, runServer, closeServer };