import React from "react";
import styles from "../styles/playlist.module.css";
import TrackList from "./TrackList";

function Playlist({

    playlistName,

    setPlaylistName,

    tracks,

    onRemoveTrack,

    onSave

}) {

    return (

        <div className={styles.container}>

            <input
                className={styles.input}
                value={playlistName}

                onChange={

                    e =>

                    setPlaylistName(e.target.value)

                }

            />

            <TrackList

                tracks={tracks}

                buttonType="-"

                onButtonClick={onRemoveTrack}

            />

            <button
                className={styles.button}
                onClick={onSave}

                disabled={

                    !playlistName ||

                    tracks.length === 0

                }

            >

                Save to Spotify

            </button>

        </div>

    );

}

export default Playlist;