document.addEventListener("DOMContentLoaded", function () {
  const audio = document.querySelector("audio");
  const chords = document.querySelectorAll("#chords li");
  const transposeCounter = document.getElementById("transpose-counter");
  const transposeUpButton = document.getElementById("transpose-up");
  const transposeDownButton = document.getElementById("transpose-down");
  const capoCounter = document.getElementById("capo-counter");
  const chordDiagramCurrent = document.getElementById("chord-diagram-current");
  const chordDiagramNext = document.getElementById("chord-diagram-next");
  const chordCurrent = document.getElementById("chord-current");
  const chordNext = document.getElementById("chord-next");

  let maxChordLength = 0;

  let instrument = "guitar";

  /* lisetner for chords, when click, jump the audio to the time of the id element clicked  */
  chords.forEach((chord) => {
    chord.addEventListener("click", function () {
      audio.currentTime = chord.id;
      audio.play();
    });
  });

  /* when user press on space key on keyboard play/pasue the audio */
  document.addEventListener("keydown", function (event) {
    if (event.code === "Space") {
      event.preventDefault();
      if (audio.paused) {
        audio.play();
      } else {
        audio.pause();
      }
    }
  });

  /* handle <input type="radio" name="instrument" /> */
  document.querySelectorAll('input[name="instrument"]').forEach((input) => {
    input.addEventListener("change", function () {
      instrument = this.value;
    });
  });

  /* add atriuite of length of each chord */
  chords.forEach((chord, index) => {
    var nextChord = chords[index + 1];
    if (nextChord) {
      var length = nextChord.id - chord.id;
      chord.setAttribute("length", length);
      if (length > maxChordLength) {
        maxChordLength = length;
      }
    }
  });

  /* set width of each chord */
  chords.forEach((chord) => {
    let length = chord.getAttribute("length");
    const n = 3;
    length = parseFloat(length).toFixed(n);
    let w = (length / maxChordLength.toFixed(n)) * 400;
    chord.style.width = w + "px";
  });

  /* chords.forEach setProperty('--animation-duration', length + 's'); */
  chords.forEach((chord) => {
    let length = chord.getAttribute("length");
    chord.style.setProperty("--animation-duration", length + "s");
  });

  /* scale the width of each chord by x */
  function scaleChordWidth(x) {
    chords.forEach((chord) => {
      chord.style.width = chord.style.width.replace("px", "") * x + "px";
    });
  }

  /* handle for #zoom-in and #zoom-out */
  document.getElementById("zoom-in").addEventListener("click", function () {
    scaleChordWidth(1.5);
  });

  document.getElementById("zoom-out").addEventListener("click", function () {
    scaleChordWidth(0.8);
  });

  transposeUpButton.addEventListener("click", function () {
    transposeChords(1);
    capoCounter.innerHTML = parseInt(capoCounter.innerHTML) - 1;
  });

  transposeDownButton.addEventListener("click", function () {
    transposeChords(-1);
    capoCounter.innerHTML = parseInt(capoCounter.innerHTML) + 1;
  });

  setInterval(function () {
    const currentTime = audio.currentTime;
    console.log(currentTime);
    chords.forEach((chord) => {
      if (chord.id <= currentTime) {
        chord.classList.add("actived");
      } else {
        chord.classList.remove("actived");
        chord.classList.remove("active");
      }

      if (chord.id - currentTime <= 0.3 && chord.id - currentTime >= 0) {
        chord.classList.add("active");

        if (chordCurrent.innerHTML != chord.innerHTML) {
          chordCurrent.innerHTML = chord.innerHTML;
          chordDiagramCurrent.src = `${instrument}/${encodeURIComponent(
            simplifyChord(chord.innerHTML)
          )}.png`;
        }

        if (chordNext.innerHTML != chord.nextElementSibling.innerHTML) {
          chordNext.innerHTML = chord.nextElementSibling.innerHTML;
          chordDiagramNext.src = `${instrument}/${encodeURIComponent(
            simplifyChord(chord.nextElementSibling.innerHTML)
          )}.png`;
        }
      } else {
        /* chord.classList.remove("active"); */
      }
    });
  }, 150);

  function transposeChords(amount) {
    chords.forEach((chord) => {
      chord.innerHTML = transposeChord(chord.innerHTML, amount);
    });
  }

  function transposeChord(chord, amount) {
    var scale = [
      "C",
      "C#",
      "D",
      "D#",
      "E",
      "F",
      "F#",
      "G",
      "G#",
      "A",
      "A#",
      "B",
    ];
    var normalizeMap = {
      Cb: "B",
      Db: "C#",
      Eb: "D#",
      Fb: "E",
      Gb: "F#",
      Ab: "G#",
      Bb: "A#",
      "E#": "F",
      "B#": "C",
    };
    return chord.replace(/[CDEFGAB](b|#)?/g, function (match) {
      var i =
        (scale.indexOf(normalizeMap[match] ? normalizeMap[match] : match) +
          amount) %
        scale.length;
      return scale[i < 0 ? i + scale.length : i];
    });
  }

  /* simplfy chord: remove after slash (include the slash) */
  function simplifyChord(chord) {
    return chord.replace(/\/.*/, "").replace("A#", "Bb").replace("D#", "Eb");
  }

});
