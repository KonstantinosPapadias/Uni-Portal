import React from 'react';
import "./Tab.css";

function Tab({active, tabElement}) {

    return (
        <div className='tab-container'>
            {active
            ? <div className='tab-element'>{tabElement}</div>
            : <div/>}
        </div>
    )
}

export default Tab
