import { useState, useEffect, useRef } from 'react';
import Email from "../Email/Email";
import Thread from "../Thread/Thread";
import "./GmailInbox.css";
import composeEmailIcon from "./compose_email.svg";
import removeAttachmentIcon from "./remove_attachment.png";
import attachmentIcon from "./attachment.svg";
import deleteIcon from "./delete.png";
import axios from "axios";
import { toast } from "react-toastify";

export default function GmailInbox({gmailAccount, inbox}) {
    const [composeEmailState, setComposeEmailState] = useState("disabled");
    const [newEmailAttachments, setNewEmailAttachments] = useState([]);
    const newEmailToInputRef = useRef(null);
    const newEmailSubjectInputRef = useRef(null);
    const newEmailEditorTextareaRef = useRef(null);
    const composeEmailEditorPointerRef = useRef(null);

    useEffect(() => {
        function scrollIntoComposeEmailForm() {
            if (composeEmailState === "disabled")
                return;
            composeEmailEditorPointerRef.current?.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'nearest', 
                inline: 'nearest' 
            });
            setTimeout(() => {
                newEmailToInputRef.current?.focus();
            }, 1000);
        }

        scrollIntoComposeEmailForm();
    }, [composeEmailState]);
    

    async function sendEmail() {
        try {
            const request = {
                method: "post",
                url: `http://localhost:3001/api/${gmailAccount}/messages`,
                withCredentials: true,
                headers: {
                    "Content-Type": "application/json"
                },
                data: JSON.stringify({
                    email: {
                        from: `"${inbox.accountDisplayName}" <${inbox.account}>`,
                        to: newEmailToInputRef.current?.value,
                        subject: newEmailSubjectInputRef.current?.value,
                        html: newEmailEditorTextareaRef.current?.value,
                        attachments: newEmailAttachments
                    }
                })
            };
            toast.promise(
                axios(request),
                {
                    pending: `Sending email...`,
                    success: `Done.`,
                    error: `Could not send email. 
                            Check if destination email address is invalid.`
                },
                {
                  theme: "dark",
                  autoClose: 2000
                }
            );
            setNewEmailAttachments([]);
        } catch (error) {
            console.log(error);
        }
    }

    function addNewAttachment() {
        const fileInput = document.createElement('input');
        fileInput.type = "file";
        fileInput.onchange = () => {
            const fileReader = new FileReader();
            fileReader.onload = () => setNewEmailAttachments(oldAttachments => {
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
        <div className='gmail-inbox-container'>
            <div className='gmail-inbox-compose-button-container-container'>
                <div 
                    className='gmail-inbox-compose-button-container'
                    onClick={() => setComposeEmailState("enabled")}
                >
                    <div className='gmail-inbox-compose-button'>
                        <img 
                            src={composeEmailIcon} 
                            alt="Google compose email icon." 
                        />
                        <div>Compose</div>
                    </div>
                </div>
            </div>
            <div className='unread-emails-container'>
                <div className='threads-container'>
                    <div className='threads-container-threads-type-container'>Unread:</div>
                    {inbox.unreadThreads
                        ?
                            inbox.unreadThreads.map(thread => 
                                <Thread 
                                    key={thread.id} 
                                    thread={thread}             
                                />)
                        :
                            <div />
                    }
                </div>
                <div className='threads-container'>
                    <div className='threads-container-threads-type-container'>Starred:</div>
                    {inbox.starredThreads
                        ?
                            inbox.starredThreads.map(thread => 
                                <Thread 
                                    key={thread.id} 
                                    thread={thread}             
                                />)
                        :
                            <div />
                    }
                </div>
            </div>
            {composeEmailState === "enabled"
                ?
                    <div className='compose-email-editor-container'>
                        <div className='compose-email-editor-header-container'>
                            <div className='compose-email-editor-header'>
                                <div className='compose-email-editor-header-new-message'>
                                    New message
                                </div>
                            </div>
                        </div>
                        <div className='compose-email-editor-body-container'>
                            <div className='compose-email-editor-body'>
                                <input
                                    className='compose-email-editor-body-input'
                                    type="text" 
                                    placeholder='To'
                                    ref={newEmailToInputRef}
                                />
                                <hr className='compose-email-editor-body-hr' />
                                <input
                                    className='compose-email-editor-body-input'
                                    type="text" 
                                    placeholder='Subject'
                                    ref={newEmailSubjectInputRef}
                                />
                                <hr className='compose-email-editor-body-hr' />
                                <textarea
                                    className='compose-email-editor-body-editor'
                                    cols="30" 
                                    rows="10"
                                    ref={newEmailEditorTextareaRef}
                                >
                                </textarea>

                                <div className="compose-email-editor-uploaded-attachments-container">
                                    {newEmailAttachments.map(attachment =>
                                        <div className='compose-email-editor-uploaded-attachment-container'>
                                            <div className='compose-email-editor-uploaded-attachment'>
                                                {attachment.filename}
                                            </div>
                                            <div className='compose-email-editor-remove-attachment-icon-container'>
                                                <img
                                                    className='compose-email-editor-remove-attachment-icon'
                                                    src={removeAttachmentIcon} 
                                                    alt="Google remove attachment icon"
                                                    onClick={() => setNewEmailAttachments((oldAttachments) => {
                                                        const currentAttachment = attachment;
                                                        return oldAttachments.filter(attachment => attachment.filename !== currentAttachment.filename)
                                                    })}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className='compose-email-editor-buttons-container'>
                                    <div className='compose-email-editor-reply-attachment-container'>
                                        <div 
                                            className='compose-email-editor-reply-button-container'
                                            onClick={sendEmail}
                                        >
                                            <div className='compose-email-editor-reply-button-text'>
                                                Send
                                            </div>
                                        </div>
                                        <div 
                                            className='compose-email-editor-attachments-button-container'
                                            onClick={addNewAttachment}
                                        >
                                            <img
                                                className='compose-email-editor-attachments-button-icon'
                                                src={attachmentIcon} 
                                                alt="Google attachment icon"
                                            />
                                        </div>
                                    </div>
                                    <div 
                                        className='compose-email-editor-delete-button-container'
                                        onClick={() => {
                                            setNewEmailAttachments([]);
                                            setComposeEmailState("disabled");
                                        }}
                                    >
                                        <img
                                            className='compose-email-editor-delete-button-icon'
                                            src={deleteIcon}
                                            alt="Google delete icon" 
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                :
                    <div />
            }
            <div ref={composeEmailEditorPointerRef}/>
        </div>
    )
}