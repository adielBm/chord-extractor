A little python script i made to extract chords from an audio file (using [ohollo/chord-extractor](https://github.com/ohollo/chord-extractor)) and visualize them in an HTML file along with chord diagrams (#TODO). you can also transpose the chords and view them in either guitar or ukulele mode.

- Requirements: Python, [chord-extractor](https://github.com/ohollo/chord-extractor) and its requirements )
- it's work for me on python 3.8.10
- https://code.soundsoftware.ac.uk/projects/vamp-plugin-pack/files to install `Chordino and NNLS Chroma` plugins

![Example](example.gif)

### Usage

```
C:\...\Music> python "C:\...\chord_extractor\cho.py" "song.mp3"

# or youtube 
> python "cho.py" "https://music.youtube.com/watch?v=32Oc2d_3yEk"
```

### TODO

- get chord diagrams for guitar or ukulele. something like:

```
/guitar/A.png
/guitar/Am.png
/ukulele/Dm.png
/ukulele/C.png
...
```


