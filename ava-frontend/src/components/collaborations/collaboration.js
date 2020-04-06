import React, { Component } from "react";
import { Card, Button, InputGroup } from "react-bootstrap";
import "./collaboration.css";
import { Keyframes, Frame } from "react-keyframes";
import socketIOClient from "socket.io-client";
import * as d3 from "d3";

class Collaboration extends Component {
  constructor(props) {
    super(props);
    if (!props.match.params.id) {
      this.props.history.push("/");
    }
    const socket = socketIOClient("localhost:4000");
    this.state = { collaboration: {}, socket: socket, prevText: "", text : "" };
    this.visualizeMutation = this.visualizeMutation.bind(this);
    this.simpleVisualization = this.simpleVisualization.bind(this);
  }

  collabRef = React.createRef();

  getConversation() {
    fetch("http://localhost:4000/conversations/" + this.props.match.params.id, {
      mode: "cors",
      method: "GET",
    })
      .then((response) => {
        return response.json();
      })
      .then(
        (conversation) => {
          if (!conversation.ok) this.props.history.push("/");
          this.setState({
            collaboration: conversation,
            prevText: this.collaboration ? this.collaboration.text : "",
            text : conversation.text
          });
        },
        (error) => {
          console.log("something went wrong !");
          this.props.history.push("/");
        }
      );
    this.state.socket.on("deleted", (message) => {
        alert("Conversation deleted !");
        this.props.history.push("/");
    })  
    this.state.socket.on("mutation", (conversation) => {
      this.setState({ prevText: this.state.collaboration.text,
      text : conversation.text,
      collaboration: conversation });
      this.simpleVisualization();
    });
  }

  componentDidMount() {
    this.getConversation();
    this.state.socket.emit("joinRoom", {
      username: "dummy",
      room: this.props.match.params.id,
    });
  }

  simpleVisualization() {
    var reactComp = this;
    this.setState({text : this.state.prevText});
    setTimeout(function () {
      reactComp.setState({
        text: reactComp.state.collaboration.text
      });
    }, 200);
  }

  visualizeMutation() {
    let prefix = "",
      suffix = "";
    let transformations = [];
    let sliceIndex = this.state.collaboration.lastMutation.data.index;
    if (this.state.collaboration.lastMutation.modifiedIndex != undefined)
      sliceIndex = this.state.collaboration.lastMutation.modifiedIndex;
    let deleteLength = this.state.collaboration.lastMutation.data.length;
    if (this.state.collaboration.lastMutation.modifiedLength != undefined)
      deleteLength = this.state.collaboration.lastMutation.modifiedLength;
    if (this.state.collaboration.lastMutation.data.type === "insert") {
      prefix = this.state.prevText.slice(0, sliceIndex);
      let insertion = this.state.collaboration.lastMutation.data.text;
      suffix = this.state.prevText.slice(sliceIndex);
      let duration = 1000 / insertion.length + 1;
      transformations = [prefix + suffix];
      let runningModification = "";
      for (let i = 0; i < insertion.length; i++) {
        runningModification = runningModification + insertion.charAt(i);
        transformations.push(prefix + runningModification + suffix);
      }
    } else {
      prefix = this.state.prevText.slice(0, sliceIndex + deleteLength);
      let deletion = this.state.collaboration.lastMutation.data.length;
      suffix = this.state.prevText.slice(sliceIndex + deleteLength);
      let duration = 1000 / deletion + 1;
      transformations = [prefix + suffix];
      let runningModification = prefix;
      for (let i = 0; i < deletion; i++) {
        runningModification = runningModification.slice(
          0,
          prefix.length - i - 1
        );
        transformations.push(runningModification + suffix);
      }
    }
    this.setState({ transformations });
  }

  render() {
    const collaborationId = this.state.collaboration.conversationId;
    const text = this.state.text;
    const simpleVisualization = this.simpleVisualization;
    return (
      <div>
        <Card>
          <Card.Header>{collaborationId}</Card.Header>
          <Card.Body>
            <Card.Text>{text}</Card.Text>
            <Button variant="primary" onClick={() => simpleVisualization()}>
              Last Mutation
            </Button>
          </Card.Body>
        </Card>
      </div>
    );
  }
}

export default Collaboration;
