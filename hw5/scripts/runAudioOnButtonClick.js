/**
 * Example:
 * runAudioOnButtonClick(main, 'btn-start');
 */
const runAudioOnButtonClick = (audioFunction, buttonId) => {
  console.assert(window);
  console.assert(document);
  console.assert(typeof audioFunction === 'function');

  window.addEventListener('load', () => {
    const startButtonEl = document.getElementById(buttonId);
    console.assert(startButtonEl);

    startButtonEl.addEventListener('click', async () => {
      startButtonEl.disabled = true;
      await audioFunction();
    }, {once: true});
  });
};

export default runAudioOnButtonClick;
