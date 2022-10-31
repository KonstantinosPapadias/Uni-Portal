import {useState, useEffect} from 'react';
import axios from "axios";
import "./UnfocusedThread.css";
import starIcon from "./star.svg";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function UnfocusedThread({thread, setMode}) {
  const [threadIsUnread, setThreadIsUnread] = useState(false);
  const [threadIsStarred, setThreadIsStarred] = useState(false);

  useEffect(() => {
    function initializeUnreadAndStarredThreadStatus() {
      if (thread.labelIds.includes("UNREAD"))
        setThreadIsUnread(true);
      if (thread.labelIds.includes("STARRED"))
        setThreadIsStarred(true);
    }

    initializeUnreadAndStarredThreadStatus()
  }, []);
  
  async function focusThread(e) {
    if (thread.labelIds.includes("UNREAD")) {
      await modifyThread("UNREAD", "remove");
      thread.labelIds = thread.labelIds.filter((labelId) => labelId !== "UNREAD");
      setThreadIsUnread(false);
    }
    setMode("focused");
  }

  async function changeThreadStarredStatus() {
    if (!thread.labelIds.includes("STARRED")) {
      await modifyThread("STARRED", "add");
      thread.labelIds.push("STARRED");
      setThreadIsStarred(true);
    }
    else {
      await modifyThread("STARRED", "remove");
      thread.labelIds = thread.labelIds.filter((labelId) => labelId !== "STARRED");
      setThreadIsStarred(false);
    }
  }

  async function modifyThread(labelId, typeOfModification) {
    try {
      let requestBody;
      if (typeOfModification === "add")
        requestBody = { addLabelIds: [labelId] };
      else if (typeOfModification === "remove")
        requestBody = { removeLabelIds: [labelId] };
      const response = await axios({
        method: "patch",
        url: `http://localhost:3001/api/${thread.account}/threads/${thread.id}/modify`,
        withCredentials: true,
        headers: {
          "Content-Type": "application/json"
        },
        data: JSON.stringify(requestBody)
      });
    } catch (err) {
      toast.info(
        "Could not modify thread.", 
        {
            theme: "dark",
            autoClose: 2000
        }
      );
    }
  }

  function getMembersString() {
    let members = thread.members[0];
    for (let member of thread.members.slice(1))
      members += `, ${member}`;
    return members;
  }

  function getLastMessage() {
    return thread.messages[thread.messages.length - 1];
  }

  function getFirstMessage() {
    return thread.messages[0];
  }

  function getFirstMessageSubject() {
    const subject = getFirstMessage().headers["subject"]; 
    if (subject === "")
      return "No subject";
    return subject;
  }

  function getLastMessageSnippet() {
    return getLastMessage().snippet;
  }

  function getLastMessageTimeOrDate() {
    const datePieces = getLastMessage().headers["date"].split(" ");
    return datePieces[2] + " " + datePieces[1];
  }

  return (
    <div 
      className={threadIsUnread ? 'unfocused-unread-thread-container' : 'unfocused-starred-thread-container'}
      onClick={async () => await focusThread()}>
      <div className='unfocused-thread-contents-container'>
        <div 
          className={threadIsStarred ? "unfocused-starred-thread-star-icon-container" : 'unfocused-thread-star-icon-container'} 
          onClick={async (e) => {
            e.stopPropagation();
            await changeThreadStarredStatus();
          }}>
          <img src={starIcon} alt="Google star icon" />
        </div>
        <div className='unfocused-thread-members-container'>{getMembersString()}</div>
        <div className='unfocused-thread-subject-and-snippet-container'>
          <div className='unfocused-thread-subject-container'>{getFirstMessageSubject()}</div>
          <div className='unfocused-thread-snippet-container'>{" - " + getLastMessageSnippet()}</div>
        </div>
        <div className='unfocused-thread-time-or-date-container'>{getLastMessageTimeOrDate()}</div>
      </div>
    </div>
  )
}

export default UnfocusedThread