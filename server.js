// database is let instead of const to allow us to modify it in test.js
let database = {
  users: {},
  articles: {},
  nextArticleId: 1,
  // Comments Object
  comments: {},
  nextCommentId: 1
};

const routes = {
  '/users': {
    'POST': getOrCreateUser
  },
  '/users/:username': {
    'GET': getUser
  },
  '/articles': {
    'GET': getArticles,
    'POST': createArticle
  },
  '/articles/:id': {
    'GET': getArticle,
    'PUT': updateArticle,
    'DELETE': deleteArticle
  },
  '/articles/:id/upvote': {
    'PUT': upvoteArticle
  },
  '/articles/:id/downvote': {
    'PUT': downvoteArticle
  },
  // Comment routes
  '/comments': {
   'POST': createComment
  },
  '/comments/:id': {
   'PUT': updateComment,
   'DELETE': deleteComment
  },
  '/comments/:id/upvote': {
   'PUT': upvoteComment
  },
  '/comments/:id/downvote': {
   'PUT': downvoteComment
  }
};

function getUser(url, request) {
  // const username = url.split('/').filter(segment => segment)[1];
  // const user = database.users[username];
  const response = {};
  response.status = 200;
  // For Testing
  if ('Ted' in database.users) {
    response.body = {"users": database.users, "articles":database.articles,
    "comments": database.comments};
  } else {
    response.body = {"message" : "Nope"}
  }
  // if (user) {
  //   const userArticles = user.articleIds.map(
  //       articleId => database.articles[articleId]);
  //   const userComments = user.commentIds.map(
  //       commentId => database.comments[commentId]);
  //   response.body = {
  //     user: user,
  //     userArticles: userArticles,
  //     userComments: userComments
  //   };
  //   response.status = 200;
  // } else if (username) {
  //   response.status = 404;
  // } else {
  //   response.status = 400;
  // }

  return response;
}

function getOrCreateUser(url, request) {
  const username = request.body && request.body.username;
  const response = {};

  if (database.users[username]) {
    response.body = {user: database.users[username]};
    response.status = 200;
  } else if (username) {
    const user = {
      username: username,
      articleIds: [],
      commentIds: []
    };
    database.users[username] = user;

    response.body = {user: user};
    response.status = 201;
  } else {
    response.status = 400;
  }

  return response;
}

function getArticles(url, request) {
  const response = {};

  response.status = 200;
  response.body = {
    articles: Object.keys(database.articles)
        .map(articleId => database.articles[articleId])
        .filter(article => article)
        .sort((article1, article2) => article2.id - article1.id)
  };

  return response;
}

function getArticle(url, request) {
  const id = Number(url.split('/').filter(segment => segment)[1]);
  const article = database.articles[id];
  const response = {};

  if (article) {
    article.comments = article.commentIds.map(
      commentId => database.comments[commentId]);

    response.body = {article: article};
    response.status = 200;
  } else if (id) {
    response.status = 404;
  } else {
    response.status = 400;
  }

  return response;
}

function createArticle(url, request) {
  const requestArticle = request.body && request.body.article;
  const response = {};

  if (requestArticle && requestArticle.title && requestArticle.url &&
      requestArticle.username && database.users[requestArticle.username]) {
    const article = {
      id: database.nextArticleId++,
      title: requestArticle.title,
      url: requestArticle.url,
      username: requestArticle.username,
      commentIds: [],
      upvotedBy: [],
      downvotedBy: []
    };

    database.articles[article.id] = article;
    database.users[article.username].articleIds.push(article.id);

    response.body = {article: article};
    response.status = 201;
  } else {
    response.status = 400;
  }

  return response;
}

function updateArticle(url, request) {
  const id = Number(url.split('/').filter(segment => segment)[1]);
  const savedArticle = database.articles[id];
  const requestArticle = request.body && request.body.article;
  const response = {};

  if (!id || !requestArticle) {
    response.status = 400;
  } else if (!savedArticle) {
    response.status = 404;
  } else {
    savedArticle.title = requestArticle.title || savedArticle.title;
    savedArticle.url = requestArticle.url || savedArticle.url;

    response.body = {article: savedArticle};
    response.status = 200;
  }

  return response;
}

