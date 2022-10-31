import { useState, useRef } from 'react';
import axios from "axios";
import DOMPurify from "dompurify";
import "./FocusedEmail.css";
import minimizeIcon from "./minimize.png";
import removeAttachmentIcon from "./remove_attachment.png";
import attachmentIcon from "./attachment.svg";
import deleteIcon from "./delete.png";
import { toast } from "react-toastify";

function FocusedEmail({email, setMode}) {
  // replying modes -> 'not-replying', 'replying'
  const [replyingMode, setReplyingMode] = useState("not-replying");
  const [attachments, setAttachments] = useState([]);
  const editorInputRef = useRef(null);

  function getSubject() {
    return email.headers["subject"];
  }

  function getFromField() {
    return email.headers["from"];
  }

  function getDate() {
    let date = email.headers["date"].split("+")[0].split("-")[0].split("GMT")[0].trim();
    return date.substring(0, date.length - 3);
  }

  function getCleanHtml() {
    if (!email.textHtml)
      return email.textPlain;
    return DOMPurify.sanitize(email.textHtml);
  }

  function getNumberOfAttachmentsString() {
    if (email.attachments.length === 1)
      return "1 Attachment";
    return email.attachments.length + " Attachments";
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
      url: `http://localhost:3001/api/${email.gmailAccount}/messages`,
      withCredentials: true,
      headers: {
          "Content-Type": "application/json"
      },
      data: JSON.stringify({
          email: {
              from: email.headers["delivered-to"],
              to: extractSenderEmail(),
              threadId: email.threadId,
              inReplyTo: email.headers["message-id"],
              references: email.headers["message-id"],
              subject: email.headers.subject,
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

  function extractSenderEmail() {
    return getReplyToField().split("<").pop().split(">")[0];
  }

  function getReplyToField() {
      if (email.headers["reply-to"])
          return email.headers["reply-to"];
      return email.headers.from;
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
    <div className='focused-email-container'>
      <div className='focused-email-contents-container'>
        <div className='focused-email-minimize-icon-container'>
          <img 
            className='focused-email-minimize-icon' 
            src={minimizeIcon} 
            alt="Google minimize icon" 
            onClick={() => setMode("unfocused")}
          />
        </div>
        <div className='focused-email-subject-container'>{getSubject()}</div>
        <div className='focused-email-from-and-date-container'>
          <div className='focused-email-from-container'>{getFromField()}</div>
          <div className='focused-email-date-container'>{getDate()}</div>
        </div>
        <div className='focused-email-html-container'>
          <iframe
            className='focused-email-html-iframe'
            title='focused-email-html-iframe'
            src="" 
            frameBorder="0"
            srcDoc={getCleanHtml()}
          >
          </iframe>
        </div>
        {email.attachments
          ? 
            <div className='focused-email-attachments-container'>
              <hr className='focused-email-attachments-hr'/>
              <div className='focused-email-number-of-attachments'>
                {getNumberOfAttachmentsString()}
              </div>
              {email.attachments.map(attachment =>  
                <a
                  key={attachment.attachmentId}
                  href={getAttachmentDataUrl(attachment)}
                  download={attachment.filename}
                >
                  <button className='focused-email-attachment-button'>
                    {attachment.filename}
                  </button>
                </a>)
              }
            </div>
          :
            <div />
        }
        {replyingMode === "not-replying"
          ?
            <button 
              className='focused-email-reply-button-container'
              onClick={() => setReplyingMode("replying")}
            >
              <div className='focused-email-reply-button-content'>Reply</div>
            </button>
          :
            <div className='focused-email-replying-container'>
              <div 
                className='focused-email-editor-container-container'
                onClick={() => editorInputRef.current?.focus()}
              >
                <div className='focused-email-editor-container'>
                  <div className='focused-email-editor-reciever-container'>
                    {getFromField()}
                  </div>
                  <textarea
                    className='focused-email-editor'
                    rows={5}
                    cols={40}
                    autoFocus
                    ref={editorInputRef}
                  />
                  <div className="focused-email-editor-uploaded-attachments-container">
                    {attachments.map(attachment =>
                      <div className='focused-email-editor-uploaded-attachment-container'>
                        <div className='focused-email-editor-uploaded-attachment'>
                          {attachment.filename}
                        </div>
                        <div className='focused-email-editor-remove-attachment-icon-container'>
                          <img
                            className='focused-email-editor-remove-attachment-icon'
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
                  <div className='focused-email-editor-buttons-container'>
                    <div className='focused-email-editor-reply-attachment-container'>
                      <div 
                        className='focused-email-editor-reply-button-container'
                        onClick={reply}
                      >
                        <div className='focused-email-editor-reply-button-text'>
                          Send
                        </div>
                      </div>
                      <div 
                        className='focused-email-editor-attachments-button-container'
                        onClick={addAttachment}
                      >
                        <img
                          className='focused-email-editor-attachments-button-icon'
                          src={attachmentIcon} 
                          alt="Google attachment icon"
                        />
                      </div>
                    </div>
                    <div 
                      className='focused-email-editor-delete-button-container'
                      onClick={() => {
                        setAttachments([]);
                        setReplyingMode("not-replying");
                      }}
                    >
                      <img
                        className='focused-email-editor-delete-button-icon'
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

export default FocusedEmail