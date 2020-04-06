const express = require("express");
const path = require("path");
const http = require("http");
const socketio = require("socket.io");

const formatMessage = require("./utils/messages");
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.json());

const {
  allConversations,
  getAllConversations,
  deleteConversation,
  findConversation,
  initializeConversation,
  stateValidation,
  applyMutation,
  handleMutation,
} = require("./utils/conversations");

function responeHandler(res, responseBody, responseCode, status) {
  res.statusCode = responseCode;
  responseBody.ok = status;
  res.header("Content-Type", "application/json");
  res.send(responseBody);
  res.end();
}

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
  res.header("Access-Control-Allow-Headers", "*");
  next();
});

app.get("/ping", function (req, res) {
  let sucessResponse = {
    msg: "pong",
  };
  responeHandler(res, sucessResponse, 200, true);
});

app.get("/info", (req, res) => {
  let myApproach =
    "Went through the complete challenge including the video. Did further research about OT algorithm and other similar approaches.Focussed a lot on research as I haven't worked on something similar. As the problem is quite complex, I divided the problem into different scenarios and solved it. In short research, research and research and then test, test and test corner cases";
  let addExtras = "Create a user interface similar to that of Google Docs";
  let mySuggestions =
    "I believe the most challenging part is the algorithm implementation. If a candidate can implement the algorithm, then creating the backend and frontend should be straight forward";
  let informationResponse = {
    author: {
      email: "umeshmaharshi@gmail.com",
      name: "Umesh Chinalachi",
    },
    frontend: {
      url: "string, the url of your frontend.",
    },
    language: "node.js",
    sources:
      "string, the url of a github repository including your backend sources and your frontend sources",
    answers: {
      "1": myApproach,
      "2": addExtras,
      "3": mySuggestions,
    },
  };
  responeHandler(res, informationResponse, 200, true);
});

app.post("/mutations", (req, res) => {
  let mutation = req.body;
  let conversationId = req.body.conversationId;
  let conversation = findConversation(conversationId);
  let updateConversationsList = false;
  if (!conversation) {
    initializeConversation(conversationId, mutation.origin);
    updateConversationsList = true;
    conversation = findConversation(conversationId);
  }
  let lastMutation = conversation.lastMutation;
  let stateStatus = stateValidation(conversationId, mutation);
  try {
    // can apply the mutation directly
    if (stateStatus == 0) {
      applyMutation(conversationId, mutation);
      conversation = findConversation(conversationId);
      responeHandler(
        res,
        { msg: "Successfull", text: conversation.text },
        201,
        true
      );
    } else if (stateStatus == 1) { // the current state is 1 step ahead of the mutation
      handleMutation(mutation);
      conversation = findConversation(conversationId);
      responeHandler(
        res,
        { msg: "Successfull", text: conversation.text },
        201,
        true
      );
    } else {
      // Completely out of sync.Too complex to handle for now.
      responeHandler(
        res,
        { msg: "Invalid Mutation", text: conversation.text },
        400,
        false
      );
    }
    if(stateStatus != -1) {
      io.sockets.to(mutation.conversationId).emit("mutation", findConversation(mutation.conversationId));
    }
    if(updateConversationsList) io.emit("updateList", getAllConversations());
  } catch (ex) {
    responeHandler(
      res,
      { msg: "Invalid Mutation", text: conversation.text },
      400,
      false
    );
  }
});

app.get("/conversations", function (req, res) {
  let conversationId = req.params.id;
  let onGoingConvos = getAllConversations(conversationId);
  responeHandler(
    res,
    { conversations: onGoingConvos.conversations, msg: "success" },
    200,
    true
  );
});

app.get("/conversations/:id", function (req, res) {
  let conversationId = req.params.id;
  let conversation = findConversation(conversationId);
  let msg = conversation ? "Successful" : "Invalid ConversationId";
  if(conversation == null) responeHandler(res, {msg}, 400, false);
  else responeHandler(res, conversation, 200, true);
});

app.delete("/conversations/:id", function (req, res) {
  let conversationId = req.params.id;
  let deletionStatus = deleteConversation(conversationId);
  let msg = deletionStatus ? "Successfully Deleted" : "Invalid ConversationId";
  responeHandler(res, { msg }, 204, deletionStatus);
  if(deletionStatus) io.emit("updateList", getAllConversations());
});

const botName = "Ava";

// Run when client connects
io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);
    socket.join(user.room);
    // Welcome current user
    socket.emit("message", formatMessage(botName, "Welcome to ChatCord!"));
    // Broadcast when a user connects
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(botName, `${user.username} has joined the chat`)
      );

    // Send users and room info
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  // Listen for chatMessage
  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);

    io.to(user.room).emit("message", formatMessage(user.username, msg));
  });

  // Runs when client disconnects
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage(botName, `${user.username} has left the chat`)
      );

      // Send users and room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
