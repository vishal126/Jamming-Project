import React from "react";
import styles from "../styles/searchResults.module.css";
import TrackList from "./TrackList";

function SearchResults({

    songs,

    onAddTrack

}) {

    return (

        <div className={styles.container}>

            <h2 className={styles.title}>Search Results</h2>

            <TrackList

                tracks={songs}

                buttonType="+"

                onButtonClick={onAddTrack}

            />

        </div>

    );

}

export default SearchResults;