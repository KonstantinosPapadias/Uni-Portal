import { useEffect, useRef, useReducer } from 'react';
import DOMPurify from "dompurify";
import "./MsTeamsCurrentChatMessages.css";
import openFileIcon from "./open_file.png";

function MsTeamsCurrentChatMessages({userDisplayName, selectedChat, currentChatForceUpdateButtonRef}) {
  const lastMessagePointerElementRef = useRef(null);
  const [ignored, forceUpdate] = useReducer(x => x + 1, 0);

  useEffect(() => {
    function scrollToLastMessage() {
      lastMessagePointerElementRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest', 
        inline: 'nearest' 
      });
    }

    scrollToLastMessage();
  }, [selectedChat]);

  function getSelectedChatMembers() {
    if (!selectedChat)
      return;
    let membersString = selectedChat.members[0].name;
    for (let i = 1; i < selectedChat.members.length; i++)
      membersString += ", " + selectedChat.members[i].name;
    return membersString;
  }

  function getSelectedChatMessagesFromOldToNew() {
    // selectedChat.messages array must be cloned into a new array because  
    // reverse() function mutates the original selectedChat.messages array
    // and that leads to unexpected results
    return getSelectedChatMessagesClone().reverse();
  }

  function getSelectedChatMessagesClone() {
    // we need a deep copy because of object elements
    // in the selectedChat.messages array
    return JSON.parse(JSON.stringify(selectedChat.messages));
  }
  
  function getCleanHtml(message) {
    return DOMPurify.sanitize(message);
  }

  function getMessageTimeAndDate(message) {
    return getMessageDate(message) + "  " + getMessageTime(message);
  }

  function getMessageDate(message) {
    const date = new Date(message.createdDateTime);
    // Date.getMonth() returns an int 0 - 11 -> 0 is January, 2 is February...
    return date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();
  }

  function getMessageTime(message) {
    const date = new Date(message.createdDateTime);
    return date.getHours() + ":" + date.getMinutes();
  }

  return (
    <div className='msteams-current-chat-messages-container-container'>
      <div className='msteams-current-chat-messages-members'>
        {getSelectedChatMembers()}
      </div>
      <div className='msteams-current-chat-messages-container'>
        {selectedChat === ""
          ?
            ""
          :
            getSelectedChatMessagesFromOldToNew().map(message => {
              if (message.from === null)
                return <div key={message.id} />;
              return (
                <div
                  key={message.id}
                  className={
                    message.from.user.displayName !== userDisplayName
                      ? 'msteams-current-chat-message-container-container-left'
                      : 'msteams-current-chat-message-container-container-right'
                  }
                >
                  <div 
                    className={
                      message.from.user.displayName !== userDisplayName
                        ? 'msteams-current-chat-message-container-left'
                        : 'msteams-current-chat-message-container-right'
                      }
                  >
                    <div className='msteams-current-chat-message-content-container'>
                      <div className='msteams-current-chat-message-header'>
                        <div className='msteams-current-chat-message-sender'>
                          {message.from.user.displayName}
                        </div>
                        <div className='msteams-current-chat-message-date'>
                          {getMessageTimeAndDate(message)}
                        </div>
                      </div>
                      <div
                        className='msteams-current-chat-message-content'
                        dangerouslySetInnerHTML={{
                          __html: getCleanHtml(message.body.content)
                        }} 
                      />
                      <div className='msteams-current-chat-message-attachments-container'>
                        {message.attachments.map(attachment => 
                          <a
                            className='msteams-current-chat-message-attachment-container'
                            href={attachment.contentUrl}
                            target="_blank"
                            rel='noreferrer'
                            key={attachment.id}
                          >
                            <img 
                              src={openFileIcon} 
                              alt="Google open file icon" 
                            />
                            <div className='msteams-current-chat-message-attachment'>
                              {attachment.name}
                            </div> 
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
        }
        <div ref={lastMessagePointerElementRef} />
      </div>
      <div 
        ref={currentChatForceUpdateButtonRef}
        onClick={forceUpdate}
      />
    </div>
  )
}

export default MsTeamsCurrentChatMessages