import React, { useState, useEffect } from 'react';
import './Bookmark.css';

interface Props {
    checkToken: () =>  string | undefined;
}

const Bookmark: React.FC<Props> = ({checkToken}) => {

    return (
        <div className="home-parent">
            <div className="home-children">

            </div>
        </div>
    );
};

export default Bookmark;