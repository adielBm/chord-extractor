import os
import argparse
from typing import Tuple
from chord_extractor.extractors import Chordino

# CONFIG
DEBUG = False

# CONSTANTS
SCRIPT_DIR = os.path.dirname(os.path.realpath(__file__)) # directory of this script file
CURRENT_DIR = os.getcwd() # current directory in terminal

def extract_chords_from_audio(audio_file):
    chordino = Chordino()
    c = chordino.preprocess(audio_file)
    chords = chordino.extract(audio_file)
    return chords

def generate_html_with_chords(audio_file, chords, imgurl, title):
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Chords: {title}</title>
        <script src="script.js"></script>
        <link rel="stylesheet" type="text/css" href="style.css" />
        <link rel="icon" href="favicon.svg" type="image/x-icon" />
    </head>
    <body>
    <header>
    <img src="{imgurl}" style="width: auto;border-radius: 10px;max-height: 100px;margin: auto;">
      <div id="control-bar">
        <h2>{title}</h2>
        <audio controls>
          <source
            src="{audio_file}"
            type="audio/mpeg"
          />
          Your browser does not support the audio element.
        </audio>
        <div id="transpose-bar">
          <button id="transpose-up">Up (+)</button>
          <button id="transpose-down">Down (-)</button> 
          <span style=" display: flex; justify-content: center; align-items: center; font-size: large; gap: 7px; color: var(--c1); ">

          CAPO
          <span id="capo-counter" style="color: var(--c3); ">0</span>
          </span>
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
        <div class="chord-diagram-bar">
            <img id="chord-diagram-current" src="empty.png"  />
            <h1 id="chord-current"></h1>
        </div>
        <div class="chord-diagram-bar">
            <img id="chord-diagram-next" src="empty.png" />
            <h1 id="chord-next"></h1>
        </div>
      </div>
    </header>
    <button id="zoom-in">zoom-in(+)</button><button id="zoom-out">zoom-out(-)</button>
    <ul id="chords">
    """
    for chord in chords:
        seconds = chord.timestamp
        chordLabel = chord.chord
        chordLabel = chordLabel.replace('6', '') # remove the digit 6 from chord.chord
        html_content += f"<li id='{seconds}'>{chordLabel}</li>"
    html_content += "</ul>"
    html_content += """
    </body>
    </html>
    """

    html_file = os.path.join(os.path.dirname(
        os.path.realpath(__file__)), "tmp.html")
    with open(html_file, "w", encoding="utf-8") as f:
        f.write(html_content)

    return html_file

def open_html_in_browser(html_file: str) -> None:
    os.system(f"start {html_file}")

def is_youtube_url(url: str) -> bool:
    return 'youtube.com' in url or 'youtu.be' in url

def download_audio_from_youtube(url: str) -> Tuple[str, str, str]:
    from yt_dlp import YoutubeDL
    
    tmp_file = f'{SCRIPT_DIR}/tmp.webm'
    if os.path.exists(tmp_file):
        os.remove(tmp_file)
    ydl_opts = {
        'overwrite': True,
        'format': 'bestaudio/best',
        'outtmpl': f'{SCRIPT_DIR}/tmp.%(ext)s',
    }
    with YoutubeDL(ydl_opts) as ydl:
        ydl.download([url])
        info_dict = ydl.extract_info(url, download=False)
        return f"{SCRIPT_DIR}\\tmp.webm", info_dict['thumbnail'], info_dict['title']

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Generate HTML with chords from audio file")
    parser.add_argument("audio_file", help="Path to the audio file")
    args = parser.parse_args()

    if DEBUG:
        print('args.audio_file: ', args.audio_file)
        print('CURRENT_DIR: ', CURRENT_DIR)
        print('CURRENT_DIR: ', SCRIPT_DIR)

    # youtube url
    if is_youtube_url(args.audio_file):
        print('The audio file is a youtube url: ', args.audio_file)
        audio_file, imgurl, title  = download_audio_from_youtube(args.audio_file)
        print('The audio file has been downloaded from youtube')
    # local file
    else: 
        audio_file = os.path.join(CURRENT_DIR, args.audio_file)
        imgurl = './default.jpg'
        # get file name from path without extension
        title = os.path.splitext(os.path.basename(audio_file))[0]

    chords = extract_chords_from_audio(audio_file) # Extract chords from audio file
    html_file = generate_html_with_chords(audio_file, chords, imgurl, title) # Generate HTML file with chords
    open_html_in_browser(html_file) # Open HTML file in browser
