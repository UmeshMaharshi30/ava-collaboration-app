const supertest = require("supertest");
const axios = require("axios");

const baseURL = "http://localhost:4000";

function getRequest(apiRoute) {
  return axios
    .get(baseURL + apiRoute)
    .then((res) => {
      return res.data;
    })
    .catch((err) => "error");
}

function postRequest(apiRoute, postData) {
  return axios
    .post(baseURL + apiRoute, postData)
    .then((res) => res.data)
    .catch(function (error) {
      console.log(error);
    });
}

test("Testing ping API", async () => {
  expect.assertions(1);
  const data = await getRequest("/ping");
  expect(data.msg).toEqual("pong");
});

test("Testing info API", async () => {
  expect.assertions(1);
  const data = await getRequest("/info");
  expect(data.ok).toBeTruthy();
});
/*
describe("conversation flow testing", () => {
  test("Conversations should be empty in the begining", async () => {
    expect.assertions(1);
    const data = await getRequest("/conversations");
    expect(data.conversations).toEqual([]);
  });

  let mutation = {
    author: "alice",
    conversationId: "helloworld",
    data: {
      index: 0,
      text: "abcd",
      type: "insert",
    },
    origin: {
      alice: 0,
      bob: 0,
    },
  };

  test("Posting conersation", async () => {
    expect.assertions(1);
    const responseData = await postRequest("/mutations", mutation);
    expect(responseData.text).toEqual("abcd");
  });
  
  test("Check if conversation is inserted or not", async () => {
    expect.assertions(1);
    const data = await getRequest("/conversations");
    expect(data.conversations[0].lastMutation).toEqual(mutation);
  });

  /*
  test("delete the conversation", async() => {
      expect.assertions(1);
      const response = await axios
      .delete(baseURL + "/conversations/" + mutation.conversationId)
      .then((res) => {
          nextPhase();
        return res;
      })
      .catch((err) => "error");
      expect(response.status).toBe(200);
  });
});
*/

describe("Verifying concurrent operations", () => {
    test("Conversations should be empty in the begining", async () => {
      expect.assertions(1);
      const data = await getRequest("/conversations");
      expect(data.conversations).toEqual([]);
    });
  
    let mutation = {
      author: "alice",
      conversationId: "helloworld",
      data: {
        index: 0,
        text: "0123456789",
        type: "insert",
      },
      origin: {
        alice: 0,
        bob: 0,
      },
    };
  
    test("Posting conersation", async () => {
      expect.assertions(1);
      const responseData = await postRequest("/mutations", mutation);
      expect(responseData.text).toEqual("0123456789");
    });

    // concurrent deletion
    let deleteMutationBob = {
        author: "bob",
        conversationId: "helloworld",
        data: {
          index: 0,
          length : 1,
          type: "delete",
        },
        origin: {
          alice: 1,
          bob: 0,
        },
      };
    test("Testing delete mutation", async () => {
        expect.assertions(1);
        const responseData = await postRequest("/mutations", deleteMutationBob);
        expect(responseData.text).toEqual("123456789");
    });

    let deleteMutation = {
        author: "alice",
        conversationId: "helloworld",
        data: {
          index: 0,
          length : 3,
          type: "delete",
        },
        origin: {
          alice: 1,
          bob: 0,
        },
      };
    test("Testing deletion", async () => {
        expect.assertions(1);
        const responseData = await postRequest("/mutations", deleteMutation);
        expect(responseData.text).toEqual("3456789");
    });
    
    test("Check if conversation is inserted or not", async () => {
      expect.assertions(1);
      const data = await getRequest("/conversations");
      expect(data.conversations[0].lastMutation).toEqual(deleteMutation);
    });
    /*
    test("delete the conversation", async() => {
        expect.assertions(1);
        const data = await axios
        .delete(baseURL + "/conversations/" + mutation.conversationId)
        .then((res) => {
          return res.data;
        })
        .catch((err) => "error");
        expect(data.msg).toBeTruthy();
    });
    */
  });
