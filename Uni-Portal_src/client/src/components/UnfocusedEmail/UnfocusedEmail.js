import React from 'react';
import axios from "axios";
import "./UnfocusedEmail.css";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function UnfocusedEmail({email, setMode}) {

  async function focusEmail() {
    setMode("focused");
    await markEmailAsRead();
  }

  async function markEmailAsRead() {
    try {
      const response = await axios({
        method: "patch",
        url: `http://localhost:3001/api/${email.gmailAccount}/messages/${email.id}/markAsRead`,
        withCredentials: true,
        headers: {
          "Content-Type": "application/json"
        },
        data: JSON.stringify({})
      });
    } catch (err) {
      toast.info(
        "Could not mark message as read.", 
        {
            theme: "dark",
            autoClose: 2000
        }
    );
    }
  }

  function getSenderName() {
    let senderName = email.headers["from"].split("<")[0].trim();
    if (senderName.startsWith("\""))
      senderName = senderName.substring(1, senderName.length - 1);
    return senderName;
  }

  function getSubject() {
    return email.headers["subject"];
  }

  function getSnippet() {
    return email.snippet;
  }

  function getTimeOrDate() {
    const datePieces = email.headers["date"].split(" ");
    return datePieces[2] + " " + datePieces[1];
  }

  return (
    <div className='unfocused-email-container' onClick={focusEmail}>
      <div className='unfocused-email-contents-container'>
        <div className='unfocused-email-sender-name-container'>{getSenderName()}</div>
        <div className='unfocused-email-subject-and-snippet-container'>
          <div className='unfocused-email-subject-container'>{getSubject()}</div>
          <div className='unfocused-email-snippet-container'>{" - " + getSnippet()}</div>
        </div>
        <div className='unfocused-email-time-or-date-container'>{getTimeOrDate()}</div>
      </div>
    </div>
  )
}

export default UnfocusedEmail