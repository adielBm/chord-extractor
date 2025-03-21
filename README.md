# Installation
- Requirements: 
    - Python (it's work for me on python 3.8.10)
    - [chord-extractor](https://github.com/ohollo/chord-extractor) and its requirements
    - https://code.soundsoftware.ac.uk/projects/vamp-plugin-pack/files to install `Chordino and NNLS Chroma` plugins
- You can either use the prebuilt react app in `dist` or build it yourself using `npm i` and `npm run build`.

# Usage
inside the project directory run 

```bash
# for a local file
python chord.py path/to/your/file.mp3

# for yt video/audio
python chord.py https://www.youtube.com/watch?v=your_video_id
```
