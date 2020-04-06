const allConversations = {};

function twoInserts(conversation, mutation) {
  const lastMutation = conversation.lastMutation;
  let conversationId = mutation.conversationId;
  let text = conversation.text;
  if (lastMutation.data.index == mutation.data.index)
    throw new Error("Conflict");
  else if (lastMutation.data.index < mutation.data.index) {
    // need to shift the index to the right
    let sliceIndex = mutation.data.index + lastMutation.data.text.length;
    let prefix = text.slice(0, sliceIndex),
      suffix = text.slice(sliceIndex);
    text = prefix + mutation.data.text + suffix;
  } else {
    // normal insert
    let text = conversation.text;
    let sliceIndex = mutation.data.index;
    let prefix = text.slice(0, sliceIndex),
      suffix = text.slice(sliceIndex);
    text = prefix + mutation.data.text + suffix;
  }
  let origin = {
    alice: mutation.origin.alice + 1,
    bob: mutation.origin.bob + 1,
  };
  const updatedConversation = {
    conversationId,
    text,
    lastMutation: mutation,
    origin,
  };
  allConversations[conversationId] = updatedConversation;
}
/*
function oldTwoDeletes(conversation, mutation) {
  const lastMutation = conversation.lastMutation;
  let currDel = [
    mutation.data.index,
    mutation.data.index + mutation.data.length,
  ];
  let prevDel = [
    conversation.lastMutation.data.index,
    conversation.lastMutation.data.index +
      conversation.lastMutation.data.length,
  ];
  let conversationId = mutation.conversationId;
  let text = conversation.text;
  let transformedMutation = { ...mutation };
  let origin = {
    alice: mutation.origin.alice + 1,
    bob: mutation.origin.bob + 1,
  };
  if (transformedMutation.origin.alice == conversation.origin.alice)
    transformedMutation.origin.bob = transformedMutation.origin.bob + 1;
  // shadowed
  if (prevDel[0] <= currDel[0] && prevDel[1] >= currDel[1]) {
    const updatedConversation = {
      conversationId,
      text,
      lastMutation: mutation,
      origin,
    };
    allConversations[conversationId] = updatedConversation;
  } else if (currDel[0] <= prevDel[0] && currDel[1] >= prevDel[1]) {
    // part of it already deleteted
    transformedMutation.data.length =
      transformedMutation.data.length - lastMutation.data.length;
    if (transformedMutation.origin.alice == conversation.origin.alice)
      transformedMutation.origin.bob = transformedMutation.origin.bob + 1;
    applyDeletion(conversation, transformedMutation);
    // overlaps
  } else if (currDel[0] <= prevDel[0] && currDel[1] <= prevDel[1]) {
    // remove currDel[0] - prevDel[0] left side
    transformedMutation.data.length = prevDel[0] - currDel[0];
    applyDeletion(conversation, transformedMutation);
  } else if (currDel[0] >= prevDel[0] && currDel[1] >= prevDel[1]) {
    // del right side
    transformedMutation.data.index = prevDel[1] - lastMutation.data.length;
    transformedMutation.data.length = prevDel[1] - currDel[1];
    applyDeletion(conversation, transformedMutation);
  } else if (currDel[0] >= prevDel[1]) {
    // shift and delete
    transformedMutation.data.index = prevDel[1] - lastMutation.data.length;
    applyDeletion(conversation, transformedMutation);
  } else {
    // just delete
    applyDeletion(conversation, transformedMutation);
  }
}
*/

function twoDeletes(conversation, mutation) {
  const lastMutation = conversation.lastMutation;
  let currDel = [
    mutation.data.index,
    mutation.data.index + mutation.data.length,
  ];
  let prevDel = [
    conversation.lastMutation.data.index,
    conversation.lastMutation.data.index +
      conversation.lastMutation.data.length,
  ];
  let conversationId = mutation.conversationId;
  let text = conversation.text;
  let origin = {
    alice: mutation.origin.alice + 1,
    bob: mutation.origin.bob + 1,
  };
  // shadowed
  if (prevDel[0] <= currDel[0] && prevDel[1] >= currDel[1]) {
    const updatedConversation = {
      conversationId,
      text,
      lastMutation: mutation,
      origin,
    };
    allConversations[conversationId] = updatedConversation;
  } else if (prevDel[0] >= currDel[0] && prevDel[1] <= currDel[1]) {
    // shrink the window
    let transformedIndex = mutation.data.index;
    mutation.data.modifiedIndex = transformedIndex;
    mutation.data.modifiedLength = mutation.data.length - lastMutation.data.length; // already deleted a part of it
    applyDeletion(conversation, mutation);
  } else if(prevDel[1] <= currDel[0]) {
    let transformedIndex = mutation.data.index - lastMutation.data.length; // deleted something infront of it, so slide it to left
    mutation.data.modifiedIndex = transformedIndex;
    mutation.data.modifiedLength = mutation.data.length; 
  } else if(currDel[1] <= prevDel[0]) {
    // normal delete
    applyDeletion(conversation, mutation); 
  } else if(prevDel[0] <= currDel[0] && prevDel[1] <= currDel[1]) {
      // delete remaining on the right side
      let transformedIndex = lastMutation.data.index;
    mutation.data.modifiedIndex = transformedIndex;
    mutation.data.modifiedLength = currDel[1] - prevDel[1]; 
    applyDeletion(conversation, mutation);
  } else {
    let transformedIndex = mutation.data.index;
    mutation.data.modifiedIndex = transformedIndex;
    mutation.data.modifiedLength = prevDel[0] - currDel[0]; 
    applyDeletion(conversation, mutation);
  }
}

