import { useState, useEffect, useRef } from 'react';
import axios from "axios";
import planer from "planer";
import DOMPurify from "dompurify";
import "./FocusedThread.css";
import minimizeIcon from "./minimize.png";
import removeAttachmentIcon from "./remove_attachment.png";
import attachmentIcon from "./attachment.svg";
import deleteIcon from "./delete.png";
import showHtml from "./show_html.svg";
import showText from "./show_text.svg";
import showReplyHistory from "./show_reply_history.svg";
import { toast } from "react-toastify";

function FocusedThread({thread, setMode}) {
  // replying modes -> 'not-replying', 'replying'
  const [replyingMode, setReplyingMode] = useState("not-replying");
  const [attachments, setAttachments] = useState([]);
  const editorInputRef = useRef(null);
  const threadLastMessagePointerRef = useRef(null);

  useEffect(() => {
    function scrollToLastMessage() {
      threadLastMessagePointerRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest', 
        inline: 'nearest' 
      });
    }

    scrollToLastMessage();
  }, []);
  
  function getLastMessage() {
    return thread.messages[thread.messages.length - 1];
  }

  function getSubject(message) {
    return message.headers["subject"];
  }

  function getFromField(message) {
    return message.headers["from"];
  }

  function getDate(message) {
    //let date = message.headers["date"].split("+")[0].split("-")[0].split("GMT")[0].trim();
    //return date.substring(0, date.length - 3);
    const date = new Date(message.headers['date']);
    return date.toLocaleString();
  }

  function changeMessageDisplay(messageId, displayType) {
    const message = thread.messages.find(message => message.id === messageId);
    const messageContentDiv = document.querySelector(`#i${messageId}`);
    const messageHtml = removeInlineStyleFromMessageHtml(DOMPurify.sanitize(message.textHtml));
    if (displayType === "text")
      messageContentDiv.innerHTML = DOMPurify.sanitize(message.textPlain);
    else if (displayType === "html")
      messageContentDiv.innerHTML = planer.extractFromHtml(messageHtml, window.document);
    else if (displayType === "replyHistory")
      messageContentDiv.innerHTML = messageHtml;
    else if (displayType === "minimize")
      messageContentDiv.innerHTML = "";
  }

  function getCleanHtml(message) {
    if (!message.textHtml)
      return DOMPurify.sanitize(message.textPlain);
    const messageHtml = removeInlineStyleFromMessageHtml(DOMPurify.sanitize(message.textHtml));
    if (thread.messages.length === 1)
      return messageHtml;
    return planer.extractFromHtml(messageHtml, window.document);
  }

  function removeInlineStyleFromMessageHtml(messageHtml) {
    let messageHtmlWithoutInlineStyling = messageHtml;
    while (messageHtmlWithoutInlineStyling.includes("<style>")) {
      const styleSubString = "<style>" + messageHtmlWithoutInlineStyling.split("<style>")[1].split("</style>")[0] + "</style>";
      messageHtmlWithoutInlineStyling = messageHtml.replace(styleSubString, "");
    }
    return messageHtmlWithoutInlineStyling;
  }

  function getNumberOfAttachmentsString(message) {
    if (message.attachments.length === 1)
      return "1 Attachment";
    return message.attachments.length + " Attachments";
  }

  async function downloadAttachment(attachment) {
    try {
      const {messageId, attachmentId} = attachment;
      const response = await toast.promise(
          axios({
              method: "get",
              url: `http://localhost:3001/api/${thread.account}/messages/${messageId}/attachments/${attachmentId}`,
              withCredentials: true
          }),
          {
              pending: `Downloading attachment...`
          },
          {
              theme: "dark",
          }
      )
      attachment.body = response.data;
      const downloadLink = document.createElement("a");
      downloadLink.href = getAttachmentDataUrl(attachment);
      downloadLink.download = attachment.filename;
      downloadLink.click();
  } catch (err) {
      toast.error(
          `Could not download attachment, try again later`, 
          {
              theme: "light",
              autoClose: false
          }
      );
  }
  }

  function getAttachmentDataUrl(attachment) {
    return (
      "data:application/octet-stream;base64," + 
      getBase64FromBase64URL(attachment.body.data)
    );
  }

  function getBase64FromBase64URL(data) {
    // base64url to base64 : '-' -> '+', '_' -> '/'
    return data.replaceAll("-", "+").replaceAll("_", "/");
  }

  async function reply() {
    const request = {
      method: "post",
      url: `http://localhost:3001/api/${getLastMessage().gmailAccount}/messages`,
      withCredentials: true,
      headers: {
          "Content-Type": "application/json"
      },
      data: JSON.stringify({
          email: {
              from: `"${thread.accountDisplayName}" <${thread.account}>`,
              to: extractSenderEmail(getLastMessage()),
              threadId: getLastMessage().threadId,
              inReplyTo: getLastMessage().headers["message-id"],
              references: getLastMessage().headers["message-id"],
              subject: getLastMessage().headers.subject,
              html: getEditorInput(),
              attachments: attachments
          }
      })
    };
    toast.promise(
      axios(request),
      {
          pending: `Sending email reply...`,
          success: `Done.`,
          error: `Could not be send email reply.`
      },
      {
        theme: "dark",
        autoClose: 2000
      }
    );
    setReplyingMode("not-replying");
    setAttachments([]);
  }
  
  function extractSenderEmail(lastMessage) {
    return getReplyToField(lastMessage).split("<").pop().split(">")[0];
  }

  function getReplyToField(lastMessage) {
      if (lastMessage.headers["reply-to"])
          return lastMessage.headers["reply-to"];
      return lastMessage.headers.from;
  }

  function getEditorInput() {
    return editorInputRef.current?.value;
  }

  function addAttachment() {
    const fileInput = document.createElement('input');
    fileInput.type = "file";
    fileInput.onchange = () => {
      const fileReader = new FileReader();
      fileReader.onload = () => setAttachments(oldAttachments => {
        const newAttachment = {
          filename: getInputFileName(fileInput),
          href: fileReader.result
        };
        return [...oldAttachments, newAttachment];
      })
      fileReader.readAsDataURL(fileInput.files[0]);
    }
    fileInput.click();
  }

  function getInputFileName(fileInput) {
    const pathArray = fileInput.value.split("\\");
    return pathArray[pathArray.length - 1];
  }

  return (
    <div className='focused-thread-container'>
      <div className='focused-thread-contents-container'>
        <div className='focused-thread-minimize-icon-container'>
          <img 
            className='focused-thread-minimize-icon' 
            src={minimizeIcon} 
            alt="Google minimize icon" 
            onClick={() => setMode("unfocused")}
          />
        </div>
        <div className='focused-thread-subject-container'>{getSubject(thread.messages[0])}</div>
        {thread.messages.map(message => 
          <div className='focused-thread-message-container' key={message.id}>
            <div className='focused-thread-message-from-and-date-container'>
              <div className='focused-thread-message-from-container'>{getFromField(message)}</div>
              <div className='focused-thread-message-date-container'>{getDate(message)}</div>
            </div>
            <div className='focused-thread-message-change-diplay-container-container'>
              <div 
                className='focused-thread-message-change-diplay-container'
                onClick={() => changeMessageDisplay(message.id, "text")}>
                <img src={showText} alt="Google show text icon" />
              </div>
              <div 
                className='focused-thread-message-change-diplay-container' 
                onClick={() => changeMessageDisplay(message.id, "html")}>
                <img src={showHtml} alt="Google show html icon" />
              </div>
              <div 
                className='focused-thread-message-change-diplay-container'
                onClick={() => changeMessageDisplay(message.id, "replyHistory")}>
                <img src={showReplyHistory} alt="Google show reply history icon" />
              </div>
              <div 
                className='focused-thread-message-change-diplay-container'
                onClick={() => changeMessageDisplay(message.id, "minimize")}>
                <img src={minimizeIcon} alt="Google minimize icon" />
              </div>
            </div>
            <div 
              id={`i${message.id}`}
              className='focused-thread-message-html-container' 
              dangerouslySetInnerHTML={{__html: getCleanHtml(message)}} 
            />
            {message.attachments
              ? 
                <div className='focused-thread-message-attachments-container'>
                  <div className='focused-thread-message-number-of-attachments'>
                    {getNumberOfAttachmentsString(message)}
                  </div>
                  {message.attachments.map(attachment =>  
                    <div
                      key={attachment.attachmentId}
                      onClick={() => downloadAttachment(attachment)}
                    >
                      <button className='focused-thread-message-attachment-button'>
                        {attachment.filename}
                      </button>
                    </div>)
                  }
                </div>
              :
                <div style={{marginBottom: "10px"}} />
            }
          </div> 
        )}
        <div ref={threadLastMessagePointerRef}/>
        {replyingMode === "not-replying"
          ?
            <button 
              className='focused-thread-reply-button-container'
              onClick={() => setReplyingMode("replying")}
            >
              <div className='focused-thread-reply-button-content'>Reply</div>
            </button>
          :
            <div className='focused-thread-replying-container'>
              <div 
                className='focused-thread-editor-container-container'
                onClick={() => editorInputRef.current?.focus()}
              >
                <div className='focused-thread-editor-container'>
                  <div className='focused-thread-editor-reciever-container'>
                    {getFromField(getLastMessage())}
                  </div>
                  <textarea
                    className='focused-thread-editor'
                    rows={5}
                    cols={40}
                    autoFocus
                    ref={editorInputRef}
                  />
                  <div className="focused-thread-editor-uploaded-attachments-container">
                    {attachments.map(attachment =>
                      <div className='focused-thread-editor-uploaded-attachment-container'>
                        <div className='focused-thread-editor-uploaded-attachment'>
                          {attachment.filename}
                        </div>
                        <div className='focused-thread-editor-remove-attachment-icon-container'>
                          <img
                            className='focused-thread-editor-remove-attachment-icon'
                            src={removeAttachmentIcon} 
                            alt="Google remove attachment icon"
                            onClick={() => setAttachments((oldAttachments) => {
                              const currentAttachment = attachment;
                              return oldAttachments.filter(attachment => attachment.filename !== currentAttachment.filename)
                            })}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className='focused-thread-editor-buttons-container'>
                    <div className='focused-thread-editor-reply-attachment-container'>
                      <div 
                        className='focused-thread-editor-reply-button-container'
                        onClick={reply}
                      >
                        <div className='focused-thread-editor-reply-button-text'>
                          Send
                        </div>
                      </div>
                      <div 
                        className='focused-thread-editor-attachments-button-container'
                        onClick={addAttachment}
                      >
                        <img
                          className='focused-thread-editor-attachments-button-icon'
                          src={attachmentIcon} 
                          alt="Google attachment icon"
                        />
                      </div>
                    </div>
                    <div 
                      className='focused-thread-editor-delete-button-container'
                      onClick={() => {
                        setAttachments([]);
                        setReplyingMode("not-replying");
                      }}
                    >
                      <img
                        className='focused-thread-editor-delete-button-icon'
                        src={deleteIcon}
                        alt="Google delete icon" 
                      />
                    </div>
                  </div>
                </div>
              </div>

            </div>
        }
      </div>
    </div>
  )
}

export default FocusedThread