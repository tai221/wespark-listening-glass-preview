const scene = document.querySelector('.scene');
const replayButton = document.querySelector('#replay');
const motionButton = document.querySelector('#motion');

function fitScene() {
  const scale = Math.min(window.innerWidth / 1672, window.innerHeight / 941);
  scene.style.setProperty('--scene-scale', scale);
}

fitScene();
window.addEventListener('resize', fitScene);

const waveHeights = [12, 22, 34, 43, 25, 37, 46, 29, 39, 24, 34, 19, 27, 14, 20, 10, 15, 7];
document.querySelectorAll('[data-wave]').forEach(wave => {
  waveHeights.forEach((height, index) => {
    const bar = document.createElement('i');
    bar.style.setProperty('--height', `${height}px`);
    bar.style.setProperty('--wave-delay', `${index * -0.12}s`);
    wave.append(bar);
  });
});

motionButton.addEventListener('click', () => {
  const paused = document.body.classList.toggle('paused');
  motionButton.setAttribute('aria-pressed', String(paused));
  motionButton.textContent = paused ? 'Tiếp tục hiệu ứng' : 'Tạm dừng hiệu ứng';
});

replayButton.addEventListener('click', () => {
  document.body.classList.remove('paused');
  motionButton.setAttribute('aria-pressed', 'false');
  motionButton.textContent = 'Tạm dừng hiệu ứng';
  document.body.classList.add('restart');
  void scene.offsetWidth;
  document.body.classList.remove('restart');
});
