import { useState } from "react";
import UnfocusedThread from '../UnfocusedThread/UnfocusedThread';
import FocusedThread from "../FocusedThread/FocusedThread";

function Thread({thread}) {
    // modes -> 'unfocused', 'focused'
    const [mode, setMode] = useState("unfocused");
    
    return (
        mode === "unfocused"
            ?
                <UnfocusedThread 
                    thread={thread} 
                    setMode={setMode} 
                />
            :
                <FocusedThread 
                    thread={thread} 
                    setMode={setMode}
                />
    )
}

export default Thread;