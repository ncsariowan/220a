class GameTrak {
  constructor() {
    this.onUpdate = null;
    this._isPolling = false;
    this._boundPollGameTrak = this.pollGameTrak_.bind(this);
  }

  setOnUpdate(onUpdateCallback) {
    if (typeof onUpdateCallback === 'function') {
      this.onUpdate = onUpdateCallback;
    }
  }

  start() {
    console.assert('getGamepads' in navigator);
    window.addEventListener('gamepadconnected', (event) => {
      this._isPolling = true;
      this.pollGameTrak_();
    });
  }

  stop() {
    this._isPolling = false;
  }

  pollGameTrak_() {
    if (!this._isPolling)
      return;

    const gamepads = navigator.getGamepads();
    for (const gamepad of gamepads) {
      if (!gamepad) continue;
      // if (!gamepad.id.includes('Game-Trak')) continue;
      if (this.onUpdate) {
        // We only need the first 6 elements: [x1, y1, z1, x2, y2, z2]
        this.onUpdate({axes: gamepad.axes, buttons: gamepad.buttons});
      }
    }
    
    // TODO: This is not ideal. The rAF loop should come from the main app,
    // not in the utility class.
    requestAnimationFrame(this._boundPollGameTrak);
  }
}

export default GameTrak;