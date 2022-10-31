import React from 'react';
import "./UnfocusedMsTeamsChat.css";

function UnfocusedMsTeamsChat({chat, setSelectedChat}) {

  function focusChat() {
    setSelectedChat(chat);
  }

  function getChatMembers() {
    let membersString = chat.members[0].name;
    for (let i = 1; i < chat.members.length; i++)
      membersString += ", " + chat.members[i].name;
    return membersString;
  }

  function getLastMessageDate() {
    if (!chat.messages.length)
      return "";
    const date = new Date(chat.messages[0].createdDateTime);
    // Date.getMonth() returns an int 0 - 11 -> 0 is January, 2 is February...
    return date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();
  }

  return (
    <div className='unfocused-teams-chat-container-container'>
      <div 
        className='unfocused-teams-chat-container'
        onClick={focusChat}
      >
        <div className='unfocused-teams-chat-members'>{getChatMembers()}</div>
        <div className='unfocused-teams-chat-last-modified-date'>{getLastMessageDate()}</div>
      </div>
    </div>
  )
}

export default UnfocusedMsTeamsChat