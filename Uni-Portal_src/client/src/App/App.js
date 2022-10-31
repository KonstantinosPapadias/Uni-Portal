import { useState, useEffect } from "react";
import {Routes, Route} from "react-router-dom";
import axios from "axios";
import HomePage from "../pages/HomePage/HomePage";
import SigninPage from "../pages/SigninPage/SigninPage";
import { ToastContainer } from "react-toastify";
import "./App.css";

function App() {
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    async function fetchData(){
      const request = {
        method: "get",
        url: "http://localhost:3001/api/auth/authenticated",
        withCredentials: true
      };
      try {
        const response = await axios(request);
        setAuthenticated(response.data.authenticated);
      } catch (err) {
        console.log(err);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <Routes>
        <Route path="/" element={authenticated? <HomePage /> : <SigninPage />} />
      </Routes>
      <ToastContainer />
    </div>
  );
}

export default App;