function deleteArticle(url, request) {
  const id = Number(url.split('/').filter(segment => segment)[1]);
  const savedArticle = database.articles[id];
  const response = {};

  if (savedArticle) {
    database.articles[id] = null;
    savedArticle.commentIds.forEach(commentId => {
      const comment = database.comments[commentId];
      database.comments[commentId] = null;
      const userCommentIds = database.users[comment.username].commentIds;
      userCommentIds.splice(userCommentIds.indexOf(id), 1);
    });
    const userArticleIds = database.users[savedArticle.username].articleIds;
    userArticleIds.splice(userArticleIds.indexOf(id), 1);
    response.status = 204;
  } else {
    response.status = 400;
  }

  return response;
}

function upvoteArticle(url, request) {
  const id = Number(url.split('/').filter(segment => segment)[1]);
  const username = request.body && request.body.username;
  let savedArticle = database.articles[id];
  const response = {};

  if (savedArticle && database.users[username]) {
    savedArticle = upvote(savedArticle, username);

    response.body = {article: savedArticle};
    response.status = 200;
  } else {
    response.status = 400;
  }

  return response;
}

function downvoteArticle(url, request) {
  const id = Number(url.split('/').filter(segment => segment)[1]);
  const username = request.body && request.body.username;
  let savedArticle = database.articles[id];
  const response = {};

  if (savedArticle && database.users[username]) {
    savedArticle = downvote(savedArticle, username);

    response.body = {article: savedArticle};
    response.status = 200;
  } else {
    response.status = 400;
  }

  return response;
}

function upvote(item, username) {
  if (item.downvotedBy.includes(username)) {
    item.downvotedBy.splice(item.downvotedBy.indexOf(username), 1);
  }
  if (!item.upvotedBy.includes(username)) {
    item.upvotedBy.push(username);
  }
  return item;
}

function downvote(item, username) {
  if (item.upvotedBy.includes(username)) {
    item.upvotedBy.splice(item.upvotedBy.indexOf(username), 1);
  }
  if (!item.downvotedBy.includes(username)) {
    item.downvotedBy.push(username);
  }
  return item;
}

// Function to create a Comment
function createComment(url, request) {
  const response = {};
  // Make sure there is a request body
  // That all required fields exist
  // And the username and article exist
  if (request.body && request.body.username
  && request.body.articleid && request.body.body
  && database.users[request.body.username]
  && database.articles[request.body.articleid]) {
    // Parse data from the received POST object to create
    // a new Comment object
    const comment = {
      id: database.nextCommentId++,
      body: request.body.body,
      username: request.body.username,
      articleid: request.body.articleid,
      upvotedby: [],
      downvotedby: []
    };
    // Create a new comment with the given id
    database.comments[comment.id] = comment;
    // Add Comment Id to user and article
    database.users[request.body.username].commentIds.push(comment.id);
    database.articles[request.body.articleid].commentIds.push(comment.id);
    // Send a response with a status code and the body
    // of the created Comment
    response.body = {comment: comment};
    response.status = 201;
  } else {
    // If the request body is missing or missing a
    // required field or username or article do not exist
    // send a bad request status code
    response.status = 400;
  }
  return response;
};

// Update Comments
function updateComment(url, request) {
  // Retrieve the id from the url
  const id = Number(url.split('/').filter(segment => segment)[1]);
  // Retrieve the correct comment
  const savedComment = database.comments[id];
  const response = {};
  // Check to see if id exists, that there is a change to the comment
  // And that the user exists if updated
  if (!id || !request.body.body || !database.users[request.body.username]) {
    // If not return a status code of 400
    response.status = 400;
  } else if (!savedComment) {
    // If a comment with the given id doesn't exist
    // Return a status code of 404
    response.status = 400;
  } else {
    // Save updates, return updated comment and status code of 200
    savedComment.body = request.body.body || savedComment.body;
    savedComment.username = request.body.username || savedComment.username;
    response.body = {comment: savedComment};
    response.status = 200;
  }
  return response;
};

