import React from 'react';
import "./HomeNavbar.css";
import smallLogo from "./small_logo.svg";
import logout from "./logout.svg";

function HomeNavbar() {
    const connectAccountURLs = {
        gmail1: "http://localhost:3001/api/connect/gmail1",
        gmail2: "http://localhost:3001/api/connect/gmail2",
        msTeams: "http://localhost:3001/api/connect/msTeams",
    };

    function createLinkAndClickIt(href) {
        const link = document.createElement("a");
        link.href = href;
        link.click();
    }

    function connectAccount(account) {
        createLinkAndClickIt(connectAccountURLs[account]);
    }

    function signOut() {
        createLinkAndClickIt("http://localhost:3001/api/auth/signout");
    }

    return (
        <div className='navbar-container'>
            <div className='navbar-container-flex-start-container'>
                <div 
                    className='navbar-container-logo-container' 
                    onClick={() => window.location.replace("http://localhost:3000")}>
                    <img 
                        src={smallLogo} 
                        alt="UniPortal logo." 
                    />
                </div>
                
                <div className='home-navbar-links-container'>
                    <div 
                        className='home-navbar-link'
                        onClick={() => connectAccount("gmail1")}
                        >
                            Connect Gmail account #1
                    </div>
                    <div 
                        className='home-navbar-link'
                        onClick={() => connectAccount("gmail2")}
                        >
                            Connect Gmail account #2
                    </div>
                    <div 
                        className='home-navbar-link'
                        onClick={() => connectAccount("msTeams")}
                        >
                            Connect MsTeams account
                    </div>
                </div>
            </div>
            <div 
                className='signout-img-container'
                onClick={signOut}>
                <img className='signout-img' src={logout} alt="signout-img" />
            </div>
        </div>
    )
}

export default HomeNavbar