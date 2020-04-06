import React, { Component } from "react";
import { ListGroup } from "react-bootstrap";
import socketIOClient from 'socket.io-client';

class Collaborations extends Component {
  constructor(props) {
    super(props);
    const socket = socketIOClient("localhost:4000");
    this.state = { conversations: [], socket : socket };
  }


  updateAllConversationsList() {
    fetch("http://localhost:4000/conversations", {
        mode: "cors",
        method: "GET",
      })
        .then((response) => {
          return response.json();
        })
        .then(
          (conversations) => {
            this.setState({ conversations : conversations.conversations });
          },
          (error) => {
            console.log("something went wrong !");
          }
        );
        this.state.socket.on('updateList', (allConversationsData) => {
            this.setState({conversations : allConversationsData.conversations});
        });
  }

  componentDidMount() {
        this.updateAllConversationsList();
  }

  render() {
    const allConversations = this.state.conversations;
    return (
      <div>
          <h4 className="text-center">All conversations</h4>
          <ListGroup className="col-5 mx-auto text-center">
        {allConversations.length > 0 && allConversations.map((d) => (
          <ListGroup.Item className="fa fa-star checked" action key={d.id} href={"/collaborations/" + d.id}>
            {d.id}
          </ListGroup.Item>
        ))}
        {allConversations.length == 0 && <ListGroup.Item disabled className="text-center"><i>- Empty -</i></ListGroup.Item>}
      </ListGroup>
      </div>
    );
  }
}

export default Collaborations;
