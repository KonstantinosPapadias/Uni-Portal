import React, {  useState, useEffect } from 'react';
import axios from "axios";
import HomeNavbar from '../../components/HomeNavbar/HomeNavbar';
import HomeTabs from "../../components/HomeTabs/HomeTabs";
import "./HomePage.css";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function HomePage() {
    const [gmail1Inbox, setGmail1Inbox] = useState({
        account: "",
        accountDisplayName: "",
        unreadThreads: [],
        starredThreads: []
    });
    const [gmail2Inbox, setGmail2Inbox] = useState({
        account: "",
        accountDisplayName: "",
        unreadThreads: [],
        starredThreads: []
    });
    const [msTeamsData, setMsTeamsData] = useState({
        account: "",
        displayName: "",
        chats: []
    });

    useEffect(() => {
        async function getGmailInbox(gmailAccount) {
            try {
                const response = await toast.promise(
                    axios({
                        method: "get",
                        url: `http://localhost:3001/api/${gmailAccount}/threads`,
                        withCredentials: true
                    }),
                    {
                        pending: `Fetching Gmail #${getGmailAccountNumber(gmailAccount)} inbox...`,
                    },
                    {
                        theme: "dark",
                    }
                );
                if (response.data.account === "") {
                    toast.info(
                        `Your Gmail account #${getGmailAccountNumber(gmailAccount)} 
                        is not connected. You can connect it from the navbar.`,
                        {
                            theme: "light",
                            autoClose: false
                        }
                    );
                    return;
                }
                if (gmailAccount === "gmail1")
                    setGmail1Inbox(response.data);
                else if (gmailAccount === "gmail2")
                    setGmail2Inbox(response.data);
            } catch (err) {
                console.log(err)
                toast.info(
                    `Reauthorize the app to access your 
                        Gmail account #${getGmailAccountNumber(gmailAccount)}.`, 
                    {
                        theme: "dark",
                        autoClose: false
                    }
                );
            }
        }

        function getGmailAccountNumber(gmailAccount) {
            return gmailAccount.split("gmail")[1];
        }

        async function getMsTeamsData() {
            try {
                const response = await toast.promise(
                    axios({
                        method: "get",
                        url: "http://localhost:3001/api/msTeams/chats",
                        withCredentials: true
                    }),
                    {
                        pending: `Fetching data from Microsoft Teams account...`
                    },
                    {
                        theme: "dark",
                    }
                )
                if (response.data.account === "") {
                    toast.info(
                        `Your Microsoft Teams account is not connected.\
                        You can connect it from the navbar.`, 
                        {
                            theme: "light",
                            autoClose: false
                        }
                    );
                    return;
                }
                setMsTeamsData(response.data);
            } catch (err) {
                console.log(err)
                toast.info(
                    `Reauthorize the app to access your 
                        Microsoft Teams account.`, 
                    {
                        theme: "dark",
                        autoClose: false
                    }
                );
            }
        }

        getGmailInbox("gmail1");
        getGmailInbox("gmail2");
        getMsTeamsData();
    }, []);

    return (
        <div className='home-page-container'>
            <HomeNavbar />
            <HomeTabs
                gmail1Inbox={gmail1Inbox}
                gmail2Inbox={gmail2Inbox}
                msTeamsData={msTeamsData}
            />
        </div>
    )
}