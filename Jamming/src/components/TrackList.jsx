import React from "react";
import styles from "../styles/trackList.module.css";
import Track from "./Track";

function TrackList({

    tracks,

    buttonType,

    onButtonClick

}) {

    return (

        <ul className={styles.list}>

            {

                tracks.map(track => (

                    <Track

                        key={track.id}

                        song={track}

                        buttonType={buttonType}

                        onButtonClick={onButtonClick}

                    />

                ))

            }

        </ul>

    );

}

export default TrackList;