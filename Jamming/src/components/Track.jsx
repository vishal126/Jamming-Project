import React from "react";
import styles from "../styles/track.module.css";

function Track({

    song,

    buttonType,

    onButtonClick

}) {

    return (

        <li
            className={styles.track}
            style={{

                display: "flex",

                justifyContent: "space-between",

                margin: "10px 0"

            }}

        >

            <div className={styles.info}>

                <h3 className={styles.title}>{song.title}</h3>

                <p className={styles.artist}>

                    {song.artist}

                </p>

                <small className={styles.album}>

                    {song.album}

                </small>

            </div>

            <button
                className={styles.button}
                onClick={() =>

                    onButtonClick(song)

                }

            >

                {buttonType}

            </button>

        </li>

    );

}

export default Track;