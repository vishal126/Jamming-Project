import React, { useState } from "react";
import Spotify from "../util/Spotify";

import SearchBar from "./SearchBar";
import SearchResults from "./SearchResults";
import Playlist from "./Playlist";

import styles from "../styles/search.module.css";

function Search() {

    const [input, setInput] = useState("");

    const [songData, setSongData] = useState([]);

    const [playlistTracks, setPlaylistTracks] = useState([]);

    const [playlistName, setPlaylistName] = useState("My Playlist");

    const handleInputChange = ({ target }) => {
        setInput(target.value);
    };

    const handleSearch = async () => {

        try {

            const songs = await Spotify.search(input);

            setSongData(songs);

        }

        catch (error) {

            console.error(error);

            alert(error.message);

        }

    };

    const handleAddTrack = (song) => {

        const exists =
            playlistTracks.some(track => track.id === song.id);

        if (!exists) {

            setPlaylistTracks(prev => [...prev, song]);

        }

    };

    const handleRemoveTrack = (song) => {

        setPlaylistTracks(prev =>

            prev.filter(track => track.id !== song.id)

        );

    };

    const handleSavePlaylist = async () => {

        try {

            const trackUris =
                playlistTracks.map(track => track.uri);

            await Spotify.savePlaylist(

                playlistName,

                trackUris

            );

            alert("Playlist Saved!");

            setPlaylistTracks([]);

            setPlaylistName("My Playlist");

        }

        catch (error) {

            alert(error.message);

        }

    };

    return (

        <div className={styles.search}>

            <SearchBar

                input={input}

                handleInputChange={handleInputChange}

                handleSearch={handleSearch}

            />

            <div className={styles.body}>

                <SearchResults

                    songs={songData}

                    onAddTrack={handleAddTrack}

                />

                <Playlist

                    playlistName={playlistName}

                    setPlaylistName={setPlaylistName}

                    tracks={playlistTracks}

                    onRemoveTrack={handleRemoveTrack}

                    onSave={handleSavePlaylist}

                />

            </div>

        </div>

    );

}

export default Search;