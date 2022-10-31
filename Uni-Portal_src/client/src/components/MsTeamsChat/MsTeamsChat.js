import { useState, useEffect } from 'react';
import UnfocusedMsTeamsChat from "../UnfocusedMsTeamsChat/UnfocusedMsTeamsChat";
import FocusedMsTeamsChat from "../FocusedMsTeamsChat/FocusedMsTeamsChat";

function MsTeamsChat({chat, selectedChat, setSelectedChat}) {
  const [chatState, setChatState] = useState(chat);  

  useEffect(() => {
    function updateSelectedChatMessages() {
      if (chatState.id !== selectedChat.id)
        return;
      setChatState(oldChatState => {
        let newChatState = JSON.parse(JSON.stringify(oldChatState));
        newChatState.messages = selectedChat.messages;
        return newChatState;
      })
    }

    updateSelectedChatMessages();
  }, [selectedChat, chatState.id]);
  

  return (
    chatState.id === selectedChat.id
      ?
        <FocusedMsTeamsChat 
          chat={chatState}
        />
      :
        <UnfocusedMsTeamsChat 
          chat={chatState}
          setSelectedChat={setSelectedChat}
        />
  )
}

export default MsTeamsChat