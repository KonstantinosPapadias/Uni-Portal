import { useState, useEffect, useRef } from 'react';
import axios from "axios";
import MsTeamsChat from '../MsTeamsChat/MsTeamsChat';
import MsTeamsCurrentChatMessages 
from "../MsTeamsCurrentChatMessages/MsTeamsCurrentChatMessages";
import "./MsTeamsInbox.css";
import attachmentIcon from "./attachment.svg";
import openFileIcon from "./open_file.png"; 
import { toast } from 'react-toastify';

function MsTeamsInbox({userDisplayName, chats}) {
  const [currentChats, setCurrentChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState("");
  const [editorIsFocused, setEditorIsFocused] = useState(false);
  const [currentChatReplyAttachments, setCurrentChatReplyAttachments] = useState([]);
  const createNewChatInputRef = useRef(null);
  const inputRef = useRef(null);
  // force update button for MsTeamsCurrentChatMessages component when adding a new chat
  // messag in current chat, because it was not scrolling to the new message before
  const currentChatForceUpdateButtonRef = useRef(null);

  useEffect(() => {
    function selectFirstChatAndSetCurrentChats() {
      if (!chats.length)
        return;
      setSelectedChat(chats[0]);
      setCurrentChats(chats);
    }

    selectFirstChatAndSetCurrentChats();
  }, [chats]);

  useEffect(() => {
    function clearAttachments() {
      setCurrentChatReplyAttachments([]);
    }

    clearAttachments();
  }, [selectedChat]);
  
  async function createNewChat() {
    try {
      const response = await axios({
        method: "post",
        url: `http://localhost:3001/api/msTeams/chats`,
        withCredentials: true,
        headers: {
            "Content-type": "application/json"
        },
        data: JSON.stringify({
            newChatUserEmailAddress: createNewChatInputRef.current?.value
        })
      });
      console.log(response.data);
      setCurrentChats(oldChats => [response.data.newChat, ...oldChats]);
      setSelectedChat(response.data.newChat);
      createNewChatInputRef.current.value = "";
      // easier to unfocus input with vanilla js than with ref
      document.getElementsByClassName("msteams-inbox-create-new-chat-input")[0].blur();
    } catch (error) {
      toast.error(
        `Could not create new chat. 
        Check if user email address is incorrent.`,
        {
          theme: "dark",
          autoClose: false
        }
      );
    }
  }

  async function sendMessageToCurrentChat() {
    try {
      const input = document.getElementsByClassName("msteams-inbox-current-chat-editor")[0];
      const response = await axios({
        method: "post",
        url: `http://localhost:3001/api/msTeams/chats/${selectedChat.id}`,
        withCredentials: true,
        headers: {
            "Content-type": "application/json"
        },
        data: JSON.stringify({ 
          message: {
            body: {
              contentType: "html",
              content: getCurrentChatReplyContentString(input)
            },
            attachments: currentChatReplyAttachments.map(attachment => ({
              id: attachment.id,
              contentType: "reference",
              contentUrl: attachment.contentUrl,
              name: attachment.name
            }))
          }
        })
      });
      setCurrentChatReplyAttachments([]);
      setSelectedChat(oldSelectedChat => {
        let newSelectedChat = JSON.parse(JSON.stringify(oldSelectedChat));
        newSelectedChat.messages = [response.data.message, ...oldSelectedChat.messages];
        return newSelectedChat;
      });
      // clicking force update button for MsTeamsCurrentChatMessages component
      // so it updates and scrolls into new message
      currentChatForceUpdateButtonRef.current?.click();
      inputRef.current.value = "";
    } catch (err) {
      toast.error("Could not send chat message. Try again.");
    }
  }

  function getCurrentChatReplyContentString(input) {
    let attachmentsString = "";
    for (let attachment of currentChatReplyAttachments)
      attachmentsString += ` <attachment id="${attachment.id}"></attachment>`;
    return input.value + attachmentsString;
  }

  function addAttachment() {
    const fileInput = document.createElement('input');
    fileInput.type = "file";
    fileInput.onchange = () => {
      const fileReader = new FileReader();
      fileReader.onload = async () => {
        const file = {
          fileName: getInputFileName(fileInput),
          base64FileData: getBase64FileData(fileReader.result),
          emailToGivePermissions: selectedChat.members[0].name
        };
        const uploadedFile = await toast.promise(
          uploadFileToOneDrive(file),
          {
              pending: `Uploading ${file.fileName} to OneDrive...`,
              success: `Done.`,
              error: `${file.fileName} could not be uploaded to OneDrive.`
          },
          {
            theme: "dark"
          }
        );
        const newAttachment = {
          id: getIdFromETag(uploadedFile.eTag),
          contentUrl: uploadedFile.webUrl,
          name: uploadedFile.name
        };
        setCurrentChatReplyAttachments(oldAttachments => [...oldAttachments, newAttachment]);
      }
      fileReader.readAsDataURL(fileInput.files[0]);
    }
    fileInput.click();
  }

  function getInputFileName(fileInput) {
    const pathArray = fileInput.value.split("\\");
    return pathArray[pathArray.length - 1];
  }

  function getBase64FileData(dataUrl) {
    return dataUrl.split(",")[1];
  }

  async function uploadFileToOneDrive(file) {
    try {
      const response = await axios({
        method: "post",
        url: "http://localhost:3001/api/msTeams/drive",
        withCredentials: true,
        headers: {
            "Content-type": "application/json"
        },
        data: JSON.stringify({
          file: file
        })
      })
      return response.data.uploadedFile;
    } catch (err) {
      throw new Error(err.message);
    }
  }

  function getIdFromETag(eTag) {
    return eTag.split("{")[1].split("}")[0];
  }

  return (
    <div className='msteams-inbox-container'>
      <div 
        className='msteams-inbox-create-new-chat-input-container'
        onClick={() => createNewChatInputRef.current?.focus()}
        onKeyDown={(e) => {
          if (e.key === "Enter")
            createNewChat()
        }}
      >
        <input
          className='msteams-inbox-create-new-chat-input'
          type="text" 
          placeholder='Create a new chat'
          ref={createNewChatInputRef}
          onFocus={() => createNewChatInputRef.current.placeholder = "Type a user's email address"}
          onBlur={() => createNewChatInputRef.current.placeholder = "Create a new chat"}
        />
      </div>
      <div className='msteams-inbox-chat-selectors-current-chat-messages-and-editor-container'>
        <div className='msteams-inbox-chat-selectors-container'>
          <div className='msteams-inbox-chat-selectors'>
            {currentChats.map(chat => <MsTeamsChat key={chat.id} 
                                              chat={chat}
                                              selectedChat={selectedChat}
                                              setSelectedChat={setSelectedChat}
                                />)}
          </div>
        </div>
        <div className='msteams-inbox-current-chat-messages-and-editor-container'>
          <MsTeamsCurrentChatMessages
            userDisplayName={userDisplayName}
            selectedChat={selectedChat}
            currentChatForceUpdateButtonRef={currentChatForceUpdateButtonRef}
          />
          <div className='msteams-inbox-current-chat-editor-and-attachment-button'>
            <div 
              className={
                editorIsFocused
                  ? 'msteams-inbox-current-chat-editor-container-focused'
                  : 'msteams-inbox-current-chat-editor-container-unfocused'
              }
              onClick={() => inputRef.current?.focus()}
            >
              <input
                className='msteams-inbox-current-chat-editor'
                ref={inputRef}
                placeholder='Type a new message'
                onFocus={() => setEditorIsFocused(true)}
                onBlur={() => setEditorIsFocused(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter")
                    sendMessageToCurrentChat()
                }}
              />
              {currentChatReplyAttachments.length
                ?
                  <div className='msteams-inbox-current-chat-editor-attachments-container'>
                    {currentChatReplyAttachments.map(attachment =>
                      <div className='msteams-inbox-current-chat-editor-attachment-container'>
                        <img
                          src={openFileIcon} 
                          alt="Google open file icon." 
                        />
                        <div className='msteams-inbox-current-chat-editor-filename'>
                          {attachment.name}
                        </div>
                      </div>
                      )
                    }
                  </div>
                :
                  <div />
              }
            </div>
            <div 
              className='msteams-inbox-current-chat-attachment-button'
              onClick={addAttachment}
            >
              <img
                className='msteams-inbox-current-chat-attachment-button-icon'
                src={attachmentIcon} 
                alt="Google attachment icon." 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MsTeamsInbox