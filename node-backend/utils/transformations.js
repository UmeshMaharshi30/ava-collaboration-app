function twoInserts(conversation, orgMutation) {
  const mutation = { ...orgMutation };
  const lastMutation = conversation.lastMutation;
  if (lastMutation.data.index == mutation.data.index) return;
  else if (lastMutation.data.index < mutation.data.index) {
    let sliceIndex = mutation.data.index + lastMutation.data.text.length;
    let text = conversation.text;
    let prefix = text.slice(0, sliceIndex),
      suffix = text.slice(sliceIndex);
    text = prefix + mutation.data.text + suffix;
    let origin = { alice: mutation.origin.alice, bob: mutation.origin.bob };
    if (mutation.author == "alice") origin.alice = origin.alice + 1;
    else origin.bob = origin.bob + 1;
    const updatedConversation = {
      id,
      text,
      lastMutation: mutation,
      lastState: conversation,
    };
    allConversations[id] = updatedConversation;
  } else {
    let text = conversation.text;
    let sliceIndex = mutation.data.index;
    let prefix = text.slice(0, sliceIndex),
      suffix = text.slice(sliceIndex);
    text = prefix + mutation.data.text + suffix;
    let origin = { alice: mutation.origin.alice, bob: mutation.origin.bob };
    if (mutation.author == "alice") origin.alice = origin.alice + 1;
    else origin.bob = origin.bob + 1;
    const updatedConversation = {
      id,
      text,
      lastMutation: mutation,
      lastState: conversation,
    };
    allConversations[id] = updatedConversation;
  }
}

function twoDeletes(conversation, mutation) {
  if (lastMutation.data.index == mutation.data.index) return;
  let currDel = [
    mutation.data.index,
    mutation.data.index + mutation.data.length,
  ];
  let prevDel = [
    conversation.lastMutation.data.index,
    conversation.lastMutation.data.index +
      conversation.lastMutation.data.length,
  ];
  // shadowed
  if (prevDel[0] <= currDel[0] && prevDel[1] >= currDel[1]) {
    return;
  } else if (currDel[0] <= prevDel[0] && currDel[1] >= prevDel[1]) {
    // remove currDel[1] - prevDel length
    // overlaps
  } else if (currDel[0] <= prevDel[0] && currDel[1] <= prevDel[1]) {
    // remove currDel[0] - prevDel[0] left side
  } else if (currDel[0] >= prevDel[0] && currDel[1] >= prevDel[1]) {
    // del right side
  } else if (currDel[0] >= prevDel[1]) {
    // shift and delete
  } else {
    // just delete
  }
}

function insertDelete(conversation, mutation) {
  let lastMutation = conversation.lastMutation;
  let lastIndex = lastMutation.data.index;
  let deleteIndex = mutation.data.length;
  let deleteWindow = [deleteIndex, deleteIndex + mutation.data.length];
  if (lastIndex >= deleteWindow[1]) {
    // normal delete
  } else {
    // shift by length and perform delete
  }
}

function deleteInsert(conversation, mutation) {
  let lastMutation = conversation.lastMutation;
  let insertIndex = lastMutation.data.index;
  let deleteWindow = [mutation.data.index, mutation.data.index + mutation.data.length];
  if(insertIndex >= deleteWindow[0] && insertIndex <= deleteWindow[1]) return; // conflict;
  else if(deleteWindow[1] <= insertIndex) {
    // left shift and insert
  } else {
    // normal insert
  }
}

module.exports = {
  twoDeletes,
  twoInserts,
  insertDelete,
  deleteInsert,
};
