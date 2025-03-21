import { useEffect, useState, useRef } from "react";
import ReactChord from '@tombatossals/react-chords/lib/Chord'

function App() {
  const [chords, setChords] = useState([]);
  const [currentChord, setCurrentChord] = useState(null);
  const [nextChord, setNextChord] = useState(null);
  const [capo, setCapo] = useState(0);
  const [instrument, setInstrument] = useState("guitar");
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [guitarData, setGuitarData] = useState(null);
  const [ukuleleData, setUkuleleData] = useState(null);

  const [filename, setFilename] = useState();
  const [audioSrc, setAudioSrc] = useState();

  const chordsKeys = ["A", "Ab", "B", "Bb", "C", "Csharp", "D", "Db", "E", "Eb", "F", "Fsharp", "G"];

  const tunings = {
    guitar: {
      strings: 6,
      fretsOnChord: 4,
      name: 'Guitar',
      keys: [],
      tunings: {
        standard: ['E', 'A', 'D', 'G', 'B', 'E']
      }
    },
    ukulele: {
      strings: 4,
      fretsOnChord: 4,
      name: 'Ukulele',
      keys: [],
      tunings: {
        standard: ['G', 'C', 'E', 'A']
      }
    }
  }

  useEffect(() => {
    fetch("guitar.json")
      .then((res) => res.json())
      .then((data) => {
        setGuitarData(data);
      })
      .catch((err) => console.error("Failed to load data:", err));

    fetch("ukulele.json")
      .then((res) => res.json())
      .then((data) => {
        setUkuleleData(data);
        console.log(data);
      })
      .catch((err) => console.error("Failed to load data:", err));
  }, []);

  function getChordData(instrument, key, suffix) {
    if (instrument == "guitar" && guitarData) {
      return guitarData.chords[key]?.filter((chord) => chord.suffix == suffix)[0]?.positions[0] || []
    }
    if (instrument == "ukulele" && ukuleleData) {
      return ukuleleData.chords[key]?.filter((chord) => chord.suffix == suffix)[0]?.positions[0] || []
    }
    return [];
  }

  const parseChord = (chord) => {

    if (!chord || chord.length == 0) return { key: "", suffix: "" };

    let key;
    let suffix;
    // first replace all the sharp notes with the flat notes
    [["A#", "Bb"], ["C#", "Db"], ["D#", "Eb"], ["F#", "Gb"], ["G#", "Ab"]].forEach(([sharp, flat]) => {
      chord = chord.replace(sharp, flat);
    });

    ["Ab", "Bb", "Db", "Eb", "Gb"].forEach((flat) => {
      if (chord.startsWith(flat)) {
        key = flat;
        suffix = chord.slice(flat.length);
      }
    });

    if (!key) {
      ["A", "B", "C", "D", "E", "F", "G"].forEach((note) => {
        if (chord.startsWith(note)) {
          key = note;
          suffix = chord.slice(note.length);
        }
      });
    }

    if (suffix == "m") {
      suffix = "minor";
    }
    if (suffix == "") {
      suffix = "major";
    }
    // if (key == "Db") {
    //   key = "Csharp";
    // }
    // if (key == "Gb") {
    //   key = "Fsharp";
    // }

    return { key, suffix };
  };

  const ChordDiagram = ({ chord, instrument }) => {
    let { key, suffix } = parseChord(chord);
    if (!chord || chord.length == 0) return null
    let chordData = getChordData(instrument, key, suffix);
    if ((!chordData || chordData.length == 0) && suffix.includes("/")) {
      suffix = suffix.split("/")[0];
      chordData = getChordData(instrument, key, suffix);
    }
    if (!chordData || chordData.length == 0) {
      return null;
    }
    return (
      <ReactChord
        chord={chordData}
        instrument={tunings[instrument]}
        lite={true}
      />
    );
  };

  useEffect(() => {
    fetch("chords.json")
      .then((res) => res.json())
      .then((data) => {
        if (!data.chords || !data.chords.length) return;

        // Compute durations
        const updatedChords = data.chords.map((chord, index) => {
          const nextChord = data.chords[index + 1];
          return {
            ...chord,
            duration: nextChord ? nextChord.timestamp - chord.timestamp : 1, // Avoid 0 duration
          };
        });

        // Find max duration
        const maxDuration = Math.max(...updatedChords.map((chord) => chord.duration)) || 1;

        // Assign widths based on maxDuration
        const finalChords = updatedChords.map((chord) => ({
          ...chord,
          width: (chord.duration / maxDuration) * 300, // Normalize width
        }));


        setChords(finalChords);
        setFilename(data.filename);
      })
      .catch((err) => console.error("Failed to load data:", err));
  }, []);

  useEffect(() => {
    // Fetching the audio file dynamically
    const fetchAudio = async () => {
      try {
        const response = await fetch(`./tmp.${extractExtension(filename)}`);
        if (response.ok) {
          const blob = await response.blob();
          const audioUrl = URL.createObjectURL(blob); // Create a temporary URL
          setAudioSrc(audioUrl);
        }
      } catch (error) {
        console.error('Error fetching audio:', error);
      }
    };
    fetchAudio();
  }, [filename]);

  useEffect(() => {
    // If the audio source changes, we force the audio to reload
    if (audioRef.current && audioSrc) {
      audioRef.current.load(); // Trigger reloading the audio element
      audioRef.current.play(); // Optionally auto-play the audio when the src changes
    }
  }, [audioSrc]); // Run when audioSrc changes

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.code === "Space") {
        event.preventDefault();
        if (audioRef.current) {
          if (isPlaying) {
            console.log("pause");
            audioRef.current.pause();
            setIsPlaying(false); // Update state to reflect pause
            console.log(chords);

          } else {
            console.log("play");
            audioRef.current.play();
            setIsPlaying(true); // Update state to reflect play
            console.log(chords);

          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyPress);

    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [isPlaying]); // Re-run the effect when isPlaying changes

  const chordDiagramCurrentRef = useRef(null);
  const chordDiagramNextRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);

  function simplifyChord(chord) {
    return chord.replace(/\/.*/, "").replace("A#", "Bb").replace("D#", "Eb");
  }

  const handleZoomIn = () => {
    setChords((prevChords) =>
      prevChords.map((chord) => {
        return {
          ...chord,
          width: chord.width * 2
        };
      })
    );
  };

  const handleZoomOut = () => {
    setChords((prevChords) =>
      prevChords.map((chord) => {
        return {
          ...chord,
          width: chord.width * 0.5,
        };
      })
    );
  };



  useEffect(() => {
    const interval = setInterval(() => {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime);

        // console.log(audioRef.current.currentTime, 'currentTime set chord')
        setChords((prevChords) =>
          prevChords.map((chord) => {
            // current chord: `active`, next chords: "", previous chords: "actived"
            if (chord.timestamp <= audioRef.current.currentTime && (!prevChords[prevChords.indexOf(chord) + 1] || prevChords[prevChords.indexOf(chord) + 1].timestamp > currentTime)) {
              setCurrentChord(simplifyChord(chord.chord));
              setNextChord(simplifyChord(prevChords[prevChords.indexOf(chord) + 1] ? prevChords[prevChords.indexOf(chord) + 1].chord : ""));
              return { ...chord, classes: "active" };
            } else if (chord.timestamp > audioRef.current.currentTime) {
              return { ...chord, classes: "" };
            } else {
              return { ...chord, classes: "actived" };
            }
          })
        );


      }
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  // useEffect(() => {
  //   const audio = audioRef.current;

  //   const handleTimeUpdate = () => {
  //     const currentTime = audio.currentTime;
  //     const activeChord = chords.find(
  //       (chord, index) =>
  //         chord.timestamp <= currentTime &&
  //         (!chords[index + 1] ||
  //           chords[index + 1].timestamp > currentTime)
  //     );

  //     if (activeChord) {
  //       setCurrentChord(activeChord.chord);
  //       setNextChord(
  //         (chords[chords.indexOf(activeChord) + 1] && chords[chords.indexOf(activeChord) + 1].chord) || null
  //       );
  //     }
  //   };

  //   audio.addEventListener("timeupdate", handleTimeUpdate);

  //   return () => {
  //     audio.removeEventListener("timeupdate", handleTimeUpdate);
  //   };
  // }, [chords]);

  const handleChordClick = (timestamp) => {
    if (audioRef.current) {
      audioRef.current.currentTime = timestamp;
      audioRef.current.play();
    }
  };

  const transposeChords = (amount) => {
    setChords((prevChords) =>
      prevChords.map((chord) => ({
        ...chord,
        chord: transposeChord(chord.chord, amount),
      }))
    );
    setCapo((prevCapo) => prevCapo - amount);
  };

  const transposeChord = (chord, amount) => {
    const scale = [
      "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
    ];
    const normalizeMap = {
      Cb: "B", Db: "C#", Eb: "D#", Fb: "E", Gb: "F#", Ab: "G#", Bb: "A#",
      "E#": "F", "B#": "C",
    };

    return chord.replace(/[CDEFGAB](b|#)?/g, (match) => {
      let i =
        (scale.indexOf(normalizeMap[match] || match) + amount) % scale.length;
      return scale[i < 0 ? i + scale.length : i];
    });
  };

  const extractExtension = (filename) => {
    console.log(filename);
    console.log(filename?.split('.').pop());
    return filename?.split('.').pop();
  }

  return (
    <div>
      <header>
        <div id="control-bar">
          <h2>{filename}</h2>
          <audio ref={audioRef} controls>
            <source src={audioSrc} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
          <div id="transpose-bar">
            <button onClick={() => transposeChords(1)}>Up (+)</button>
            <button onClick={() => transposeChords(-1)}>Down (-)</button>
            <span style={{ fontSize: "large", gap: "7px", color: "var(--c1)" }}>
              CAPO <span id="capo-counter" style={{ color: "var(--c3)" }}>{capo}</span>
            </span>
            <input
              type="radio"
              id="guitar"
              name="instrument"
              value="guitar"
              checked={instrument === "guitar"}
              onChange={() => setInstrument("guitar")}
            />
            <label htmlFor="guitar">Guitar</label>
            <input
              type="radio"
              id="ukulele"
              name="instrument"
              value="ukulele"
              checked={instrument === "ukulele"}
              onChange={() => setInstrument("ukulele")}
            />
            <label htmlFor="ukulele">Ukulele</label>
          </div>
        </div>
        <div className="chord-diagram-bar" style={{ backgroundColor: "#fff2d2" }}>
          <ChordDiagram chord={currentChord} instrument={instrument} />
          <h3>{currentChord || "..."}</h3>
        </div>
        <div className="chord-diagram-bar" style={{ opacity: 0.7 }}>
          <ChordDiagram chord={nextChord} instrument={instrument} />
          <h3>{nextChord || "..."}</h3>
        </div>
      </header>
      <div>
        <button onClick={() => handleZoomIn()}>Zoom In</button>
        <button onClick={() => handleZoomOut()}>Zoom Out</button>
      </div>
      <ul id="chords">
        {chords.map((item, index) => (
          <li key={index} onClick={() => handleChordClick(item.timestamp)} className={`${item.classes}`} style={{ width: item.width + "px", animationDuration: item.duration + "s" }}>
            {item.chord}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