function insertDelete(conversation, mutation) {
  let lastMutation = conversation.lastMutation;
  let lastIndex = lastMutation.data.index;
  let deleteIndex = mutation.data.length;
  let deleteWindow = [deleteIndex, deleteIndex + mutation.data.length];
  if (lastIndex >= deleteWindow[0] && lastIndex <= deleteWindow[1])
    throw new Error("Conflict");
  if (lastIndex >= deleteWindow[1]) {
    // normal delete
    applyDeletion(conversation, mutation);
  } else {
    // shift right by length and perform delete
    let transformedIndex = mutation.data.index + lastMutation.data.text.length;
    mutation.data.modifiedIndex = transformedIndex;
    mutation.data.modifiedLength = mutation.data.length;
    applyDeletion(conversation, mutation);
  }
}

function deleteInsert(conversation, mutation) {
  let lastMutation = conversation.lastMutation;
  let insertIndex = lastMutation.data.index;
  let deleteWindow = [
    mutation.data.index,
    mutation.data.index + mutation.data.length,
  ];
  if (insertIndex >= deleteWindow[0] && insertIndex <= deleteWindow[1])
    throw new Error("Conflict");
  // both insertion and deletion at the same time
  else if (deleteWindow[1] <= insertIndex) {
    // deleted something before the insertion index, so shift to the left
    let transformedIndex = mutation.data.index - lastMutation.data.text.length;
    mutation.data.modifiedIndex = transformedIndex;
    applyInsertion(conversation, mutation);
  } else {
    // normal insert
    applyInsertion(conversation, transformedMutation);
  }
}

function initializeConversation(id, origin) {
    if(!id || !origin) throw new Error("Invalid Mutation !");
  const conversation = { conversationId: id };
  conversation.text = "";
  conversation.origin = {
    alice: origin.alice,
    bob: origin.bob,
  };
  conversation.lastMutation = null;
  allConversations[id] = conversation;
}

function handleMutation(mutation) {
  const conversation = allConversations[mutation.conversationId];
  const lastMutation = conversation.lastMutation;
  if (mutation.data.type === "insert" && lastMutation.data.type === "insert")
    twoInserts(conversation, mutation);
  else if (mutation.data.type === "insert")
    deleteInsert(conversation, mutation);
  else if (
    mutation.data.type === "delete" &&
    lastMutation.data.type === "delete"
  )
    twoDeletes(conversation, mutation);
  else insertDelete(conversation, mutation);
}

function applyInsertion(conversation, mutation) {
  let conversationId = conversation.conversationId;
  let text = conversation.text;
  let sliceIndex = mutation.data.index;
  if(mutation.data.modifiedIndex != undefined)  sliceIndex = mutation.data.modifiedIndex;
  let prefix = text.slice(0, sliceIndex),
    suffix = text.slice(sliceIndex);
  text = prefix + mutation.data.text + suffix;
  let origin = { alice: mutation.origin.alice, bob: mutation.origin.bob };
  if (mutation.author == "alice") origin.alice = origin.alice + 1;
  else origin.bob = origin.bob + 1;
  const updatedConversation = {
    conversationId,
    text,
    lastMutation: mutation,
    origin,
  };
  allConversations[conversationId] = updatedConversation;
}

function applyDeletion(conversation, mutation) {
  let conversationId = conversation.conversationId;
  let text = conversation.text;
  let sliceIndex = mutation.data.index;
  if(mutation.data.modifiedIndex != undefined)  sliceIndex = mutation.data.modifiedIndex;
  let deletionLength = mutation.data.length;
  if(mutation.data.modifiedLength  != undefined) deleteLength = mutation.data.modifiedLength;
  let prefix = text.slice(0, sliceIndex),
    suffix = text.slice(sliceIndex + deletionLength);
  text = prefix + suffix;
  let origin = { alice: mutation.origin.alice, bob: mutation.origin.bob };
  if (mutation.author == "alice") origin.alice = origin.alice + 1;
  else origin.bob = origin.bob + 1;
  const updatedConversation = {
    conversationId,
    text,
    lastMutation: mutation,
    origin,
  };
  allConversations[conversationId] = updatedConversation;
}

function getAllConversations() {
  let onGoing = Object.keys(allConversations);
  let conversations = onGoing.map((key) => {
    return {
      id: key,
      lastMutation: allConversations[key].lastMutation,
      text: allConversations[key].text,
    };
  });
  return { conversations };
}

function findConversation(conversationId) {
  if (!allConversations[conversationId]) return null;
  else return allConversations[conversationId];
}

function deleteConversation(conversationId) {
  if (!allConversations[conversationId]) {
    return false;
  } else delete allConversations[conversationId];
  return true;
}

function applyMutation(conversationId, mutation) {
  if (mutation.data.type === "insert")
    applyInsertion(allConversations[conversationId], mutation);
  else applyDeletion(allConversations[conversationId], mutation);
}

function stateValidation(conversationId, mutation) {
  let conversation = allConversations[conversationId];
  let currentOrigin = conversation.origin;
  let mutationOrigin = mutation.origin;
  if (
    currentOrigin.alice == mutationOrigin.alice &&
    currentOrigin.bob == mutationOrigin.bob
  )
    return 0;
  else if (currentOrigin.alice == mutationOrigin.alice) {
    if (currentOrigin.bob - mutationOrigin.bob == 1) return 1;
  } else if (currentOrigin.bob == mutationOrigin.bob) {
    if (currentOrigin.alice - mutationOrigin.alice == 1) return 1;
  }
  return -1;
}

module.exports = {
  allConversations,
  getAllConversations,
  deleteConversation,
  findConversation,
  initializeConversation,
  stateValidation,
  applyMutation,
  handleMutation,
};
