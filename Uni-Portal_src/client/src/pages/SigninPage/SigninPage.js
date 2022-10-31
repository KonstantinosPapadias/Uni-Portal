import {useState, useRef} from 'react';
import axios from "axios";
import "./SigninPage.css";
import logo from "./big_logo.svg";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function SigninPage() {
    const [currentPage, setCurrentPage] = useState("signin");
    const signInUserNameInputRef = useRef(null);
    const signInPasswordInputRef = useRef(null);
    const signUpUserNameInputRef = useRef(null);
    const signUpPasswordInputRef = useRef(null);

    function renderSignupPage(event) {
        event.preventDefault();
        setCurrentPage("signup");
        setTimeout(() => signUpUserNameInputRef.current?.focus(), 100);
    }

    async function signInUser() {
        try {
            const response = await axios({
                method: "post",
                url: "http://localhost:3001/api/auth/signin",
                withCredentials: true,
                headers: {
                    "Content-Type": "application/json"
                },
                data: JSON.stringify({
                    username: signInUserNameInputRef.current?.value,
                    password: signInPasswordInputRef.current?.value
                })
            });
            if (response.data.message === "success")
                window.location.reload();
        } catch (err) {
            console.log(err)
            let errorMessage;
            if (err.response === undefined)
                errorMessage = "Server is down, please try again later";
            else
                errorMessage = err.response.data.message;
            toast.error(
                errorMessage, 
                {
                    autoClose: false
                }
            );
        }
    }

    async function registerUser() {
        try {
            const response = await axios({
                method: "post",
                url: "http://localhost:3001/api/auth/signup",
                withCredentials: true,
                headers: {
                    "Content-Type": "application/json"
                },
                data: JSON.stringify({
                    username: signUpUserNameInputRef.current?.value,
                    password: signUpPasswordInputRef.current?.value
                })
            });
            if (response.data.message === "success")
                window.location.reload();
        } catch (err) {
            toast.info(
                err.response.data.message, 
                {
                    theme: "dark",
                    autoClose: false
                }
            );
        }
    }

    return (
        <div 
            className='signin-page'
            tabIndex="0"
            onKeyDown={async (e) => {
                if (e.key !== "Enter")
                    return;
                if (currentPage === "signin")
                    await signInUser();
                else if (currentPage === "signup")
                    await registerUser();
            }}>     
            <div className='center-container'>
                <div className='center-container-logo-container'>
                    <img
                        className='center-container-logo'
                        src={logo} 
                        alt="UniPortal logo." 
                    />
                </div>
                {currentPage === "signin"
                    ?
                        <div className='form-component-container'>
                            <div className='form-header'>Sign In</div>
                            <div className='form-container'>
                                <div className='input-container' onClick={(e) => e.target.children[0]?.focus()}>
                                    <input 
                                        className='form-input' 
                                        type="text" 
                                        name="username" 
                                        placeholder='Username' 
                                        ref={signInUserNameInputRef}
                                        autoFocus
                                        />
                                </div>
                                <div className='input-container' onClick={(e) => e.target.children[0]?.focus()}>
                                    <input 
                                        className='form-input' 
                                        type="password" 
                                        name="password" 
                                        placeholder='Password' 
                                        ref={signInPasswordInputRef}
                                        />
                                </div>
                                <div 
                                    className='form-submit-button'
                                    onClick={signInUser}
                                    >
                                        <div>Log in</div>
                                </div>
                            </div>
                            <hr className='form-component-container-hr'/>
                            <div className='form-text'>Or</div>
                            <div 
                                className='form-container-create-account-button' 
                                onClick={renderSignupPage}>
                                    <div>Create a new account</div>
                            </div>
                        </div>
                    :
                        <div className='form-component-container'>
                            <div className='form-header'>Sign Up</div>
                            <div className='form-container'>
                                <div className='input-container' onClick={(e) => e.target.children[0]?.focus()}>
                                    <input 
                                        className='form-input' 
                                        type="text" 
                                        name="username" 
                                        placeholder='Username'
                                        ref={signUpUserNameInputRef}
                                        />
                                </div>
                                <div className='input-container' onClick={(e) => e.target.children[0]?.focus()}>
                                    <input 
                                        className='form-input' 
                                        type="password" 
                                        name="password" 
                                        placeholder='Password' 
                                        ref={signUpPasswordInputRef}
                                        />
                                </div>
                                <div 
                                    className='form-submit-button'
                                    onClick={registerUser}
                                    >
                                        <div>Register</div>
                                </div>
                            </div>
                            <div className='form-text'>Your data will be secured in UniPortal</div>
                            <div style={{marginBottom: "20px"}}></div>
                        </div>
                }
            </div>
        </div>
    )
}