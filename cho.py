import os
import argparse
from chord_extractor.extractors import Chordino


def extract_chords_from_audio(audio_file):
    # Initialize Chordino
    chordino = Chordino()
    # Extract chords
    c = chordino.preprocess(audio_file)
    chords = chordino.extract(audio_file)
    return chords


def generate_html_with_chords(audio_file, chords):
    # Generate HTML content
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Chords from Audio</title>
        <script src="script.js"></script>
        <link rel="stylesheet" type="text/css" href="style.css" />
    </head>
    <body>
    <header>
      <div>
        <h4>File: {audio_file}</h4>
        <audio controls>
          <source
            src="{audio_file}"
            type="audio/mpeg"
          />
          Your browser does not support the audio element.
        </audio>
        <div>
       
          <button id="transpose-up">Transpose Up (+)</button>
          <button id="transpose-down">Transpose Down (-)</button>
          Transpose: <span id="transpose-counter">0</span>, Capo:
          <span id="capo-counter">0</span>
          <input
            type="radio"
            id="guitar"
            name="instrument"
            value="guitar"
            checked
          />
          <label for="guitar">Guitar</label>
          <input type="radio" id="ukulele" name="instrument" value="ukulele" />
          <label for="ukulele">Ukulele</label>
        </div>
      </div>
      <div id="chord-diagram-bar">
        <img id="chord-diagram-current" src="empty.png"  />
        <h1 id="chord-current"></h1>
        <div style=" width: 2px; height: 100%; display: block; background: #8d94b4; margin: 15px; "></div>
        <img id="chord-diagram-next" src="empty.png" />
        <h1 id="chord-next"></h1>
      </div>
    </header>
     <!-- btns for zoom in/out chords -->
          <button id="zoom-in">zoom-in(+)</button>
          <button id="zoom-out">zoom-out(-)</button>
        <ul id="chords">
    """

    #   

    # Add chords to HTML content
    for chord in chords:
        # seconds = int(chord.timestamp)
        seconds = chord.timestamp

        # remove the digit 6 from chord.chord
        # chordtext = chord.chord.replace('6', '')

        html_content += f"<li id='{seconds}'>{chord.chord}</li>"

    # Close HTML content
    html_content += """
        </ul>
    </body>
    </html>
    """

    # Write HTML content to a file
    html_file = os.path.join(os.path.dirname(
        os.path.realpath(__file__)), "tmp.html")
    with open(html_file, "w") as f:
        f.write(html_content)

    return html_file


def open_html_in_browser(html_file):
    # Open HTML file in default web browser
    os.system(f"start {html_file}")


def main(audio_file):
    # Extract chords from audio file
    chords = extract_chords_from_audio(audio_file)
    # Generate HTML file with chords
    html_file = generate_html_with_chords(audio_file, chords)
    # Open HTML file in browser
    open_html_in_browser(html_file)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Generate HTML with chords from audio file")
    parser.add_argument("audio_file", help="Path to the audio file")
    args = parser.parse_args()

    current_directory = os.getcwd()

    print('current_directory', current_directory)

    audio_file = os.path.join(current_directory, args.audio_file)

    print('audio_file', audio_file)

    main(audio_file)