// Delete a comment
function deleteComment(url, request) {
  // Retrieve the id from the url
  const id = Number(url.split('/').filter(segment => segment)[1]);
  // Retrieve the correct comment
  const savedComment = database.comments[id];
  const response = {};

  // If the Comment exists
  if (savedComment) {
    // Delete the comment from the comments object
    delete database.comments[id];
    // Set the Articles commentIds array to a variable
    const articleCommentIds = database.articles[savedComment.articleid].commentIds;
    // Remove the comment Id from the Article's commentIds array
    articleCommentIds.splice(articleCommentIds.indexOf(id), 1);
    // Set the Users commentIds array to a variable
    const userCommentIds = database.users[savedComment.username].commentIds;
    // Remove the comment Id from the User's commentIds array
    userCommentIds.splice(userCommentIds.indexOf(id), 1);
    // Return a status code of 400
    response.status = 204;
  } else {
    // If a comment with the given id doesn't exist
    // Return a status code of 400
    response.status = 404;
  }
  return response;
};

function upvoteComment(){

};

function downvoteComment() {

};
// Write all code above this line.

const http = require('http');
const url = require('url');

const port = process.env.PORT || 4000;
const isTestMode = process.env.IS_TEST_MODE;

const requestHandler = (request, response) => {
  const url = request.url;
  const method = request.method;
  const route = getRequestRoute(url);

  if (method === 'OPTIONS') {
    var headers = {};
    headers["Access-Control-Allow-Origin"] = "*";
    headers["Access-Control-Allow-Methods"] = "POST, GET, PUT, DELETE, OPTIONS";
    headers["Access-Control-Allow-Credentials"] = false;
    headers["Access-Control-Max-Age"] = '86400'; // 24 hours
    headers["Access-Control-Allow-Headers"] = "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept";
    response.writeHead(200, headers);
    return response.end();
  }

  response.setHeader('Access-Control-Allow-Origin', null);
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.setHeader(
      'Access-Control-Allow-Headers', 'X-Requested-With,content-type');

  if (!routes[route] || !routes[route][method]) {
    response.statusCode = 400;
    return response.end();
  }

  if (method === 'GET' || method === 'DELETE') {
    const methodResponse = routes[route][method].call(null, url);
    !isTestMode && (typeof saveDatabase === 'function') && saveDatabase();

    response.statusCode = methodResponse.status;
    response.end(JSON.stringify(methodResponse.body) || '');
  } else {
    let body = [];
    request.on('data', (chunk) => {
      body.push(chunk);
    }).on('end', () => {
      body = JSON.parse(Buffer.concat(body).toString());
      const jsonRequest = {body: body};
      const methodResponse = routes[route][method].call(null, url, jsonRequest);
      !isTestMode && (typeof saveDatabase === 'function') && saveDatabase();

      response.statusCode = methodResponse.status;
      response.end(JSON.stringify(methodResponse.body) || '');
    });
  }
};

const getRequestRoute = (url) => {
  const pathSegments = url.split('/').filter(segment => segment);

  if (pathSegments.length === 1) {
    return `/${pathSegments[0]}`;
  } else if (pathSegments[2] === 'upvote' || pathSegments[2] === 'downvote') {
    return `/${pathSegments[0]}/:id/${pathSegments[2]}`;
  } else if (pathSegments[0] === 'users') {
    return `/${pathSegments[0]}/:username`;
  } else {
    return `/${pathSegments[0]}/:id`;
  }
}

if (typeof loadDatabase === 'function' && !isTestMode) {
  const savedDatabase = loadDatabase();
  if (savedDatabase) {
    for (key in database) {
      database[key] = savedDatabase[key] || database[key];
    }
  }
}

const server = http.createServer(requestHandler);

server.listen(port, (err) => {
  if (err) {
    return console.log('Server did not start succesfully: ', err);
  }

  console.log(`Server is listening on ${port}`);
});
