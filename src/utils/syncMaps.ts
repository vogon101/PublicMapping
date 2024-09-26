function moveToMapPosition(master: mapboxgl.Map, clones: mapboxgl.Map[]): void {
  const center = master.getCenter();
  const zoom = master.getZoom();
  const bearing = master.getBearing();
  const pitch = master.getPitch();

  clones.forEach((clone) => {
    clone.jumpTo({
      center: center,
      zoom: zoom,
      bearing: bearing,
      pitch: pitch
    });
  });
}

function syncMaps(...maps: mapboxgl.Map[]): () => void {
  // Create all the movement functions, because if they're created every time
  // they wouldn't be the same and couldn't be removed.
  const fns: ((_: mapboxgl.MapboxEvent) => void)[] = maps.map((map, index) => 
    (_: mapboxgl.MapboxEvent) => sync(map, maps.filter((_, i) => i !== index))
  );

  function on(): void {
    maps.forEach((map, index) => {
      map.on('moveend', fns[index]);
    });
  }

  function off(): void {
    maps.forEach((map, index) => {
      map.off('moveend', fns[index]);
    });
  }

  // When one map moves, we turn off the movement listeners
  // on all the maps, move it, then turn the listeners on again
  function sync(master: mapboxgl.Map, clones: mapboxgl.Map[]): void {
    off();
    moveToMapPosition(master, clones);
    on();
  }

  on();
  return () => {
    off();
  };
}

export default syncMaps;