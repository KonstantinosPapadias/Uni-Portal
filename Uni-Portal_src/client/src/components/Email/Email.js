import { useState } from "react";
import UnfocusedEmail from '../UnfocusedEmail/UnfocusedEmail';
import FocusedEmail from "../FocusedEmail/FocusedEmail";

function Email({email}) {
    // modes -> 'unfocused', 'focused'
    const [mode, setMode] = useState("unfocused");
    
    return (
        mode === "unfocused"
            ?
                <UnfocusedEmail 
                    email={email} 
                    setMode={setMode} 
                />
            :
                <FocusedEmail 
                    email={email} 
                    setMode={setMode}
                />
    )
}

export default Email;