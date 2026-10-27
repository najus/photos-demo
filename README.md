# photos — UI experiments (demo)

Throwaway demo playground for [photos.sujanthapa.com](https://photos.sujanthapa.com).
**Not the live site** — experiments here get promoted to `najus/photos`
only when Sujan picks them.

Experiments, all running on the real 90 Flickr photos (`data.json`,
snapshotted from the live site's manifest, with dominant colours
computed from the thumbnails):

1. **Story hero** — Ken Burns autoplay opener with segment bars
2. **Editorial album index** — big-type rows, cursor-following previews
3. **Grid playground** — masonry / justified / square layouts, density,
   EXIF-on-hover, dominant-colour tile tinting, album filters, shuffle
4. **Filmstrip** — horizontal film-roll view of the Airplanes album
5. **Lightbox Pro** — ambient dominant-colour glow, thumbnail filmstrip,
   EXIF panel, keyboard + swipe
6. **Colour story** — the archive sorted by dominant colour
7. **Darkroom mode** — full dark theme toggle

Plain static HTML/CSS/JS, no build step. Delete this repo whenever —
nothing depends on it.
