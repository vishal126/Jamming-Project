import React from "react";
import styles from "../styles/searchBar.module.css";

function SearchBar({
    input,
    handleInputChange,
    handleSearch
}) {
    return (
        <div className={styles.container}>
            <input 
                className={styles.input}
                value={input}
                onChange={handleInputChange}
                placeholder="Search Songs"
            />
            <button
                className={styles.button}
                onClick={handleSearch}
            >
                Search
            </button>
        </div>
    );
}

export default SearchBar;