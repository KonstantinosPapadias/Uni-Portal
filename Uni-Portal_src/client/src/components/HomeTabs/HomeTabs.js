import { useState, useEffect } from 'react';
import Tab from "../Tab/Tab";
import GmailInbox from '../GmailInbox/GmailInbox';
import MsTeamsInbox from '../MsTeamsInbox/MsTeamsInbox';
import "./HomeTabs.css";

function HomeTabs({ gmail1Inbox, gmail2Inbox, msTeamsData }) {
    const [gmail1IsActivated, setGmail1IsActivated] = useState(true);
    const [gmail2IsActivated, setGmail2IsActivated] = useState(false);
    const [msTeamsIsActivated, setMsTeamsIsActivated] = useState(false);
    const [currentTabAccount, setCurrentTabAccount] = useState({});

    useEffect(() => {
        function updateCurrentTabAccount() {
            setCurrentTabAccount({
                account: gmail1Inbox.account,
                accountDisplayName: gmail1Inbox.accountDisplayName
            });
        }

        updateCurrentTabAccount();
    }, [gmail1Inbox]);
    
    function activateTab(e, tab) {
        e.preventDefault();
        deactivateAllTabs();
        const tabStateUpdateFunction = getTabStateUpdateFunction(tab);
        tabStateUpdateFunction(true);
        setCurrentTabAccount(getCurrentTabAccount(tab));
    }

    function deactivateAllTabs() {
        setGmail1IsActivated(false);
        setGmail2IsActivated(false);
        setMsTeamsIsActivated(false);
    }

    function getTabStateUpdateFunction(tab) {
        if (tab === "gmail1")
            return setGmail1IsActivated;
        else if (tab === "gmail2")
            return setGmail2IsActivated;
        else if (tab === "msTeams")
            return setMsTeamsIsActivated;
    }

    function getCurrentTabAccount(tab) {
        if (tab === "gmail1")
            return {
                account: gmail1Inbox.account,
                accountDisplayName: gmail1Inbox.accountDisplayName
            };
        else if (tab === "gmail2")
            return {
                account: gmail2Inbox.account,
                accountDisplayName: gmail2Inbox.accountDisplayName
            };
        else if (tab === "msTeams")
            return {
                account: msTeamsData.account,
                accountDisplayName: msTeamsData.displayName
            };
    }

    return (
        <div className='tabs-container'>
            <div className='tabs-buttons-container'>
                <div 
                    className={gmail1IsActivated ? 'tab-title-activated' : "tab-title"} 
                    onClick={(e) => activateTab(e, "gmail1")}>
                    <div className='tab-title-header'>Gmail #1</div>
                </div>
                <div 
                    className={gmail2IsActivated ? 'tab-title-activated' : "tab-title"} 
                    onClick={(e) => activateTab(e, "gmail2")}>
                    <div className='tab-title-header'>Gmail #2</div>
                </div>
                <div 
                    className={msTeamsIsActivated ? 'tab-title-activated' : "tab-title"} 
                    onClick={(e) => activateTab(e, "msTeams")}>
                    <div className='tab-title-header'>MsTeams</div>
                </div>
            </div>

            <div className='tabs-account-container-container'>
                <div className='tabs-account-container'>
                    <div className='tabs-account-container-display-name'>{currentTabAccount.accountDisplayName}</div>
                    <div className='tabs-account-container-account'>{currentTabAccount.account}</div>
                </div>
            </div>

            <div className='tabs'>
                <Tab
                    active={gmail1IsActivated}
                    tabElement={
                        <GmailInbox
                            gmailAccount={"gmail1"}
                            inbox={gmail1Inbox}
                        />
                    } 
                />
                <Tab
                    active={gmail2IsActivated}
                    tabElement={
                        <GmailInbox
                            gmailAccount={"gmail2"}
                            inbox={gmail2Inbox}
                        />
                    } 
                />
                <Tab
                    active={msTeamsIsActivated}
                    tabElement={
                        <MsTeamsInbox 
                            userDisplayName={msTeamsData.displayName}
                            chats={msTeamsData.chats} 
                        />
                    } 
                />
            </div>
        </div>
    )
}

export default HomeTabs
