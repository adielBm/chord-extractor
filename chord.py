import os
import argparse
import shutil
from typing import Tuple
from chord_extractor.extractors import Chordino
import http.server
import socketserver
import json
import webbrowser

# Define the port and handler
PORT = 8000

# Change the current directory to the folder containing index.html
os.chdir(os.path.dirname(os.path.realpath(__file__)))

# Set up the handler to serve files
Handler = http.server.SimpleHTTPRequestHandler

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

def copy_file_to_tmp(source_path):
    # Get the current directory (where the script is located)
    current_directory = os.path.dirname(os.path.abspath(__file__))
    # get the file name with extension
    filename = os.path.basename(source_path)
    # get the file extension
    _, file_extension = os.path.splitext(source_path)
    # Path to the destination file
    dest_directory = os.path.join(current_directory, 'dist')
    os.makedirs(dest_directory, exist_ok=True)  # Make sure the 'dist' folder exists
    dest_file = os.path.join(dest_directory, 'tmp' + file_extension)
    shutil.copy(source_path, dest_file)
    print(f"{source_path} has been copied to {dest_file}")
    return filename, dest_file

def generate_json_with_chords(filename, chords):
    # Create the structure for the JSON
    song_data = {
        "filename": filename,
        "chords": []
    }
    
    # Iterate through the chords and add them to the list
    for chord in chords:
        chord_data = {
            "timestamp": chord.timestamp,
            "chord": chord.chord
        }
        if chord.chord[0] in 'ABCDEFG':
            song_data["chords"].append(chord_data)
    
    # Define the file path where the JSON will be saved
    json_file = os.path.join(os.path.dirname(os.path.realpath(__file__)), "dist/chords.json")

    print(f"Writing JSON data to: {json_file}")
    
    # Write the JSON data to a file
    with open(json_file, "w", encoding="utf-8") as f:
        json.dump(song_data, f, indent=4)

def run_server():
    # Change the current directory to 'dist'
    os.chdir(os.path.join(SCRIPT_DIR, 'dist'))
    
    # Set up the server with the given handler
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving at http://localhost:{PORT}")
        webbrowser.open(f"http://localhost:{PORT}")
        httpd.serve_forever()        


def is_youtube_url(url: str) -> bool:
    return 'youtube.com' in url or 'youtu.be' in url

def download_audio_from_youtube(url: str) -> Tuple[str, str, str]:
    from yt_dlp import YoutubeDL
    # check if the file exists in `dist` folder
    tmp_file = os.path.join(SCRIPT_DIR, 'dist', 'tmp.webm')
    if os.path.exists(tmp_file):
        os.remove(tmp_file)
    ydl_opts = {
        'overwrite': True,
        'format': 'bestaudio/best',
        'outtmpl': tmp_file,
    }
    with YoutubeDL(ydl_opts) as ydl:
        ydl.download([url])
        info_dict = ydl.extract_info(url, download=False)
        return tmp_file, info_dict.get('title', None)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Generate HTML with chords from audio file")
    parser.add_argument("file", help="Path to the audio file")
    args = parser.parse_args()

    if DEBUG:
        print('args.file: ', args.file)
        print('CURRENT_DIR: ', CURRENT_DIR)
        print('CURRENT_DIR: ', SCRIPT_DIR)

    # youtube url
    if is_youtube_url(args.file):
        print('The audio file is a youtube url: ', args.file)
        tmp_path, title  = download_audio_from_youtube(args.file)
        tmp_filename = 'tmp.webm'
        print(f"The audio file has been downloaded: {tmp_path}")

    # local file
    else: 
        tmp_filename, tmp_path = copy_file_to_tmp(os.path.join(CURRENT_DIR, args.file))

    chords = extract_chords_from_audio(tmp_path)
    generate_json_with_chords(tmp_filename, chords)
    run_server()
